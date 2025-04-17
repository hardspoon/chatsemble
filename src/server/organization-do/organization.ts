import { DurableObject } from "cloudflare:workers";

import type { Session } from "@server/types/session";
import { drizzle } from "drizzle-orm/durable-sqlite";
import type { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";
import migrations from "./db/migrations/migrations";
import type {
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
					this.sendWebSocketMessageToUser(
						{
							type: "user-init-response",
							chatRooms: await this.dbServices.getChatRoomsUserIsMemberOf(
								session.userId,
							),
						},
						session.userId,
					);
					break;
				}
				case "chat-room-init-request": {
					const room = await this.dbServices.getChatRoomById(parsedMsg.roomId);
					const members = await this.dbServices.getChatRoomMembers(
						parsedMsg.roomId,
					);
					const messages = await this.dbServices.getChatRoomMessages({
						roomId: parsedMsg.roomId,
						threadId: null,
					});

					if (!room) {
						console.error("Room not found");
						throw new Error("Room not found");
					}

					this.sendWebSocketMessageToUser(
						{
							type: "chat-room-init-response",
							messages,
							members,
							room,
							workflows: [],
						},
						session.userId,
					);
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

	/* private broadcastWebSocketMessage(
		message: WsChatOutgoingMessage,
		excludeUserId?: string,
	) {
		for (const [ws, session] of this.sessions.entries()) {
			if (!excludeUserId || session.userId !== excludeUserId) {
				ws.send(JSON.stringify(message));
			}
		}
	} */

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
		for (const userId of userIds) {
			this.sendWebSocketMessageToUser(
				{
					type: "chat-rooms-update",
					chatRooms: await this.dbServices.getChatRoomsUserIsMemberOf(userId),
				},
				userId,
			);
		}
	}

	async getChatRoomMessages(
		options: Parameters<typeof this.dbServices.getChatRoomMessages>[0],
	) {
		return this.dbServices.getChatRoomMessages(options);
	}
}
