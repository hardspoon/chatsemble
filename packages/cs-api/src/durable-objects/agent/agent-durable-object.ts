/// <reference types="@cloudflare/workers-types" />
/// <reference types="../../../worker-configuration" />

import { DurableObject } from "cloudflare:workers";
import type { ChatRoomMessage, ChatRoomMessagePartial } from "@/cs-shared";
//import { createOpenAI } from "@ai-sdk/openai";
import { createGroq } from "@ai-sdk/groq";
import { type CoreMessage, generateText } from "ai";
import { eq, sql } from "drizzle-orm";
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
import { agentChatRoom, agentConfig } from "./db/schema";

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
 * 3. Each chatroom has its own independent processAt time, allowing for
 *    separate batching per conversation.
 *
 * This approach balances message batching with guaranteed response times.
 */

const ALARM_TIME_IN_MS = 5 * 1000; // Standard wait time for batching messages
const MAX_ALARM_TIME_IN_MS = 15 * 1000; // Maximum time a message can wait before processing

export class AgentDurableObject extends DurableObject<Env> {
	storage: DurableObjectStorage;
	db: DrizzleSqliteDODatabase;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.storage = ctx.storage;
		this.db = drizzle(this.storage, { logger: false });
		this.storage.deleteAlarm();
	}

	async migrate() {
		migrate(this.db, migrations);
	}

	async receiveNotification({ chatRoomId }: { chatRoomId: string }) {
		const chatRoom = await this.getChatRoom(chatRoomId);
		const newNotifications = chatRoom.notifications + 1;
		const now = Date.now();

		// Only update processAt time if:
		// 1. This is the first notification (notifications = 0)
		// 2. There is no existing processAt time
		// 3. The existing processAt time is more than MAX_ALARM_TIME_IN_MS from now
		//    (meaning it was set a long time ago and should be updated)

		let processAt = chatRoom.processAt;

		if (
			chatRoom.notifications === 0 ||
			!processAt ||
			processAt > now + MAX_ALARM_TIME_IN_MS
		) {
			// Set standard delay for new notification sequences
			processAt = now + ALARM_TIME_IN_MS;
		}
		// Otherwise keep the existing processAt time to prevent indefinite delays

		await this.updateChatRoom(chatRoomId, {
			notifications: newNotifications,
			processAt: processAt,
		});

		await this.setChatRoomCheckAlarm();
	}

	private async setChatRoomCheckAlarm() {
		const nextProcessingResult = await this.db
			.select({
				minProcessAt: sql<number>`MIN(${agentChatRoom.processAt})`,
			})
			.from(agentChatRoom)
			.where(sql`${agentChatRoom.processAt} IS NOT NULL`)
			.get();

		// Cancel any existing alarm
		await this.storage.deleteAlarm();

		// Set new alarm if there are rooms to process
		if (nextProcessingResult?.minProcessAt) {
			this.storage.setAlarm(nextProcessingResult.minProcessAt);
		}
	}

	async alarm() {
		const currentTime = Date.now();

		// Get chat rooms that are ready to be processed
		const chatRoomsToProcess = await this.db
			.select()
			.from(agentChatRoom)
			.where(
				sql`${agentChatRoom.processAt} <= ${currentTime} AND ${agentChatRoom.processAt} IS NOT NULL AND ${agentChatRoom.notifications} > 0`,
			)
			.all();

		// Process each chat room that's ready
		const processingPromises = chatRoomsToProcess.map(async (chatRoom) => {
			await this.triggerGeneration(chatRoom.id, chatRoom.notifications);
		});

		await Promise.all(processingPromises);

		// Set up the next alarm for any remaining chat rooms
		await this.setChatRoomCheckAlarm();
	}

	private async triggerGeneration(chatRoomId: string, notifications: number) {
		const messages = await this.ctx.blockConcurrencyWhile(async () => {
			const messagesToGet = notifications + 10;
			const messages = await this.getChatRoomMessages(
				chatRoomId,
				messagesToGet,
			);

			// Reset the processAt and notifications count after fetching messages
			await this.updateChatRoom(chatRoomId, {
				processAt: null,
				notifications: 0,
			});

			return messages;
		});

		const aiMessage = await this.generateChatRoomMessagePartial(messages);

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
	): Promise<ChatRoomMessagePartial | null> {
		const agentConfig = await this.getAgentConfig();

		if (!agentConfig) {
			throw new Error("Agent config not found");
		}
		const aiMessages = chatRoomMessagesToAiMessages(messages);

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

	async getChatRoomMessages(chatRoomId: string, limit?: number) {
		const chatRoomDoId = this.env.CHAT_DURABLE_OBJECT.idFromString(chatRoomId);

		const chatRoomDO = this.env.CHAT_DURABLE_OBJECT.get(chatRoomDoId);

		const messages = await chatRoomDO.selectMessages(limit);

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
		await this.db.delete(agentChatRoom).where(eq(agentChatRoom.id, id));
	}
}
