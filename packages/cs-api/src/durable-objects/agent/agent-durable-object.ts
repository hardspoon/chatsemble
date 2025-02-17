/// <reference types="@cloudflare/workers-types" />
/// <reference types="../../../worker-configuration" />

import { DurableObject } from "cloudflare:workers";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, type CoreMessage } from "ai";
import type { ChatRoomMessage, ChatRoomMessagePartial } from "@/cs-shared";
import { nanoid } from "nanoid";
import migrations from "./db/migrations/migrations";
import {
	drizzle,
	type DrizzleSqliteDODatabase,
} from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";
import { agentChatRoom, agentConfig } from "./db/schema";
import { eq } from "drizzle-orm";
import { chatRoomMessagesToAiMessages } from "../../lib/ai/ai-utils";
import { getAgentPrompt } from "../../lib/ai/prompts/agent-prompt";

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

	async alarm() {
		const chatRooms = await this.getChatRooms();

		for (const chatRoom of chatRooms) {
			if (chatRoom.notifications === 0) {
				continue;
			}

			const messagesToGet = chatRoom.notifications + 10;
			const messages = await this.getChatRoomMessages(
				chatRoom.id,
				messagesToGet,
			);

			const aiMessage = await this.generateChatRoomMessagePartial(messages);

			await this.sendChatRoomMessage(chatRoom.id, aiMessage);

			await this.updateChatRoom(chatRoom.id, {
				notifications: 0,
			});
		}
	}

	async receiveNotification({ chatRoomId }: { chatRoomId: string }) {
		const chatRoom = await this.getChatRoom(chatRoomId);
		const newNotifications = chatRoom.notifications + 1;

		await this.updateChatRoom(chatRoomId, {
			notifications: newNotifications,
		});

		const currentAlarm = await this.storage.getAlarm();
		if (currentAlarm) {
			await this.storage.deleteAlarm();
		}

		const secondsToWait = 10;
		const alarmTime = Date.now() + secondsToWait * 1000;
		this.storage.setAlarm(alarmTime);
	}

	private async generateChatRoomMessagePartial(
		messages: ChatRoomMessage[],
	): Promise<ChatRoomMessagePartial> {
		const aiMessages = chatRoomMessagesToAiMessages(messages);

		const result = await this.generateAiResponse(aiMessages);

		const agentConfig = await this.getAgentConfig();

		if (!agentConfig) {
			throw new Error("Agent config not found");
		}

		return {
			id: nanoid(),
			content: result,
			createdAt: Date.now(),
		};
	}

	private async generateAiResponse(messages: CoreMessage[]) {
		const agentConfig = await this.getAgentConfig();

		const openaiClient = createOpenAI({
			baseURL: this.env.AI_GATEWAY_OPENAI_URL,
			apiKey: this.env.OPENAI_API_KEY,
		});

		const result = await generateText({
			model: openaiClient("gpt-4o-mini"),
			system: getAgentPrompt({
				agentConfig,
			}),
			messages,
		});

		return result.text;
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

		const messages = await chatRoomDO.selectChatRoomMessages(limit);

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
}
