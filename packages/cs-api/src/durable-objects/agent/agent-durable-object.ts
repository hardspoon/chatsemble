/// <reference types="@cloudflare/workers-types" />
/// <reference types="../../../worker-configuration" />

import { DurableObject } from "cloudflare:workers";
import type { ChatRoomMessage, ChatRoomMessagePartial } from "@/cs-shared";
//import { createOpenAI } from "@ai-sdk/openai";
import { createGroq } from "@ai-sdk/groq";
import { type CoreMessage, generateText } from "ai";
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
import { createAgentDbServices } from "./db/services";
import type { AgentChatRoomQueueItem } from "./types";

const ALARM_TIME_IN_MS = 3 * 1000; // Standard wait time for batching messages

export class AgentDurableObject extends DurableObject<Env> {
	storage: DurableObjectStorage;
	db: DrizzleSqliteDODatabase;
	dbServices: ReturnType<typeof createAgentDbServices>;
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.storage = ctx.storage;
		this.db = drizzle(this.storage, { logger: false });
		this.dbServices = createAgentDbServices(this.db, this.ctx.id.toString());
	}

	async migrate() {
		migrate(this.db, migrations);
	}

	async receiveMessage({
		chatRoomId,
		message,
	}: {
		chatRoomId: string;
		message: ChatRoomMessage;
	}) {
		await this.ensureChatRoomExists(chatRoomId);

		const queueItem = await this.dbServices.getChatRoomQueueItem(
			chatRoomId,
			message.threadId,
		);

		const now = Date.now();
		const pastProcessAt = queueItem?.processAt;

		if (!queueItem || !pastProcessAt || pastProcessAt < now) {
			const processAt = now + ALARM_TIME_IN_MS;

			await this.dbServices.createOrUpdateChatRoomQueueItem({
				chatRoomId,
				threadId: message.threadId,
				processAt,
			});

			await this.setChatRoomCheckAlarm();
		}
	}

	private async setChatRoomCheckAlarm() {
		const currentAlarm = await this.storage.getAlarm();

		if (!currentAlarm) {
			const nextProcessingResult =
				await this.dbServices.getChatRoomQueueMinProcessAt();

			const earliestProcessAt = nextProcessingResult?.minProcessAt;

			if (earliestProcessAt) {
				await this.storage.setAlarm(earliestProcessAt);
			}
		}
	}

	async alarm() {
		const currentTime = Date.now();

		const queueItemsToProcess =
			await this.dbServices.getChatRoomQueueItemsToProcess(currentTime);

		const processingPromises = queueItemsToProcess.map(async (queueItem) => {
			try {
				await this.processNewMessages(queueItem);
			} catch (error) {
				console.error(`Error processing queue item ${queueItem.id}:`, error);
			}
		});

		await Promise.all(processingPromises);
		await this.setChatRoomCheckAlarm();
	}

	private async processNewMessages(chatRoomQueueItem: AgentChatRoomQueueItem) {
		const messageResult = await this.ctx.blockConcurrencyWhile(async () => {
			const messageWithContext = await this.gatherMessagesWithContext(
				chatRoomQueueItem.roomId,
				{
					threadId: chatRoomQueueItem.threadId,
					lastProcessedId: chatRoomQueueItem.lastProcessedId,
				},
			);
			await this.dbServices.clearChatRoomQueueProcessAt(chatRoomQueueItem.id);

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
					threadId: chatRoomQueueItem.threadId,
				});

				await this.sendResponse(chatRoomQueueItem.roomId, responseMessage);
			}
		}

		const highestMessageId = Math.max(
			...messageResult.newMessages.map((msg) => msg.id),
		);

		if (highestMessageId > 0) {
			await this.dbServices.updateChatRoomQueueLastProcessedId(
				chatRoomQueueItem.id,
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
		const agentConfig = await this.dbServices.getAgentConfig();
		return messages.some((message) =>
			message.mentions.some((mention) => mention.id === agentConfig.id),
		);
	}

	private async checkIfMessagesAreRelevant(messages: CoreMessage[]) {
		const agentConfig = await this.dbServices.getAgentConfig();

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
		const agentConfig = await this.dbServices.getAgentConfig();

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
		agentConfigData: Parameters<typeof this.dbServices.upsertAgentConfig>[0],
	) {
		await this.dbServices.upsertAgentConfig(agentConfigData);
	}

	async addChatRoom(
		chatRoom: Parameters<typeof this.dbServices.addChatRoom>[0],
	) {
		await this.dbServices.addChatRoom(chatRoom);
	}

	async deleteChatRoom(chatRoomId: string) {
		await this.dbServices.deleteChatRoom(chatRoomId);
	}

	private async ensureChatRoomExists(chatRoomId: string) {
		try {
			await this.dbServices.getChatRoom(chatRoomId);
		} catch (error) {
			console.log(
				`Chat room ${chatRoomId} not found, creating it: ${error instanceof Error ? error.message : String(error)}`,
			);

			const chatRoomDO = this.env.CHAT_DURABLE_OBJECT.get(
				this.env.CHAT_DURABLE_OBJECT.idFromString(chatRoomId),
			);

			const config = await chatRoomDO.getConfig();

			await this.dbServices.addChatRoom({
				id: chatRoomId,
				name: config.name,
				organizationId: config.organizationId,
			});
		}
	}
}
