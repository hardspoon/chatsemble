import { DurableObject } from "cloudflare:workers";
import { createOpenAI } from "@ai-sdk/openai";
import { agentSystemPrompt } from "@server/ai/prompts/agent-prompt";
import { createMessageThreadTool } from "@server/ai/tools/create-thread-tool";
import { deepResearchTool } from "@server/ai/tools/deep-search-tool";
import { scheduleWorkflowTool } from "@server/ai/tools/schedule-workflow-tool";
import { webCrawlerTool } from "@server/ai/tools/web-crawler-tool";
import { webSearchTool } from "@server/ai/tools/web-search-tool";
import { processDataStream } from "@server/ai/utils/data-stream";
import { contextAndNewchatRoomMessagesToAIMessages } from "@server/ai/utils/message";
import { workflowToPrompt } from "@server/ai/utils/workflow";
import type {
	ChatRoomMessage,
	ChatRoomMessagePartial,
	WorkflowPartial,
} from "@shared/types";
import {
	type DataStreamWriter,
	type Message,
	createDataStreamResponse,
	smoothStream,
	streamText,
} from "ai";
import { CronExpressionParser } from "cron-parser";
import {
	type DrizzleSqliteDODatabase,
	drizzle,
} from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";
import migrations from "./db/migrations/migrations";
import { createAgentDbServices } from "./db/services";

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

	async alarm() {
		await this.handleWorkflowAlarm();
		await this.scheduleNextWorkflowAlarm();
	}

	async scheduleNextWorkflowAlarm() {
		const now = Date.now();
		const nextTime = await this.dbServices.findNextWorkflowTime(now);
		const currentAlarm = await this.ctx.storage.getAlarm();

		if (nextTime) {
			if (currentAlarm !== nextTime) {
				console.log(
					`[AgentDO ${this.ctx.id}] Setting next alarm for ${new Date(nextTime).toISOString()}`,
				);
				this.ctx.storage.setAlarm(nextTime);
			} else {
				console.log(
					`[AgentDO ${this.ctx.id}] Alarm already set correctly for ${new Date(nextTime).toISOString()}`,
				);
			}
		} else {
			if (currentAlarm) {
				console.log(
					`[AgentDO ${this.ctx.id}] No active tasks, deleting alarm.`,
				);
				this.ctx.storage.deleteAlarm();
			} else {
				console.log(
					`[AgentDO ${this.ctx.id}] No active tasks, no alarm to delete.`,
				);
			}
		}
	}

	async handleWorkflowAlarm() {
		console.log(
			`[AgentDO ${this.ctx.id}] Alarm triggered at ${new Date().toISOString()}`,
		);
		const now = Date.now();
		const dueWorkflows = await this.dbServices.getDueWorkflows(now);

		console.log(
			`[AgentDO ${this.ctx.id}] Found ${dueWorkflows.length} due workflows.`,
		);

		for (const workflow of dueWorkflows) {
			console.log(
				`[AgentDO ${this.ctx.id}] Processing workflow ${workflow.id}`,
			);
			await this.executeWorkflow(workflow);
		}
	}

	async executeWorkflow(workflow: WorkflowPartial) {
		console.log(`[AgentDO ${this.ctx.id}] Executing workflow ${workflow.id}`);
		try {
			await this.processAndRespondWorkflow({ workflow });

			if (workflow.isRecurring) {
				try {
					const interval = CronExpressionParser.parse(
						workflow.scheduleExpression,
						{
							tz: "UTC",
							currentDate: new Date(workflow.nextExecutionTime),
						},
					);
					const nextExecutionTime = interval.next().getTime();
					console.log(
						`[AgentDO ${this.ctx.id}] Rescheduling task ${workflow.id} for ${new Date(nextExecutionTime).toISOString()}`,
					);
					await this.dbServices.updateWorkflow(workflow.id, {
						nextExecutionTime,
						lastExecutionTime: Date.now(),
					});
				} catch (error) {
					console.error(
						`[AgentDO ${this.ctx.id}] Failed to parse schedule for recurring workflow ${workflow.id}:`,
						error,
					);
					await this.dbServices.updateWorkflow(workflow.id, {
						lastExecutionTime: Date.now(),
					});
				}
			} else {
				await this.dbServices.updateWorkflow(workflow.id, {
					lastExecutionTime: Date.now(),
				});
				console.log(
					`[AgentDO ${this.ctx.id}] Workflow ${workflow.id} completed.`,
				);
			}
		} catch (error) {
			console.error(
				`[AgentDO ${this.ctx.id}] Error executing workflow ${workflow.id}:`,
				error,
			);
			await this.dbServices.updateWorkflow(workflow.id, {
				lastExecutionTime: Date.now(),
			});
		}
	}

	async processAndRespondWorkflow({
		workflow,
	}: {
		workflow: WorkflowPartial;
	}) {
		console.log(`[AgentDO ${this.ctx.id}] Processing workflow ${workflow.id}`);

		await this.formulateResponse({
			chatRoomId: workflow.chatRoomId,
			threadId: null,
			messages: [
				{
					id: "1",
					content: workflowToPrompt(workflow),
					role: "user",
				},
			],
		});
	}

	async processAndRespondIncomingMessages({
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
		console.log("[processAndRespondIncomingMessages] received messages", {
			chatRoomId,
			threadId,
			newMessages,
			contextMessages,
		});

		if (newMessages.length === 0) {
			console.log(
				"[processAndRespondIncomingMessages] No new messages to process.",
			);
			return;
		}

		const messages = contextAndNewchatRoomMessagesToAIMessages({
			contextMessages,
			newMessages,
			agentIdForAssistant: this.ctx.id.toString(),
		});

		await this.formulateResponse({
			chatRoomId,
			threadId,
			messages,
		});
	}

	private async formulateResponse({
		chatRoomId,
		threadId: originalThreadId,
		messages,
	}: {
		chatRoomId: string;
		threadId: number | null;
		messages: Message[];
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
				scheduleWorkflow: scheduleWorkflowTool({
					agentInstance: this,
					chatRoomId,
				}),
				// @ts-ignore Type instantiation is excessively deep and possibly infinite.ts(2589)
				createMessageThread: createMessageThreadTool({
					onMessage: async ({ newMessagePartial }) =>
						await this.sendResponse({
							chatRoomId: chatRoomId,
							message: newMessagePartial,
							existingMessageId: null,
						}),
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

		try {
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
						onError: (error) => {
							console.error("[formulateResponse] onError", error);
						},
					}).mergeIntoDataStream(dataStream);
				},
			});

			// @ts-ignore Type instantiation is excessively deep and possibly infinite.ts(2589)
			await processDataStream({
				response: dataStreamResponse,
				getThreadId: () => sendMessageThreadId,
				omitSendingTool: ["createMessageThread"],
				onMessageSend: async ({ newMessagePartial, existingMessageId }) =>
					await this.sendResponse({
						chatRoomId: chatRoomId,
						message: newMessagePartial,
						existingMessageId,
					}),
			});
		} catch (error) {
			console.error("[formulateResponse] error", error);
		}
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

	async getWorkflows() {
		return this.dbServices.getWorkflows();
	}

	async deleteWorkflow(chatRoomId: string, workflowId: string) {
		await this.dbServices.deleteWorkflow(workflowId);
		await this.broadcastWorkflowUpdate(chatRoomId);
	}

	async broadcastWorkflowUpdate(chatRoomId: string) {
		const chatRoomDoId = this.env.CHAT_DURABLE_OBJECT.idFromString(chatRoomId);
		const chatRoomDO = this.env.CHAT_DURABLE_OBJECT.get(chatRoomDoId);
		await chatRoomDO.broadcastWorkflowUpdate();
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
