/// <reference types="@cloudflare/workers-types" />
/// <reference types="../../../worker-configuration" />

import { DurableObject } from "cloudflare:workers";
import type { ChatRoomMessage, ChatRoomMessagePartial } from "@/cs-shared";
//import { createOpenAI } from "@ai-sdk/openai";
import { createGroq } from "@ai-sdk/groq";
import { type CoreMessage, generateText } from "ai";
import { and, eq, gt, isNotNull, lte, sql } from "drizzle-orm";
import {
	type DrizzleSqliteDODatabase,
	drizzle,
} from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";
import { chatRoomMessagesToAiMessages } from "../../lib/ai/ai-utils";
import {
	getAgentPrompt,
	getAiCheckerPrompt,
	shouldRespondTools,
} from "../../lib/ai/prompts/agent-prompt";
import migrations from "./db/migrations/migrations";
import {
	agentChatRoom,
	agentChatRoomNotification,
	agentConfig,
} from "./db/schema";

/**
 * Agent message batching strategy:
 *
 * 1. When a notification arrives, we set a processAt time (current time + 5 seconds)
 *    if one of these conditions is met:
 *    - This is the first notification (notifications = 0)
 *    - There is no existing processAt time
 *    - The existing processAt time is too far in the future (> 15 seconds from now)
 *
 * 2. If there's already a processAt time set and none of the above conditions are met,
 *    we keep the existing processAt time. This prevents indefinite delays when
 *    messages continuously arrive.
 *
 * 3. Each chatroom/thread has its own independent processAt time, allowing for
 *    separate batching per conversation context.
 *
 * This approach balances message batching with guaranteed response times.
 */

// TODO: Test more with different values, currently anything above 9 seconds is not working
const ALARM_TIME_IN_MS = 15 * 1000; // Standard wait time for batching messages
const MAX_ALARM_TIME_IN_MS = 25 * 1000; // Maximum time a message can wait before processing

