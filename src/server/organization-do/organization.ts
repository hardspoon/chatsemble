import { DurableObject } from "cloudflare:workers";

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
import type { Session } from "@server/types/session";
import type {
	ChatRoom,
	ChatRoomMember,
	ChatRoomMessage,
	ChatRoomMessagePartial,
	WorkflowPartial,
	WsChatIncomingMessage,
	WsChatOutgoingMessage,
} from "@shared/types";
import {
	type DataStreamWriter,
	type Message,
	createDataStreamResponse,
	generateObject,
	smoothStream,
	streamText,
} from "ai";
import CronExpressionParser from "cron-parser";
import { drizzle } from "drizzle-orm/durable-sqlite";
import type { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";
import { z } from "zod";
import migrations from "./db/migrations/migrations";
import { createChatRoomDbServices } from "./db/services";

export class OrganizationDurableObject extends DurableObject<Env> {
	storage: DurableObjectStorage;
	db: DrizzleSqliteDODatabase;
	sessions: Map<WebSocket, Session>;
	dbServices: ReturnType<typeof createChatRoomDbServices>;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.storage = ctx.storage;
		this.db = drizzle(this.storage, { logger: false });
		this.sessions = new Map();

		this.ctx.blockConcurrencyWhile(async () => {
			await this.migrate();
		});

		this.dbServices = createChatRoomDbServices(this.db);

		for (const webSocket of ctx.getWebSockets()) {
			const meta = webSocket.deserializeAttachment() || {};
			this.sessions.set(webSocket, meta);
		}
	}

	async migrate() {
		migrate(this.db, migrations);
	}

	async delete() {
		this.storage.deleteAll();
	}

	async alarm() {
		await this.handleWorkflowAlarm();
		await this.scheduleNextWorkflowAlarm();
	}

	async scheduleNextWorkflowAlarm() {
		const now = Date.now();
		const nextTime = await this.dbServices.findNextWorkflowTime(now);
		const currentAlarm = await this.ctx.storage.getAlarm();
		console.log("[scheduleNextWorkflowAlarm] nextTime", nextTime);
		console.log("[scheduleNextWorkflowAlarm] currentAlarm", currentAlarm);

		if (nextTime) {
			if (currentAlarm !== nextTime) {
				console.log(
					`[Setting next alarm for ${new Date(nextTime).toISOString()}`,
				);
				this.ctx.storage.setAlarm(nextTime);
			} else {
				console.log(
					`Alarm already set correctly for ${new Date(nextTime).toISOString()}`,
				);
			}
		} else {
			if (currentAlarm) {
				console.log("No active tasks, deleting alarm.");
				this.ctx.storage.deleteAlarm();
			} else {
				console.log("No active tasks, no alarm to delete.");
			}
		}
	}

	async handleWorkflowAlarm() {
		console.log(`Alarm triggered at ${new Date().toISOString()}`);
		const now = Date.now();
		const dueWorkflows = await this.dbServices.getDueWorkflows(now);

		console.log(`Found ${dueWorkflows.length} due workflows.`);

		await Promise.all(
			dueWorkflows.map(async (workflow) => {
				console.log(`Processing workflow ${workflow.id}`);
				await this.executeWorkflow(workflow);
			}),
		);

		const chatRoomIds = dueWorkflows.map((workflow) => workflow.chatRoomId);
		const uniqueChatRoomIds = [...new Set(chatRoomIds)];

		await Promise.all(
			uniqueChatRoomIds.map(async (chatRoomId) => {
				await this.broadcastWorkflowUpdate(chatRoomId);
			}),
		);
	}

	async fetch(request: Request) {
		const url = new URL(request.url);
		const userId = url.searchParams.get("userId");

		if (!userId) {
			return new Response("Missing user ID", { status: 400 });
		}

		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);

		this.ctx.acceptWebSocket(server);

		const session: Session = {
			userId,
		};
		server.serializeAttachment(session);
		this.sessions.set(server, session);

		return new Response(null, { status: 101, webSocket: client });
	}

	async webSocketMessage(webSocket: WebSocket, message: string) {
		const session = this.sessions.get(webSocket);
		if (!session) {
			return;
		}

		try {
			const parsedMsg: WsChatIncomingMessage = JSON.parse(message);
			console.log(
				"Got message from user: ",
				session.userId,
				"with message: ",
				parsedMsg,
			);
			switch (parsedMsg.type) {
				case "user-init-request": {
					this.handleUserInitRequest(session);
					break;
				}
				case "chat-room-init-request": {
					this.handleChatRoomInitRequest(session, parsedMsg.roomId);
					break;
				}
				case "chat-room-thread-init-request": {
					this.handleChatRoomThreadInitRequest(
						session,
						parsedMsg.roomId,
						parsedMsg.threadId,
					);
					break;
				}
				case "chat-room-message-send": {
					await this.receiveChatRoomMessage({
						memberId: session.userId,
						roomId: parsedMsg.roomId,
						message: parsedMsg.message,
						existingMessageId: null,
						notifyAgents: true,
					});
					break;
				}
			}
		} catch (err) {
			if (err instanceof Error) {
				webSocket.send(JSON.stringify({ error: err.message }));
			}
		}
	}

	async webSocketClose(webSocket: WebSocket) {
		this.sessions.delete(webSocket);
		webSocket.close();
	}

	async webSocketError(webSocket: WebSocket) {
		this.sessions.delete(webSocket);
		webSocket.close();
	}

	private sendWebSocketMessageToUser(
		message: WsChatOutgoingMessage,
		sentToUserId: string,
	) {
		for (const [ws, session] of this.sessions.entries()) {
			if (session.userId === sentToUserId) {
				ws.send(JSON.stringify(message));
			}
		}
	}

	private broadcastWebSocketMessage(
		message: WsChatOutgoingMessage,
		excludeUserId?: string,
	) {
		for (const [ws, session] of this.sessions.entries()) {
			if (!excludeUserId || session.userId !== excludeUserId) {
				ws.send(JSON.stringify(message));
			}
		}
	}

	async handleUserInitRequest(session: Session) {
		const chatRooms = await this.dbServices.getChatRoomsUserIsMemberOf(
			session.userId,
		);

		this.sendWebSocketMessageToUser(
			{
				type: "user-init-response",
				chatRooms,
			},
			session.userId,
		);
	}

	async handleChatRoomInitRequest(session: Session, roomId: string) {
		const [room, members, messages, workflows] = await Promise.all([
			this.dbServices.getChatRoomById(roomId),
			this.dbServices.getChatRoomMembers({ roomId }),
			this.dbServices.getChatRoomMessages({
				roomId,
				threadId: null,
			}),
			this.dbServices.getChatRoomWorkflows(roomId),
		]);

		if (!room) {
			console.error("Room not found");
			throw new Error("Room not found");
		}

		this.sendWebSocketMessageToUser(
			{
				type: "chat-room-init-response",
				roomId,
				messages,
				members,
				room,
				workflows,
			},
			session.userId,
		);
	}

	async handleChatRoomThreadInitRequest(
		session: Session,
		roomId: string,
		threadId: number,
	) {
		const [threadMessage, messages] = await Promise.all([
			this.dbServices.getChatRoomMessageById(threadId),
			this.dbServices.getChatRoomMessages({
				roomId,
				threadId,
			}),
		]);

		if (!threadMessage) {
			console.error("Thread message not found");
			throw new Error("Thread message not found");
		}

		this.sendWebSocketMessageToUser(
			{
				type: "chat-room-thread-init-response",
				roomId,
				threadId,
				threadMessage,
				messages,
			},
			session.userId,
		);
	}

	async executeWorkflow(workflow: WorkflowPartial) {
		console.log(
			`Executing workflow ${workflow.id} for chatroom ${workflow.chatRoomId} and agent ${workflow.agentId}`,
		);
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
						`Rescheduling task ${workflow.id} for ${new Date(nextExecutionTime).toISOString()}`,
					);
					await this.dbServices.updateWorkflow(workflow.id, {
						nextExecutionTime,
						lastExecutionTime: Date.now(),
					});
				} catch (error) {
					console.error(
						`Failed to parse schedule for recurring workflow ${workflow.id}:`,
						error,
					);
					await this.dbServices.updateWorkflow(workflow.id, {
						lastExecutionTime: Date.now(),
					});
				}
			} else {
				await this.dbServices.updateWorkflow(workflow.id, {
					lastExecutionTime: Date.now(),
					isActive: false,
				});
				console.log(`Workflow ${workflow.id} completed.`);
			}
		} catch (error) {
			console.error(`Error executing workflow ${workflow.id}:`, error);
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
		console.log("Processing workflow :", workflow);

		const agentId = workflow.agentId;

		const agentConfig = await this.dbServices.getAgentById(agentId);

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
	}

	async receiveChatRoomMessage({
		memberId,
		roomId,
		message,
		existingMessageId,
		notifyAgents,
	}: {
		memberId: string;
		roomId: string;
		message: ChatRoomMessagePartial;
		existingMessageId: number | null;
		notifyAgents: boolean;
	}): Promise<ChatRoomMessage> {
		let chatRoomMessage: ChatRoomMessage;

		if (existingMessageId) {
			chatRoomMessage = await this.dbServices.updateChatRoomMessage(
				existingMessageId,
				{
					content: message.content,
					mentions: message.mentions,
					toolUses: message.toolUses,
				},
			);
		} else {
			chatRoomMessage = await this.dbServices.insertChatRoomMessage({
				memberId,
				content: message.content,
				mentions: message.mentions,
				toolUses: message.toolUses,
				threadId: message.threadId,
				roomId,
				metadata: {
					optimisticData: {
						createdAt: message.createdAt,
						id: message.id,
					},
				},
				threadMetadata: null,
			});

			if (message.threadId) {
				const updatedThreadMessage =
					await this.dbServices.updateChatRoomMessageThreadMetadata(
						message.threadId,
						chatRoomMessage,
					);

				this.broadcastWebSocketMessage({
					type: "chat-room-message-broadcast",
					roomId,
					threadId: updatedThreadMessage.threadId,
					message: updatedThreadMessage,
				});
			}
		}

		this.broadcastWebSocketMessage({
			// TODO: Broadcast only to members of chatroom
			type: "chat-room-message-broadcast",
			roomId,
			threadId: chatRoomMessage.threadId,
			message: chatRoomMessage,
		});

		if (notifyAgents && !existingMessageId) {
			await this.routeMessagesAndNotifyAgents(chatRoomMessage);
		}

		return chatRoomMessage;
	}

	private async routeMessagesAndNotifyAgents(newMessage: ChatRoomMessage) {
		try {
			console.log(
				`[routeMessageAndNotifyAgents] Routing message ${newMessage.id}`,
			);
			const roomId = newMessage.roomId;
			const threadId = newMessage.threadId;
			const contextSize = 10;

			let contextMessages: ChatRoomMessage[] = [];
			if (newMessage.id) {
				contextMessages = await this.dbServices.getChatRoomMessages({
					threadId,
					roomId,
					beforeId: newMessage.id,
					limit: contextSize,
				});
			}
			if (threadId) {
				const threadMessage =
					await this.dbServices.getChatRoomMessageById(threadId);
				if (threadMessage) {
					contextMessages = [threadMessage, ...contextMessages];
				}
			}

			const agentMembers = await this.dbServices.getChatRoomMembers({
				roomId,
				type: "agent",
			});
			if (agentMembers.length === 0) {
				console.log("[routeMessageAndNotifyAgents] No agents in the room.");
				return;
			}

			const roomConfig = await this.dbServices.getChatRoomById(roomId);

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
	}

	private async checkAgentsToRouteMessagesTo({
		contextMessages,
		newMessages,
		agents,
		room,
	}: {
		contextMessages: ChatRoomMessage[];
		newMessages: ChatRoomMessage[];
		agents: ChatRoomMember[];
		room: ChatRoom;
	}): Promise<string[]> {
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

			const agentList = await this.dbServices.getAgentsByIds(agentIds);

			const aiMessages = contextAndNewchatRoomMessagesToAIMessages({
				contextMessages,
				newMessages,
			});

			const { object: targetAgents } = await generateObject({
				model: openAIClient("gpt-4o-mini"),
				system: routeMessageToAgentSystemPrompt({ agents: agentList, room }),
				schema: z.object({
					agentIds: z
						.array(z.string())
						.describe(
							`List of agent IDs that should respond to the messages. Include ID only if agent is relevant. Max ${agents.length} agents. Possible IDs: ${agents.map((a) => a.id).join(", ")}.`,
						),
				}),
				messages: aiMessages,
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
	}

	async processAndRespondIncomingMessages({
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
	}) {
		if (newMessages.length === 0) {
			return;
		}

		const agentConfig = await this.dbServices.getAgentById(agentId);

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
	}

	private async formulateResponse({
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
	}) {
		console.log("[formulateResponse] chatRoomId", chatRoomId);

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
					organizationInstance: this,
					chatRoomId,
					agentId,
				}),

				createMessageThread: createMessageThreadTool({
					roomId: chatRoomId,
					onMessage: async ({ newMessagePartial }) => {
						return await this.receiveChatRoomMessage({
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
						experimental_activeTools: activeTools,
					}).mergeIntoDataStream(dataStream);
				},
			});

			await processDataStream({
				response: dataStreamResponse,
				getThreadId: () => sendMessageThreadId,
				omitSendingTool: ["createMessageThread"],
				onMessageSend: async ({ newMessagePartial, existingMessageId }) => {
					return await this.receiveChatRoomMessage({
						roomId: chatRoomId,
						memberId: agentId,
						message: newMessagePartial,
						existingMessageId,
						notifyAgents: false,
					});
				},
			});
		} catch (error) {
			console.error("[formulateResponse] error", error);
		}
	}

	async sendChatRoomsUpdateToUsers(userIds: string[]) {
		const chatRoomsPromises = userIds.map((userId) =>
			this.dbServices.getChatRoomsUserIsMemberOf(userId),
		);
		const chatRoomsResults = await Promise.all(chatRoomsPromises);

		userIds.forEach((userId, index) => {
			this.sendWebSocketMessageToUser(
				{
					type: "chat-rooms-update",
					chatRooms: chatRoomsResults[index],
				},
				userId,
			);
		});
	}

	async broadcastWorkflowUpdate(chatRoomId: string) {
		const workflows = await this.dbServices.getChatRoomWorkflows(chatRoomId);

		this.broadcastWebSocketMessage({
			type: "chat-room-workflows-update",
			roomId: chatRoomId,
			workflows,
		});
	}

	async broadcastChatRoomMembersUpdate(chatRoomId: string) {
		const members = await this.dbServices.getChatRoomMembers({
			roomId: chatRoomId,
		});

		this.broadcastWebSocketMessage({
			type: "chat-room-members-update",
			roomId: chatRoomId,
			members,
		});
	}

	// Chat room services

	async createChatRoom(
		newChatRoom: Parameters<typeof this.dbServices.createChatRoom>[0],
	) {
		const createdChatRoom = await this.dbServices.createChatRoom(newChatRoom);

		const membersIds = newChatRoom.members
			.filter((member) => member.type === "user")
			.map((member) => member.id);

		this.sendChatRoomsUpdateToUsers(membersIds);

		return createdChatRoom;
	}

	// Chat room member services

	async deleteChatRoomMember(
		deleteChatRoomMemberParams: Parameters<
			typeof this.dbServices.deleteChatRoomMember
		>[0],
	) {
		const deletedChatRoomMember = await this.dbServices.deleteChatRoomMember(
			deleteChatRoomMemberParams,
		);

		this.sendChatRoomsUpdateToUsers([deleteChatRoomMemberParams.memberId]);

		this.broadcastChatRoomMembersUpdate(deleteChatRoomMemberParams.roomId);

		return deletedChatRoomMember;
	}

	async addChatRoomMember(
		addChatRoomMemberParams: Parameters<
			typeof this.dbServices.addChatRoomMember
		>[0],
	) {
		const addedChatRoomMember = await this.dbServices.addChatRoomMember(
			addChatRoomMemberParams,
		);

		this.sendChatRoomsUpdateToUsers([addChatRoomMemberParams.id]);

		this.broadcastChatRoomMembersUpdate(addChatRoomMemberParams.roomId);

		return addedChatRoomMember;
	}

	// Agent services

	async getAgents() {
		return await this.dbServices.getAgents();
	}

	async createAgent(
		newAgent: Parameters<typeof this.dbServices.createAgent>[0],
	) {
		return await this.dbServices.createAgent(newAgent);
	}

	async getAgentById(id: string) {
		return await this.dbServices.getAgentById(id);
	}

	async getAgentsByIds(ids: string[]) {
		return await this.dbServices.getAgentsByIds(ids);
	}

	async updateAgent(
		id: string,
		agentUpdates: Parameters<typeof this.dbServices.updateAgent>[1],
	) {
		return await this.dbServices.updateAgent(id, agentUpdates);
	}

	// Workflow services

	async deleteWorkflow(workflowId: string) {
		return await this.dbServices.deleteWorkflow(workflowId);
	}
}
