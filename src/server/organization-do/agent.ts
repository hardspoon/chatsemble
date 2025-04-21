import { createOpenAI } from "@ai-sdk/openai";
import { getDefaultAgentSystemPrompt } from "@server/ai/prompts/agent/default-prompt";
import {
	getWorkflowAgentSystemPrompt,
	getWorkflowAgentUserPrompt,
} from "@server/ai/prompts/agent/workflow-prompt";
import { routeMessageToAgentSystemPrompt } from "@server/ai/prompts/router-prompt";
import { agentToolSetKeys } from "@server/ai/tools";
import { createMessageThreadTool } from "@server/ai/tools/create-thread-tool";
import { deepResearchTool } from "@server/ai/tools/deep-search-tool";
import { scheduleWorkflowTool } from "@server/ai/tools/schedule-workflow-tool";
import { webCrawlerTool } from "@server/ai/tools/web-crawler-tool";
import { webSearchTool } from "@server/ai/tools/web-search-tool";
import { processDataStream } from "@server/ai/utils/data-stream";
import { contextAndNewchatRoomMessagesToAIMessages } from "@server/ai/utils/message";
import type {
	ChatRoom,
	ChatRoomMember,
	ChatRoomMessage,
	WorkflowPartial,
} from "@shared/types";
import {
	type DataStreamWriter,
	type Message,
	createDataStreamResponse,
	generateObject,
	smoothStream,
	streamText,
} from "ai";
import { z } from "zod";
import type { OrganizationDurableObject } from "./organization";

export class Agents {
	private env: Env;
	private organizationDO: OrganizationDurableObject; // Reference for callbacks

	constructor(env: Env, organizationDO: OrganizationDurableObject) {
		this.env = env;
		this.organizationDO = organizationDO;
	}

	processAndRespondWorkflow = async ({
		workflow,
	}: {
		workflow: WorkflowPartial;
	}) => {
		console.log("Processing workflow :", workflow);

		const agentId = workflow.agentId;

		const agentConfig =
			await this.organizationDO.dbServices.getAgentById(agentId);

		if (!agentConfig) {
			console.error(`Agent config not found for agent ${agentId}`);
			throw new Error(`Agent config not found for agent ${agentId}`);
		}

		const workflowPrompt = getWorkflowAgentUserPrompt({ workflow });

		console.log(`Workflow prompt: ${workflowPrompt}`);

		const systemPrompt = getWorkflowAgentSystemPrompt({
			agentConfig,
			chatRoomId: workflow.chatRoomId,
		});

		await this.formulateResponse({
			agentId,
			chatRoomId: workflow.chatRoomId,
			threadId: null,
			messages: [
				{
					id: "1",
					content: workflowPrompt,
					role: "user",
				},
			],
			systemPrompt,
			removeTools: ["scheduleWorkflow"],
		});
	};

	routeMessagesAndNotifyAgents = async (
		newMessage: ChatRoomMessage,
	): Promise<void> => {
		try {
			console.log(
				`[routeMessageAndNotifyAgents] Routing message ${newMessage.id}`,
			);
			const roomId = newMessage.roomId;
			const threadId = newMessage.threadId;
			const contextSize = 10;

			let contextMessages: ChatRoomMessage[] = [];

			contextMessages =
				await this.organizationDO.dbServices.getChatRoomMessages({
					threadId,
					roomId,
					beforeId: newMessage.id,
					limit: contextSize,
				});

			if (threadId) {
				const threadMessage =
					await this.organizationDO.dbServices.getChatRoomMessageById(threadId);
				if (threadMessage) {
					contextMessages = [threadMessage, ...contextMessages];
				}
			}

			const agentMembers =
				await this.organizationDO.dbServices.getChatRoomMembers({
					roomId,
					type: "agent",
				});

			if (agentMembers.length === 0) {
				console.log("[routeMessageAndNotifyAgents] No agents in the room.");
				return;
			}

			const roomConfig =
				await this.organizationDO.dbServices.getChatRoomById(roomId);

			if (!roomConfig) {
				console.error("Room config not found");
				throw new Error("Room config not found");
			}

			const targetAgentIds = await this.checkAgentsToRouteMessagesTo({
				contextMessages,
				newMessages: [newMessage],
				agents: agentMembers,
				room: roomConfig,
			});

			if (targetAgentIds.length === 0) {
				console.log(
					"[routeMessageAndNotifyAgents] Router decided no agent should respond.",
				);
				return;
			}

			for (const agentId of targetAgentIds) {
				console.log(`[routeMessageAndNotifyAgents] Notifying agent ${agentId}`);

				await this.processAndRespondIncomingMessages({
					agentId,
					chatRoomId: roomId,
					threadId,
					newMessages: [newMessage],
					contextMessages,
				});
			}
		} catch (error) {
			console.error("Error routing message to agents:", error);
		}
	};