export class AgentDurableObject extends DurableObject<Env> {
	storage: DurableObjectStorage;
	db: DrizzleSqliteDODatabase;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.storage = ctx.storage;
		this.db = drizzle(this.storage, { logger: false });
		//this.storage.deleteAlarm();
	}

	async migrate() {
		migrate(this.db, migrations);
	}

	async receiveNotification({
		chatRoomId,
		threadId,
	}: {
		chatRoomId: string;
		threadId: number | null;
	}) {
		// Ensure the chat room exists in agentChatRoom
		await this.ensureChatRoomExists(chatRoomId);

		// Create a unique notification ID by combining roomId and threadId
		const notificationId = this.getChatRoomNotificationId(chatRoomId, threadId);

		// Try to get existing notification record
		const notification = await this.db
			.select()
			.from(agentChatRoomNotification)
			.where(eq(agentChatRoomNotification.id, notificationId))
			.get();

		const now = Date.now();
		let processAt = notification?.processAt;
		const newNotifications = (notification?.notifications || 0) + 1;

		// Determine if we need to update the processAt time
		if (
			!notification ||
			notification.notifications === 0 ||
			!processAt ||
			processAt > now + MAX_ALARM_TIME_IN_MS
		) {
			// Set standard delay for new notification sequences
			processAt = now + ALARM_TIME_IN_MS;
		}

		// Upsert the notification record
		await this.db
			.insert(agentChatRoomNotification)
			.values({
				id: notificationId,
				roomId: chatRoomId,
				threadId: threadId,
				notifications: newNotifications,
				processAt: processAt,
			})
			.onConflictDoUpdate({
				target: [agentChatRoomNotification.id],
				set: {
					notifications: newNotifications,
					processAt: processAt,
				},
			});

		await this.setChatRoomCheckAlarm();
	}

	private async setChatRoomCheckAlarm() {
		// Find the earliest processAt time from all notifications
		const nextProcessingResult = await this.db
			.select({
				minProcessAt: sql<number>`MIN(${agentChatRoomNotification.processAt})`,
			})
			.from(agentChatRoomNotification)
			.where(isNotNull(agentChatRoomNotification.processAt))
			.get();

		// Cancel any existing alarm
		await this.storage.deleteAlarm();

		// Set new alarm if there are notifications to process
		if (nextProcessingResult?.minProcessAt) {
			this.storage.setAlarm(nextProcessingResult.minProcessAt);
		}
	}

	async alarm() {
		const currentTime = Date.now();

		const notificationsToProcess = await this.db
			.select()
			.from(agentChatRoomNotification)
			.where(
				and(
					lte(agentChatRoomNotification.processAt, currentTime),
					isNotNull(agentChatRoomNotification.processAt),
					gt(agentChatRoomNotification.notifications, 0),
				),
			)
			.all();

		// Process each notification
		const processingPromises = notificationsToProcess.map(
			async (notification) => {
				await this.triggerGeneration(
					notification.roomId,
					notification.threadId,
					notification.notifications,
				);
			},
		);

		await Promise.all(processingPromises);

		// Set up the next alarm for any remaining notifications
		await this.setChatRoomCheckAlarm();
	}

	private async triggerGeneration(
		chatRoomId: string,
		threadId: number | null,
		notifications: number,
	) {
		const messages = await this.ctx.blockConcurrencyWhile(async () => {
			const messagesToGet = notifications + 10;
			const messages = await this.getChatRoomMessages(chatRoomId, {
				limit: messagesToGet,
				threadId: threadId,
			});

			// Reset the notification after processing
			const notificationId = this.getChatRoomNotificationId(
				chatRoomId,
				threadId,
			);
			await this.db
				.update(agentChatRoomNotification)
				.set({
					processAt: null,
					notifications: 0,
				})
				.where(eq(agentChatRoomNotification.id, notificationId));

			return messages;
		});

		const aiMessage = await this.generateChatRoomMessagePartial(
			messages,
			threadId,
		);

		if (aiMessage) {
			await this.sendChatRoomMessage(chatRoomId, aiMessage);
		}
	}

	private async shouldAiRespond(messages: CoreMessage[]) {
		const agentConfig = await this.getAgentConfig();

		const groqClient = createGroq({
			baseURL: this.env.AI_GATEWAY_GROQ_URL,
			apiKey: this.env.GROQ_API_KEY,
		});

		const result = await generateText({
			model: groqClient("llama-3.1-8b-instant"),
			system: getAiCheckerPrompt({
				agentConfig,
			}),
			messages,
			tools: shouldRespondTools,
			toolChoice: "required",
		});

		const toolResult = result.toolResults;

		const shouldRespond = toolResult.some(
			(toolResult) =>
				toolResult.toolName === "shouldRespond" &&
				toolResult.args.shouldRespond,
		);

		return shouldRespond;
	}

	private async generateAiResponse(messages: CoreMessage[]) {
		const agentConfig = await this.getAgentConfig();

		const groqClient = createGroq({
			baseURL: this.env.AI_GATEWAY_GROQ_URL,
			apiKey: this.env.GROQ_API_KEY,
		});

		const result = await generateText({
			model: groqClient("llama-3.3-70b-versatile"),
			system: getAgentPrompt({
				agentConfig,
			}),
			messages,
		});

		return result.text;
	}

	private async generateChatRoomMessagePartial(
		messages: ChatRoomMessage[],
		threadId: number | null,
	): Promise<ChatRoomMessagePartial | null> {
		const agentConfig = await this.getAgentConfig();

		if (!agentConfig) {
			throw new Error("Agent config not found");
		}
		const aiMessages = chatRoomMessagesToAiMessages(messages);

		// TODO: Ensure mentions are only within the notification messages and not older ones
		const hasMentionsOfAgent = messages.some((message) =>
			message.mentions.some((mention) => mention.id === agentConfig.id),
		);

		if (!hasMentionsOfAgent) {
			// TODO: The prompt for this should be better it currently answers when it shouldn't
			const shouldRespond = await this.shouldAiRespond(aiMessages);

			if (!shouldRespond) {
				console.log("shouldRespond", false);
				return null;
			}
		}

		console.log("shouldRespond", true);

		const result = await this.generateAiResponse(aiMessages);

		if (!result) {
			return null;
		}

		return {
			id: Date.now() + Math.random() * 1000000,
			content: result,
			mentions: [],
			createdAt: Date.now(),
			threadId: threadId,
		};
	}

	async upsertAgentConfig(
		agentConfigData: Omit<typeof agentConfig.$inferSelect, "id" | "createdAt">,
	) {
		const doId = this.ctx.id.toString();
		await this.db
			.insert(agentConfig)
			.values({
				...agentConfigData,
				id: doId,
			})
			.onConflictDoUpdate({
				target: [agentConfig.id],
				set: {
					image: agentConfigData.image,
					name: agentConfigData.name,
					systemPrompt: agentConfigData.systemPrompt,
				},
			});
	}

	async getAgentConfig() {
		const config = await this.db
			.select()
			.from(agentConfig)
			.where(eq(agentConfig.id, this.ctx.id.toString()))
			.get();

		if (!config) {
			throw new Error("Agent config not found");
		}

		return config;
	}

	async sendChatRoomMessage(
		chatRoomId: string,
		message: ChatRoomMessagePartial,
	) {
		const chatRoomDoId = this.env.CHAT_DURABLE_OBJECT.idFromString(chatRoomId);

		const chatRoomDO = this.env.CHAT_DURABLE_OBJECT.get(chatRoomDoId);

		await chatRoomDO.receiveChatRoomMessage(this.ctx.id.toString(), message, {
			notifyAgents: false,
		});
	}

	async getChatRoomMessages(
		chatRoomId: string,
		options: {
			limit?: number;
			threadId?: number | null;
		},
	) {
		const chatRoomDoId = this.env.CHAT_DURABLE_OBJECT.idFromString(chatRoomId);

		const chatRoomDO = this.env.CHAT_DURABLE_OBJECT.get(chatRoomDoId);

		const messages = await chatRoomDO.getMessages({
			limit: options.limit,
			threadId: options.threadId,
		});

		if (options.threadId) {
			const threadMessage = await chatRoomDO.getMessageById(options.threadId);
			if (!threadMessage) {
				throw new Error("Thread message not found");
			}

			return [threadMessage, ...messages];
		}

		return messages;
	}

	async getChatRooms() {
		const chatRooms = await this.db.select().from(agentChatRoom);

		return chatRooms;
	}

	async getChatRoom(id: string) {
		const chatRoom = await this.db
			.select()
			.from(agentChatRoom)
			.where(eq(agentChatRoom.id, id))
			.get();

		if (!chatRoom) {
			throw new Error("Chat room not found");
		}

		return chatRoom;
	}

	async updateChatRoom(
		chatRoomId: string,
		chatRoom: Partial<typeof agentChatRoom.$inferSelect>,
	) {
		await this.db
			.update(agentChatRoom)
			.set(chatRoom)
			.where(eq(agentChatRoom.id, chatRoomId));
	}

	async addChatRoom(chatRoom: typeof agentChatRoom.$inferInsert) {
		await this.db
			.insert(agentChatRoom)
			.values(chatRoom)
			.onConflictDoUpdate({
				target: [agentChatRoom.id],
				set: {
					name: chatRoom.name,
				},
			});
	}

	async deleteChatRoom(id: string) {
		await this.db.delete(agentChatRoomNotification).where(eq(agentChatRoomNotification.roomId, id));
		await this.db.delete(agentChatRoom).where(eq(agentChatRoom.id, id));
	}

	// Helper to generate a consistent notification ID
	private getChatRoomNotificationId(
		chatRoomId: string,
		threadId: number | null,
	): string {
		return threadId === null ? `${chatRoomId}:` : `${chatRoomId}:${threadId}`;
	}

	// Helper to ensure the chat room exists in agentChatRoom table
	private async ensureChatRoomExists(chatRoomId: string) {
		try {
			await this.getChatRoom(chatRoomId);
		} catch (error) {
			// If the chat room doesn't exist due to error, create a basic entry
			console.log(
				`Chat room ${chatRoomId} not found, creating it: ${error instanceof Error ? error.message : String(error)}`,
			);

			const chatRoomDO = this.env.CHAT_DURABLE_OBJECT.get(
				this.env.CHAT_DURABLE_OBJECT.idFromString(chatRoomId),
			);

			// Get basic info from the chat room
			const config = await chatRoomDO.getConfig();

			await this.addChatRoom({
				id: chatRoomId,
				name: config.name,
				organizationId: config.organizationId,
			});
		}
	}
}
