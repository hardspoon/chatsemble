/// <reference types="@cloudflare/workers-types" />
/// <reference types="../../../worker-configuration" />

import { DurableObject } from "cloudflare:workers";
import type { ChatRoomMessage, ChatRoomMessagePartial } from "@/cs-shared";
//import { createOpenAI } from "@ai-sdk/openai";
import { createGroq } from "@ai-sdk/groq";
import { type CoreMessage, generateText } from "ai";
import { eq } from "drizzle-orm";
import {
	type DrizzleSqliteDODatabase,
	drizzle,
} from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";
import { nanoid } from "nanoid";
import { chatRoomMessagesToAiMessages } from "../../lib/ai/ai-utils";
import {
	getAgentPrompt,
	getAiCheckerPrompt,
	shouldRespondTools,
} from "../../lib/ai/prompts/agent-prompt";
import migrations from "./db/migrations/migrations";
import { agentChatRoom, agentConfig } from "./db/schema";

const ALARM_TIME_IN_MS = 5 * 1000;
const MAX_NOTIFICATION_TO_WAIT_FOR_CHECK = 3;
const MAX_CHECK_TIME_IN_MS = 6 * 1000; //  Should be bigger than ALARM_TIME_IN_MS
const MIN_CHECK_TIME_IN_MS = 1 * 1000;

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

	async alarm() {
		console.log("alarm");
		const chatRooms = await this.getChatRooms();

		const processingPromises = chatRooms.map(
			async ({ id, notifications, lastNotificationAt }) => {
				const shouldTriggerGeneration = await this.shouldTriggerGeneration(
					notifications,
					lastNotificationAt,
				);

				console.log("shouldTriggerGeneration", id, shouldTriggerGeneration);
				if (shouldTriggerGeneration) {
					await this.triggerGeneration(id, notifications);
				}
				//await this.triggerGeneration(id, notifications);
			},
		);

		// Process all chat rooms in parallel
		await Promise.all(processingPromises);

		// Check if we have pending notifications
		const chatRoomsToVerify = await this.getChatRooms();
		const chatRoomHasNotifications = chatRoomsToVerify.some(
			({ notifications }) => notifications > 0,
		);

		if (chatRoomHasNotifications) {
			this.setChatRoomCheckAlarm();
		}
	}

	async receiveNotification({ chatRoomId }: { chatRoomId: string }) {
		const chatRoom = await this.getChatRoom(chatRoomId);
		const newNotifications = chatRoom.notifications + 1;

		await this.updateChatRoom(chatRoomId, {
			notifications: newNotifications,
			lastNotificationAt: Date.now(),
		});

		console.log("receivedNotification", chatRoomId, newNotifications);

		this.setChatRoomCheckAlarm();
	}

	private async setChatRoomCheckAlarm() {
		const currentAlarm = await this.storage.getAlarm();
		if (!currentAlarm) {
			const alarmTime = Date.now() + ALARM_TIME_IN_MS;
			this.storage.setAlarm(alarmTime);
		}
	}

	private async shouldTriggerGeneration(
		notifications: number,
		lastNotificationAt: number,
	) {
		let triggerGeneration = false;
		if (notifications === 0) {
			return triggerGeneration;
		}

		if (notifications > MAX_NOTIFICATION_TO_WAIT_FOR_CHECK) {
			triggerGeneration = true;
		} else {
			const timeStep =
				(MAX_CHECK_TIME_IN_MS - MIN_CHECK_TIME_IN_MS) /
				MAX_NOTIFICATION_TO_WAIT_FOR_CHECK;

			const notificationTimeStep =
				(MAX_NOTIFICATION_TO_WAIT_FOR_CHECK - notifications + 1) * timeStep;

			const timeToCheck = MIN_CHECK_TIME_IN_MS + notificationTimeStep;

			const timeAgo = Date.now() - timeToCheck;

			const lastNotificationIsNewerThanTimeToCheck =
				lastNotificationAt > timeAgo;

			if (lastNotificationIsNewerThanTimeToCheck) {
				triggerGeneration = false;
			} else {
				triggerGeneration = true;
			}
		}

		return triggerGeneration;
	}

	private async triggerGeneration(chatRoomId: string, notifications: number) {
		const messages = await this.ctx.blockConcurrencyWhile(async () => {
			const messagesToGet = notifications + 10;
			const messages = await this.getChatRoomMessages(
				chatRoomId,
				messagesToGet,
			);

			await this.updateChatRoom(chatRoomId, {
				notifications: 0,
			});

			return messages;
		});

		console.log("messages", messages);

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

		console.log("toolResult", toolResult);

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
		const aiMessages = chatRoomMessagesToAiMessages(messages);
		console.log("aiMessages", aiMessages);
		const shouldRespond = await this.shouldAiRespond(aiMessages);

		console.log("shouldRespond", shouldRespond);

		if (!shouldRespond) {
			return null;
		}

		const result = await this.generateAiResponse(aiMessages);

		if (!result) {
			return null;
		}

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

	async upsertAgentConfig(
		agentConfigData: Omit<typeof agentConfig.$inferSelect, "id" | "createdAt">,
	) {
		const doId = this.ctx.id.toString();
		console.log({
			reason: "Upserting agent config",
			agentConfigData,
			doId,
		});
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

		console.log({
			reason: "Getting agent config",
			config,
		});

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

	async deleteChatRoom(id: string) {
		await this.db.delete(agentChatRoom).where(eq(agentChatRoom.id, id));
	}
}