	checkAgentsToRouteMessagesTo = async ({
		contextMessages,
		newMessages,
		agents,
		room,
	}: {
		contextMessages: ChatRoomMessage[];
		newMessages: ChatRoomMessage[];
		agents: ChatRoomMember[];
		room: ChatRoom;
	}) => {
		console.log(
			"[routeMessageToAgents] Deciding which agent(s) should respond.",
		);
		if (agents.length === 0) {
			return [];
		}

		const mentionedAgentIds = new Set<string>();
		for (const msg of newMessages) {
			for (const mention of msg.mentions) {
				if (agents.some((agent) => agent.id === mention.id)) {
					mentionedAgentIds.add(mention.id);
				}
			}
		}

		if (mentionedAgentIds.size > 0) {
			const mentionedIdsArray = Array.from(mentionedAgentIds);
			console.log(
				"[routeMessageToAgents] Routing based on mentions:",
				mentionedIdsArray,
			);
			return mentionedIdsArray;
		}

		const openAIClient = createOpenAI({
			baseURL: this.env.AI_GATEWAY_OPENAI_URL,
			apiKey: this.env.OPENAI_API_KEY,
		});

		try {
			const agentIds = agents.map((a) => a.id);

			const agentList =
				await this.organizationDO.dbServices.getAgentsByIds(agentIds);

			const aiMessages = contextAndNewchatRoomMessagesToAIMessages({
				contextMessages,
				newMessages,
			});

			const { object: targetAgents } = await generateObject({
				system: routeMessageToAgentSystemPrompt({ agents: agentList, room }),
				schema: z.object({
					agentIds: z
						.array(z.string())
						.describe(
							`List of agent IDs that should respond to the messages. Include ID only if agent is relevant. Max ${agents.length} agents. Possible IDs: ${agents.map((a) => a.id).join(", ")}.`,
						),
				}),
				messages: aiMessages,
				model: openAIClient("gpt-4o-mini"),
			});

			const validAgentIds = (targetAgents.agentIds || []).filter((id) =>
				agents.some((a) => a.id === id),
			);
			console.log("[routeMessageToAgents] AI decided:", validAgentIds);
			return validAgentIds;
		} catch (error) {
			console.error("Error in AI routing:", error);
			return [];
		}
	};

	processAndRespondIncomingMessages = async ({
		agentId,
		chatRoomId,
		threadId,
		newMessages,
		contextMessages,
	}: {
		agentId: string;
		chatRoomId: string;
		threadId: number | null;
		newMessages: ChatRoomMessage[];
		contextMessages: ChatRoomMessage[];
	}) => {
		if (newMessages.length === 0) {
			return;
		}

		const agentConfig =
			await this.organizationDO.dbServices.getAgentById(agentId);

		if (!agentConfig) {
			console.error("Agent config not found");
			throw new Error("Agent config not found");
		}

		const messages = contextAndNewchatRoomMessagesToAIMessages({
			contextMessages,
			newMessages,
			agentIdForAssistant: agentId,
		});

		console.log("[processAndRespondIncomingMessages] messages", messages);

		const systemPrompt = getDefaultAgentSystemPrompt({
			agentConfig,
			chatRoomId: chatRoomId,
			threadId: threadId, // Pass the current threadId
		});

		await this.formulateResponse({
			agentId,
			chatRoomId,
			threadId,
			messages,
			systemPrompt,
		});
	};

	formulateResponse = async ({
		agentId,
		chatRoomId,
		threadId: originalThreadId,
		messages,
		systemPrompt,
		removeTools,
	}: {
		agentId: string;
		chatRoomId: string;
		threadId: number | null;
		messages: Message[];
		systemPrompt: string;
		removeTools?: string[];
	}) => {
		console.log("[formulateResponse] chatRoomId", chatRoomId);

		let sendMessageThreadId: number | null = originalThreadId;
		console.log("[formulateResponse] sendMessageThreadId", sendMessageThreadId);

		const agentToolSet = (dataStream: DataStreamWriter) => {
			return {
				webSearch: webSearchTool(dataStream),
				deepResearch: deepResearchTool(dataStream),
				webCrawl: webCrawlerTool(dataStream),
				scheduleWorkflow: scheduleWorkflowTool({
					organizationInstance: this.organizationDO,
					chatRoomId,
					agentId,
				}),

				createMessageThread: createMessageThreadTool({
					roomId: chatRoomId,
					onMessage: async ({ newMessagePartial }) => {
						return await this.organizationDO.chatRooms.receiveChatRoomMessage({
							roomId: chatRoomId,
							memberId: agentId,
							message: newMessagePartial,
							existingMessageId: null,
							notifyAgents: false,
						});
					},
					onNewThread: (newThreadId) => {
						console.log("[formulateResponse] onNewThread", newThreadId);
						sendMessageThreadId = newThreadId;
					},
				}),
			};
		};

		const activeTools = agentToolSetKeys.filter(
			(tool) => !removeTools?.includes(tool),
		);

		const openAIClient = createOpenAI({
			baseURL: this.env.AI_GATEWAY_OPENAI_URL,
			apiKey: this.env.OPENAI_API_KEY,
		});

		try {
			const dataStreamResponse = createDataStreamResponse({
				execute: async (dataStream) => {
					streamText({
						model: openAIClient("gpt-4.1"),
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
						experimental_activeTools: activeTools,
					}).mergeIntoDataStream(dataStream);
				},
			});

			await processDataStream({
				response: dataStreamResponse,
				roomId: chatRoomId,
				getThreadId: () => sendMessageThreadId,
				omitSendingTool: ["createMessageThread"],
				onMessageSend: async ({ newMessagePartial, existingMessageId }) => {
					return await this.organizationDO.chatRooms.receiveChatRoomMessage({
						roomId: chatRoomId,
						memberId: agentId,
						message: newMessagePartial,
						existingMessageId,
						notifyAgents: false, // AI response shouldn't re-notify agents
					});
				},
			});
		} catch (error) {
			console.error("[formulateResponse] error", error);
		}
	};
}
