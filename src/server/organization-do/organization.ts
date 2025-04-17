import { DurableObject } from "cloudflare:workers";

import type { Session } from "@server/types/session";
import { drizzle } from "drizzle-orm/durable-sqlite";
import type { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";
import migrations from "./db/migrations/migrations";
import type {
	ChatRoomMessage,
	ChatRoomMessagePartial,
	WsChatIncomingMessage,
	WsChatOutgoingMessage,
} from "@shared/types";
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
		const [room, members, messages] = await Promise.all([
			this.dbServices.getChatRoomById(roomId),
			this.dbServices.getChatRoomMembers(roomId),
			this.dbServices.getChatRoomMessages({
				roomId,
				threadId: null,
			}),
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
				workflows: [], // TODO: Add workflows
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

	async receiveChatRoomMessage({
		memberId,
		roomId,
		message,
		existingMessageId,
		//notifyAgents,
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

		/* if (notifyAgents && !existingMessageId) {
			await this.routeMessageAndNotifyAgents(chatRoomMessage); // TODO: Add this
		} */

		return chatRoomMessage;
	}

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
}
