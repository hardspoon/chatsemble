import { DurableObject } from "cloudflare:workers";

import type { Session } from "@server/types/session";
import type {
	ChatRoomMessage,
	ChatRoomMessagePartial,
	WsChatIncomingMessage,
	WsChatOutgoingMessage,
} from "@shared/types";
import { drizzle } from "drizzle-orm/durable-sqlite";
import type { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";
import { Agents } from "./agent";
import migrations from "./db/migrations/migrations";
import {
	type ChatRoomDbServices,
	createChatRoomDbServices,
} from "./db/services";
import { Workflows } from "./workflow";

export class OrganizationDurableObject extends DurableObject<Env> {
	storage: DurableObjectStorage;
	db: DrizzleSqliteDODatabase;
	sessions: Map<WebSocket, Session>;
	dbServices: ChatRoomDbServices;
	agents: Agents;
	workflows: Workflows;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.storage = ctx.storage;
		this.db = drizzle(this.storage, { logger: false });
		this.sessions = new Map();

		this.ctx.blockConcurrencyWhile(async () => {
			await this.migrate();
		});

		this.dbServices = createChatRoomDbServices(this.db);
		this.agents = new Agents(env, this);
		this.workflows = new Workflows(this);

		for (const webSocket of ctx.getWebSockets()) {
			const meta = webSocket.deserializeAttachment() || {
				userId: "unknown",
				activeRoomId: null,
			};
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
		await this.workflows.handleWorkflowAlarm();
		await this.workflows.scheduleNextWorkflowAlarm();
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
			activeRoomId: null,
		};
		server.serializeAttachment(session);
		this.sessions.set(server, session);

		return new Response(null, { status: 101, webSocket: client });
	}

	async webSocketMessage(webSocket: WebSocket, message: string) {
		const session = this.sessions.get(webSocket);
		if (!session) {
			console.error("Session not found");
			webSocket.close(1011, "Session not found");
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
				case "organization-init-request": {
					this.handleUserInitRequest(session);
					break;
				}
				case "chat-room-init-request": {
					this.handleChatRoomInitRequest(webSocket, session, parsedMsg.roomId);
					break;
				}
				case "chat-room-thread-init-request": {
					this.handleChatRoomThreadInitRequest(
						webSocket,
						session,
						parsedMsg.roomId,
						parsedMsg.threadId,
					);
					break;
				}
				case "chat-room-message-send": {
					const roomId = parsedMsg.roomId;
					if (session.activeRoomId !== roomId) {
						console.warn(
							`[Auth] Denied: User ${session.userId} tried to send message to room ${roomId}, but session is active in ${session.activeRoomId}.`,
						);
						throw new Error(
							`Not authorized to send message to room ${roomId} from current session state.`,
						);
					}
					await this.receiveChatRoomMessage({
						memberId: session.userId,
						roomId,
						message: parsedMsg.message,
						existingMessageId: null,
						notifyAgents: true,
					});
					break;
				}
				default:
					console.warn(
						`Received unhandled message type: ${
							// biome-ignore lint/suspicious/noExplicitAny: <explanation>
							(parsedMsg as any)?.type
						}`,
					);
			}
		} catch (err) {
			console.error(
				`Error processing WebSocket message for user ${session.userId}:`,
				err,
			);
			if (err instanceof Error) {
				try {
					webSocket.send(
						JSON.stringify({ error: `Processing failed: ${err.message}` }),
					);
				} catch (sendErr) {
					console.error(
						`Failed to send error message back to user ${session.userId}:`,
						sendErr,
					);
					this.sessions.delete(webSocket);
					webSocket.close(
						1011,
						"Error processing message and failed to notify client",
					);
				}
			} else {
				try {
					webSocket.send(
						JSON.stringify({
							error: "An unknown error occurred during processing.",
						}),
					);
				} catch (sendErr) {
					console.error(
						`Failed to send generic error message back to user ${session.userId}:`,
						sendErr,
					);
					this.sessions.delete(webSocket);
					webSocket.close(1011, "Unknown error and failed to notify client");
				}
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

	broadcastWebSocketMessageToRoom(
		message: WsChatOutgoingMessage,
		targetRoomId: string,
	) {
		console.log(
			`Broadcasting message type ${message.type} to active sessions in room ${targetRoomId}`,
		);
		let recipients = 0;
		for (const [ws, session] of this.sessions.entries()) {
			if (session.activeRoomId === targetRoomId) {
				try {
					ws.send(JSON.stringify(message));
					recipients++;
				} catch (e) {
					console.error(
						`Failed to send message to WebSocket for user ${session.userId} in room ${targetRoomId}:`,
						e,
					);
					this.sessions.delete(ws);
				}
			}
		}
		console.log(
			`Message broadcasted to ${recipients} recipients in room ${targetRoomId}.`,
		);
	}

	private async handleUserInitRequest(session: Session) {
		const chatRooms = await this.dbServices.getChatRoomsUserIsMemberOf(
			session.userId,
		);

		this.sendWebSocketMessageToUser(
			{
				type: "organization-init-response",
				chatRooms,
			},
			session.userId,
		);
	}

	private async handleChatRoomInitRequest(
		webSocket: WebSocket,
		session: Session,
		roomId: string,
	) {
		const isMember = await this.dbServices.isUserMemberOfRoom({
			roomId,
			userId: session.userId,
		});

		if (!isMember) {
			console.warn(
				`User ${session.userId} attempted to access room ${roomId} but is not a member.`,
			);
			if (session.activeRoomId !== null) {
				const newSession = { ...session, activeRoomId: null };
				webSocket.serializeAttachment(newSession);
				this.sessions.set(webSocket, newSession);
			}
			return;
		}

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

		const newSession = { ...session, activeRoomId: roomId };

		webSocket.serializeAttachment(newSession);
		this.sessions.set(webSocket, newSession);

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

	private async handleChatRoomThreadInitRequest(
		webSocket: WebSocket,
		session: Session,
		roomId: string,
		threadId: number,
	) {
		const isMember = await this.dbServices.isUserMemberOfRoom({
			roomId,
			userId: session.userId,
		});

		if (!isMember) {
			console.warn(
				`User ${session.userId} attempted to access room ${roomId} but is not a member.`,
			);
			if (session.activeRoomId !== null) {
				const newSession = { ...session, activeRoomId: null };
				webSocket.serializeAttachment(newSession);
				this.sessions.set(webSocket, newSession);
			}
			return; // Stop processing
		}

		if (session.activeRoomId !== roomId) {
			const newSession = { ...session, activeRoomId: roomId };

			webSocket.serializeAttachment(newSession);
			this.sessions.set(webSocket, newSession);
		}

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

				this.broadcastWebSocketMessageToRoom(
					{
						type: "chat-room-message-broadcast",
						roomId,
						threadId: updatedThreadMessage.threadId,
						message: updatedThreadMessage,
					},
					roomId,
				);
			}
		}

		this.broadcastWebSocketMessageToRoom(
			{
				type: "chat-room-message-broadcast",
				roomId,
				threadId: chatRoomMessage.threadId,
				message: chatRoomMessage,
			},
			roomId,
		);

		if (notifyAgents && !existingMessageId) {
			await this.agents.routeMessagesAndNotifyAgents(chatRoomMessage);
		}

		return chatRoomMessage;
	}

	private async sendChatRoomsUpdateToUsers(userIds: string[]) {
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

	private async broadcastChatRoomMembersUpdate(chatRoomId: string) {
		const members = await this.dbServices.getChatRoomMembers({
			roomId: chatRoomId,
		});

		this.broadcastWebSocketMessageToRoom(
			{
				type: "chat-room-members-update",
				roomId: chatRoomId,
				members,
			},
			chatRoomId,
		);
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
		return await this.workflows.deleteWorkflow(workflowId);
	}
}
