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

		const notification = await this.getChatRoomNotification(
			chatRoomId,
			threadId,
		);

		const now = Date.now();
		const pastProcessAt = notification?.processAt;

		if (!notification || !pastProcessAt || pastProcessAt < now) {
			const processAt = now + ALARM_TIME_IN_MS;

			await this.createOrUpdateChatRoomNotification({
				chatRoomId,
				threadId,
				processAt,
			});

			await this.setChatRoomCheckAlarm();
		}
	}

	private async setChatRoomCheckAlarm() {
		const currentAlarm = await this.storage.getAlarm();

		if (!currentAlarm) {
			const nextProcessingResult = await this.db
				.select({
					minProcessAt: sql<number>`MIN(${agentChatRoomNotification.processAt})`,
				})
				.from(agentChatRoomNotification)
				.where(isNotNull(agentChatRoomNotification.processAt))
				.get();

			const earliestProcessAt = nextProcessingResult?.minProcessAt;

			if (earliestProcessAt) {
				await this.storage.setAlarm(earliestProcessAt);
			}
		}
	}

	async alarm() {
		const currentTime = Date.now();

		const notificationsToProcess =
			await this.getChatRoomNotificationsToProcess(currentTime);

		const processingPromises = notificationsToProcess.map(
			async (notification) => {
				try {
					await this.processNewMessages(notification);
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

	private async processNewMessages(
		chatRoomNotification: AgentChatRoomNotification,
	) {
		const messageResult = await this.ctx.blockConcurrencyWhile(async () => {
			const messageWithContext = await this.gatherMessagesWithContext(
				chatRoomNotification.roomId,
				{
					threadId: chatRoomNotification.threadId,
					lastProcessedId: chatRoomNotification.lastProcessedId,
				},
			);
			await this.clearChatRoomNotificationProcessAt(chatRoomNotification.id);

			return messageWithContext;
		});

		if (messageResult.newMessages.length === 0) {
			return;
		}

		const needsResponse = await this.evaluateNeedForResponse(
			messageResult.newMessages,
		);

		if (needsResponse) {
			const responseText = await this.formulateResponse([
				...messageResult.contextMessages,
				...messageResult.newMessages,
			]);

			if (responseText) {
				const responseMessage = this.prepareResponseMessage({
					content: responseText,
					threadId: chatRoomNotification.threadId,
				});

				await this.sendResponse(chatRoomNotification.roomId, responseMessage);
			}
		}

		const highestMessageId = Math.max(
			...messageResult.newMessages.map((msg) => msg.id),
		);

		if (highestMessageId > 0) {
			// Only update lastProcessedId, never clear processAt
			await this.updateChatRoomNotificationLastProcessedId(
				chatRoomNotification.id,
				highestMessageId,
			);
		}
	}

	// Step 1: Gather messages and context
	private async gatherMessagesWithContext(
		chatRoomId: string,
		{
			threadId,
			lastProcessedId,
			contextSize = 10,
		}: {
			threadId: number | null;
			lastProcessedId: number | null;
			contextSize?: number;
		},
	) {
		const chatRoomDoId = this.env.CHAT_DURABLE_OBJECT.idFromString(chatRoomId);
		const chatRoomDO = this.env.CHAT_DURABLE_OBJECT.get(chatRoomDoId);

		const newMessages = lastProcessedId
			? await chatRoomDO.getMessages({
					threadId,
					afterId: lastProcessedId,
				})
			: await chatRoomDO.getMessages({
					threadId,
				});

		let contextMessages: ChatRoomMessage[] = [];
		if (lastProcessedId && contextSize > 0) {
			contextMessages = await chatRoomDO.getMessages({
				threadId,
				beforeId: lastProcessedId,
				limit: contextSize,
			});
		}

		if (threadId) {
			const threadMessage = await chatRoomDO.getMessageById(threadId);
			if (threadMessage) {
				contextMessages = [threadMessage, ...contextMessages];
			}
		}

		return {
			newMessages,
			contextMessages,
			allMessages: [...contextMessages, ...newMessages],
		};
	}

	private async evaluateNeedForResponse(
		messages: ChatRoomMessage[],
	): Promise<boolean> {
		const hasMentionsOfAgent = await this.checkIfImMentioned(messages);

		if (hasMentionsOfAgent) {
			return true;
		}

		const aiMessages = chatRoomMessagesToAiMessages(messages);
		const isRelevant = await this.checkIfMessagesAreRelevant(aiMessages);
		return isRelevant;
	}

	private async checkIfImMentioned(messages: ChatRoomMessage[]) {
		const agentConfig = await this.getAgentConfig();
		return messages.some((message) =>
			message.mentions.some((mention) => mention.id === agentConfig.id),
		);
	}

	private async checkIfMessagesAreRelevant(messages: CoreMessage[]) {
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

	private async formulateResponse(messages: ChatRoomMessage[]) {
		const agentConfig = await this.getAgentConfig();

		const groqClient = createGroq({
			baseURL: this.env.AI_GATEWAY_GROQ_URL,
			apiKey: this.env.GROQ_API_KEY,
		});

		const aiMessages = chatRoomMessagesToAiMessages(messages);
		const result = await generateText({
			model: groqClient("llama-3.3-70b-versatile"),
			system: getAgentPrompt({
				agentConfig,
			}),
			messages: aiMessages,
		});

		return result.text;
	}

	private prepareResponseMessage({
		content,
		threadId,
	}: {
		content: string;
		threadId: number | null;
	}): ChatRoomMessagePartial {
		return {
			id: Date.now() + Math.random() * 1000000,
			content,
			mentions: [],
			createdAt: Date.now(),
			threadId,
		};
	}

	private getChatRoomNotificationId(
		chatRoomId: string,
		threadId: number | null,
	): string {
		return threadId === null ? `${chatRoomId}:` : `${chatRoomId}:${threadId}`;
	}

	private async createOrUpdateChatRoomNotification({
		chatRoomId,
		threadId,
		processAt,
	}: {
		chatRoomId: string;
		threadId: number | null;
		processAt: number;
	}) {
		const notificationId = this.getChatRoomNotificationId(chatRoomId, threadId);

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
	}

	private async clearChatRoomNotificationProcessAt(notificationId: string) {
		await this.db
			.update(agentChatRoomNotification)
			.set({ processAt: null })
			.where(eq(agentChatRoomNotification.id, notificationId));
	}

	private async updateChatRoomNotificationLastProcessedId(
		notificationId: string,
		lastProcessedId: number,
	) {
		await this.db
			.update(agentChatRoomNotification)
			.set({
				lastProcessedId: lastProcessedId,
			})
			.where(eq(agentChatRoomNotification.id, notificationId));
	}

	private async getChatRoomNotificationsToProcess(currentTime: number) {
		return this.db
			.select()
			.from(agentChatRoomNotification)
			.where(
				and(
					lte(agentChatRoomNotification.processAt, currentTime),
					isNotNull(agentChatRoomNotification.processAt),
				),
			)
			.all();
	}

	private async getChatRoomNotification(
		chatRoomId: string,
		threadId: number | null,
	) {
		const notificationId = this.getChatRoomNotificationId(chatRoomId, threadId);

		return this.db
			.select()
			.from(agentChatRoomNotification)
			.where(eq(agentChatRoomNotification.id, notificationId))
			.get();
	}

	private async sendResponse(
		chatRoomId: string,
		message: ChatRoomMessagePartial,
	) {
		const chatRoomDoId = this.env.CHAT_DURABLE_OBJECT.idFromString(chatRoomId);
		const chatRoomDO = this.env.CHAT_DURABLE_OBJECT.get(chatRoomDoId);

		await chatRoomDO.receiveChatRoomMessage(this.ctx.id.toString(), message, {
			notifyAgents: false,
		});
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

	private async ensureChatRoomExists(chatRoomId: string) {
		try {
			await this.getChatRoom(chatRoomId);
		} catch (error) {
			console.log(
				`Chat room ${chatRoomId} not found, creating it: ${error instanceof Error ? error.message : String(error)}`,
			);

			const chatRoomDO = this.env.CHAT_DURABLE_OBJECT.get(
				this.env.CHAT_DURABLE_OBJECT.idFromString(chatRoomId),
			);

			const config = await chatRoomDO.getConfig();

			await this.addChatRoom({
				id: chatRoomId,
				name: config.name,
				organizationId: config.organizationId,
			});
		}
	}
}
