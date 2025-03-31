import { DurableObject } from "cloudflare:workers";
import { createOpenAI } from "@ai-sdk/openai";
import {
	agentMessagesToContextCoreMessages,
	processDataStream,
} from "@server/ai/ai-utils";
import { agentSystemPrompt } from "@server/ai/prompts/agent-prompt";
import type { ChatRoomMessage, ChatRoomMessagePartial } from "@shared/types";
import {
	type DataStreamWriter,
	createDataStreamResponse,
	smoothStream,
	streamText,
} from "ai";
import {
	type DrizzleSqliteDODatabase,
	drizzle,
} from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";
import migrations from "./db/migrations/migrations.js";
import { createAgentDbServices } from "./db/services";
import { webSearchTool } from "@server/ai/tools/web-search-tool.js";
import { deepResearchTool } from "@server/ai/tools/deep-search-tool.js";
import { createMessageThreadTool } from "@server/ai/tools/create-thread-tool.js";
import { webCrawlerTool } from "@server/ai/tools/web-crawler-tool.js";

export class AgentDurableObject extends DurableObject<Env> {
	storage: DurableObjectStorage;
	db: DrizzleSqliteDODatabase;
	dbServices: ReturnType<typeof createAgentDbServices>;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.storage = ctx.storage;
		this.db = drizzle(this.storage, { logger: false });
		this.ctx.blockConcurrencyWhile(async () => {
			await this.migrate();
		});
		this.dbServices = createAgentDbServices(this.db, this.ctx.id.toString());
	}

	async migrate() {
		migrate(this.db, migrations);
	}

	async processAndRespond({
		chatRoomId,
		threadId,
		newMessages,
		contextMessages,
	}: {
		chatRoomId: string;
		threadId: number | null;
		newMessages: ChatRoomMessage[];
		contextMessages: ChatRoomMessage[];
	}) {
		console.log("[processAndRespond] received messages", {
			chatRoomId,
			threadId,
			newMessages,
			contextMessages,
		});

		if (newMessages.length === 0) {
			console.log("[processAndRespond] No new messages to process.");
			return;
		}

		// @ts-ignore
		await this.formulateResponse({
			chatRoomId,
			threadId,
			newMessages,
			contextMessages,
			onMessage: async ({ newMessagePartial, existingMessageId }) => {
				console.log(
					"[processAndRespond] onMessage",
					JSON.parse(
						JSON.stringify({
							newMessagePartial,
							existingMessageId,
						}),
					),
				);
				const newMessage = await this.sendResponse({
					chatRoomId: chatRoomId,
					message: newMessagePartial,
					existingMessageId: existingMessageId ?? null,
				});
				return newMessage;
			},
		});
	}

	private async formulateResponse({
		chatRoomId,
		threadId: originalThreadId,
		newMessages,
		contextMessages,
		onMessage,
	}: {
		chatRoomId: string;
		threadId: number | null;
		newMessages: ChatRoomMessage[];
		contextMessages: ChatRoomMessage[];
		onMessage: ({
			newMessagePartial,
			existingMessageId,
		}: {
			newMessagePartial: ChatRoomMessagePartial;
			existingMessageId?: number | null;
		}) => Promise<ChatRoomMessage>;
	}) {
		console.log("[formulateResponse] chatRoomId", chatRoomId);
		const agentConfig = await this.dbServices.getAgentConfig();

		const openAIClient = createOpenAI({
			baseURL: this.env.AI_GATEWAY_OPENAI_URL,
			apiKey: this.env.OPENAI_API_KEY,
		});

		let sendMessageThreadId: number | null = originalThreadId;
		console.log("[formulateResponse] sendMessageThreadId", sendMessageThreadId);

		const agentToolSet = (dataStream: DataStreamWriter) => {
			return {
				webSearch: webSearchTool(dataStream),
				deepResearch: deepResearchTool(dataStream),
				webCrawl: webCrawlerTool(dataStream),
				createMessageThread: createMessageThreadTool({
					onMessage,
					onNewThread: (newThreadId) => {
						console.log("[formulateResponse] onNewThread", newThreadId);
						sendMessageThreadId = newThreadId;
					},
				}),
			};
		};

		const systemPrompt = agentSystemPrompt({
			agentConfig,
			chatRoomId: chatRoomId,
			threadId: sendMessageThreadId,
		});

		const messages = agentMessagesToContextCoreMessages(
			contextMessages,
			newMessages,
		);

		const dataStreamResponse = createDataStreamResponse({
			execute: async (dataStream) => {
				streamText({
					model: openAIClient("gpt-4o"),
					system: systemPrompt,
					tools: agentToolSet(dataStream),
					messages,
					maxSteps: 10,
					experimental_transform: smoothStream({
						chunking: "line",
					}),
				}).mergeIntoDataStream(dataStream);
			},
		});

		await processDataStream({
			response: dataStreamResponse,
			getThreadId: () => sendMessageThreadId,
			omitSendingTool: ["createMessageThread"],
			onMessageSend: onMessage,
		});
	}

	private async sendResponse({
		chatRoomId,
		message,
		existingMessageId,
	}: {
		chatRoomId: string;
		message: ChatRoomMessagePartial;
		existingMessageId: number | null;
	}) {
		const chatRoomDoId = this.env.CHAT_DURABLE_OBJECT.idFromString(chatRoomId);
		const chatRoomDO = this.env.CHAT_DURABLE_OBJECT.get(chatRoomDoId);

		const chatRoomMessage = await chatRoomDO.receiveChatRoomMessage({
			memberId: this.ctx.id.toString(),
			message,
			existingMessageId,
			notifyAgents: false,
		});

		return chatRoomMessage;
	}

	async getAgentConfig() {
		return this.dbServices.getAgentConfig();
	}

	async insertAgentConfig(
		agentConfigData: Parameters<typeof this.dbServices.insertAgentConfig>[0],
	) {
		await this.dbServices.insertAgentConfig(agentConfigData);
	}

	async updateAgentConfig(
		agentConfigData: Parameters<typeof this.dbServices.updateAgentConfig>[0],
	) {
		await this.dbServices.updateAgentConfig(agentConfigData);
	}
}
