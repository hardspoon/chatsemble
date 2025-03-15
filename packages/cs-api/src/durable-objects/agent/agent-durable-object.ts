/// <reference types="@cloudflare/workers-types" />
/// <reference types="../../../worker-configuration" />

import { DurableObject } from "cloudflare:workers";
import type { ChatRoomMessage, ChatRoomMessagePartial } from "@/cs-shared";
//import { createOpenAI } from "@ai-sdk/openai";
import { createGroq } from "@ai-sdk/groq";
import { type CoreMessage, generateText } from "ai";
import { and, eq, isNotNull, lte, sql } from "drizzle-orm";
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
import type { AgentChatRoomNotification } from "./types";

const ALARM_TIME_IN_MS = 5 * 1000; // Standard wait time for batching messages

export class AgentDurableObject extends DurableObject<Env> {
	storage: DurableObjectStorage;
	db: DrizzleSqliteDODatabase;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.storage = ctx.storage;
		this.db = drizzle(this.storage, { logger: false });
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
		await this.ensureChatRoomExists(chatRoomId);

		const notificationId = this.getChatRoomNotificationId(chatRoomId, threadId);

		const notification = await this.db
			.select()
			.from(agentChatRoomNotification)
			.where(eq(agentChatRoomNotification.id, notificationId))
			.get();

		const now = Date.now();
		const pastProcessAt = notification?.processAt;

		if (!notification || !pastProcessAt || pastProcessAt < now) {
			const processAt = now + ALARM_TIME_IN_MS;

			await this.db
				.insert(agentChatRoomNotification)
				.values({
					id: notificationId,
					roomId: chatRoomId,
					threadId: threadId,
					processAt: processAt,
				})
				.onConflictDoUpdate({
					target: [agentChatRoomNotification.id],
					set: {
						processAt: processAt,
					},
				});

			// Always check if we need to update the alarm after adding/updating a notification
			await this.setChatRoomCheckAlarm();
		}
	}

	private async setChatRoomCheckAlarm() {
		// Check if there's already an alarm set
		const currentAlarm = await this.storage.getAlarm();

		// Only set a new alarm if there isn't one already
		if (!currentAlarm) {
			// Find the earliest processAt time from all notifications
			const nextProcessingResult = await this.db
				.select({
					minProcessAt: sql<number>`MIN(${agentChatRoomNotification.processAt})`,
				})
				.from(agentChatRoomNotification)
				.where(isNotNull(agentChatRoomNotification.processAt))
				.get();

			const earliestProcessAt = nextProcessingResult?.minProcessAt;

			if (earliestProcessAt) {
				console.log(
					`Setting new alarm for ${new Date(earliestProcessAt).toISOString()}`,
				);
				this.storage.setAlarm(earliestProcessAt);
			}
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
				),
			)
			.all();

		// Process each notification
		const processingPromises = notificationsToProcess.map(
			async (notification) => {
				try {
					await this.triggerGeneration(notification);
				} catch (error) {
					console.error(
						`Error processing notification ${notification.id}:`,
						error,
					);
				}
			},
		);

		await Promise.all(processingPromises);

		await this.setChatRoomCheckAlarm();
	}

	private async triggerGeneration(
		chatRoomNotification: AgentChatRoomNotification,
	) {
		const messageResult = await this.ctx.blockConcurrencyWhile(async () => {
			const messageWithContext = await this.getChatRoomMessagesWithContext(
				chatRoomNotification.roomId,
				{
					threadId: chatRoomNotification.threadId,
					lastProcessedId: chatRoomNotification.lastProcessedId,
					contextSize: 10,
				},
			);
			await this.db
				.update(agentChatRoomNotification)
				.set({ processAt: null })
				.where(eq(agentChatRoomNotification.id, chatRoomNotification.id));

			return messageWithContext;
		});

		if (messageResult.newMessages.length === 0) {
			return;
		}

		const aiMessage = await this.generateChatRoomMessagePartial({
			contextMessages: messageResult.contextMessages,
			newMessages: messageResult.newMessages,
			threadId: chatRoomNotification.threadId,
		});

		if (aiMessage) {
			await this.sendChatRoomMessage(chatRoomNotification.roomId, aiMessage);
		}

		const highestMessageId = Math.max(
			...messageResult.newMessages.map((msg) => msg.id),
		);

		if (highestMessageId > 0) {
			// Only update lastProcessedId, never clear processAt
			await this.db
				.update(agentChatRoomNotification)
				.set({
					lastProcessedId: highestMessageId,
				})
				.where(eq(agentChatRoomNotification.id, chatRoomNotification.id));
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
			messages, // TODO: Change to enum
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

	private async generateChatRoomMessagePartial({
		contextMessages,
		newMessages,
		threadId,
	}: {
		contextMessages: ChatRoomMessage[];
		newMessages: ChatRoomMessage[];
		threadId: number | null;
	}): Promise<ChatRoomMessagePartial | null> {
		const agentConfig = await this.getAgentConfig();

		if (!agentConfig) {
			throw new Error("Agent config not found");
		}

		// Check for mentions only in NEW messages
		const hasMentionsOfAgent = newMessages.some((message) =>
			message.mentions.some((mention) => mention.id === agentConfig.id),
		);

		if (!hasMentionsOfAgent) {
			// Only check if we should respond when there's no direct mention
			const aiMessages = chatRoomMessagesToAiMessages(newMessages); // TODO: Change how users or agents are encoded
			const shouldRespond = await this.shouldAiRespond(aiMessages);

			if (!shouldRespond) {
				console.log("shouldRespond", false);
				return null;
			}
		}

		console.log("shouldRespond", true);
		const aiMessages = chatRoomMessagesToAiMessages([
			...contextMessages,
			...newMessages,
		]);

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

	async getChatRoomMessagesWithContext(
		chatRoomId: string,
		{
			threadId,
			lastProcessedId,
			contextSize = 10, // Default context size
		}: {
			threadId: number | null;
			lastProcessedId: number | null;
			contextSize?: number;
		},
	) {
		const chatRoomDoId = this.env.CHAT_DURABLE_OBJECT.idFromString(chatRoomId);
		const chatRoomDO = this.env.CHAT_DURABLE_OBJECT.get(chatRoomDoId);

		// Get new messages (messages after lastProcessedId)
		const newMessages = lastProcessedId
			? await chatRoomDO.getMessages({
					threadId,
					afterId: lastProcessedId,
					limit: 50, // Reasonable limit for new messages
				})
			: await chatRoomDO.getMessages({
					threadId,
					limit: 50,
				});

		// Get context messages (messages before and including lastProcessedId)
		let contextMessages: ChatRoomMessage[] = [];
		if (lastProcessedId && contextSize > 0) {
			contextMessages = await chatRoomDO.getMessages({
				threadId,
				beforeId: lastProcessedId,
				limit: contextSize,
			});
		}

		// If we have a thread, ensure the thread message is included
		if (threadId) {
			const threadMessage = await chatRoomDO.getMessageById(threadId);
			if (threadMessage) {
				// Check if the thread message is already in either array
				const isThreadInNewMessages = newMessages.some(
					(msg) => msg.id === threadMessage.id,
				);
				const isThreadInContextMessages = contextMessages.some(
					(msg) => msg.id === threadMessage.id,
				);

				// Add to context if not already present
				if (!isThreadInNewMessages && !isThreadInContextMessages) {
					contextMessages = [threadMessage, ...contextMessages];
				}
			}
		}

		return {
			newMessages,
			contextMessages,
			allMessages: [...contextMessages, ...newMessages], // For convenience
		};
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
		await this.db
			.delete(agentChatRoomNotification)
			.where(eq(agentChatRoomNotification.roomId, id));
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
