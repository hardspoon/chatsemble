/// <reference types="@cloudflare/workers-types" />
/// <reference types="../../../worker-configuration" />
import {
	drizzle,
	type DrizzleSqliteDODatabase,
} from "drizzle-orm/durable-sqlite";
import { DurableObject } from "cloudflare:workers";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";
import migrations from "./db/migrations/migrations";
import { chatMessagesTable, chatRoomMembersTable } from "./db/schema";
import { desc, eq } from "drizzle-orm";
import type { Session, WsMessage } from "../../types/session";
import { nanoid } from "nanoid";

export class ChatDurableObject extends DurableObject<Env> {
	storage: DurableObjectStorage;
	db: DrizzleSqliteDODatabase;
	sessions: Map<WebSocket, Session>;
	state: DurableObjectState;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.storage = ctx.storage;
		this.db = drizzle(this.storage, { logger: false });
		this.sessions = new Map();
		this.state = ctx;

		// Restore any existing WebSocket sessions
		for (const webSocket of ctx.getWebSockets()) {
			const meta = webSocket.deserializeAttachment() || {};
			if (meta.userId) {
				this.sessions.set(webSocket, {
					webSocket,
					userId: meta.userId,
				});
			}
		}
	}

	async migrate() {
		migrate(this.db, migrations);
	}

	async fetch(request: Request) {
		if (request.headers.get("Upgrade") === "websocket") {
			const webSocketPair = new WebSocketPair();
			const [client, server] = Object.values(webSocketPair);

			// Create session with generated userId and userName
			const userId = nanoid();

			// Serialize the session data for hibernation
			server.serializeAttachment({
				userId,
			});

			this.state.acceptWebSocket(server);

			const session: Session = {
				webSocket: server,
				userId,
			};
			this.sessions.set(server, session);

			// Broadcast join event
			this.broadcast({
				type: "join",
				userId: session.userId,
			});

			return new Response(null, { status: 101, webSocket: client });
		}

		return new Response("Not found", { status: 404 });
	}

	async webSocketMessage(webSocket: WebSocket, message: string) {
		const session = this.sessions.get(webSocket);
		if (!session) {
			return;
		}

		try {
			const parsedMsg: WsMessage = JSON.parse(message);

			if (parsedMsg.type === "message") {
				// Check room status and user permissions
				/* const isAllowed = await this.isUserAllowed(session.userId);
				if (!isAllowed) {
					throw new Error("Room is archived or user not allowed");
				} */

				// Store message in database
				await this.insertMessage({
					message: parsedMsg.data,
					userId: session.userId,
				});

				// Broadcast message to all except sender
				this.broadcast(
					{
						type: "message",
						userId: session.userId,
						data: parsedMsg.data,
					},
					session.userId,
				);
			}
		} catch (err) {
			if (err instanceof Error) {
				webSocket.send(JSON.stringify({ error: err.message }));
			}
		}
	}

	async webSocketClose(ws: WebSocket) {
		const session = this.sessions.get(ws);
		if (session) {
			// Update last active time but keep member record
			await this.db
				.update(chatRoomMembersTable)
				.set({ lastActive: Math.floor(Date.now() / 1000) })
				.where(eq(chatRoomMembersTable.id, session.userId));

			// Broadcast quit message
			this.broadcast({
				type: "quit",
				userId: session.userId,
			});
			this.sessions.delete(ws);
		}
		ws.close();
	}

	async webSocketError(webSocket: WebSocket) {
		const session = this.sessions.get(webSocket);
		if (session) {
			this.broadcast({
				type: "quit",
				userId: session.userId,
			});
			this.sessions.delete(webSocket);
		}
		webSocket.close();
	}

	private broadcast(message: WsMessage, excludeUserId?: string) {
		for (const [ws, session] of this.sessions.entries()) {
			if (!excludeUserId || session.userId !== excludeUserId) {
				ws.send(JSON.stringify(message));
			}
		}
	}

	async insertMessage(message: typeof chatMessagesTable.$inferInsert) {
		await this.db.insert(chatMessagesTable).values(message);
	}

	async selectMessages(limit?: number) {
		const query = this.db
			.select()
			.from(chatMessagesTable)
			.orderBy(desc(chatMessagesTable.createdAt));
		if (limit) {
			query.limit(limit);
		}
		return await query;
	}

	async addMember(userId: string, role = "member") {
		await this.db
			.insert(chatRoomMembersTable)
			.values({
				id: userId,
				role,
				joinedAt: Math.floor(Date.now() / 1000),
				lastActive: Math.floor(Date.now() / 1000),
			})
			.onConflictDoUpdate({
				target: chatRoomMembersTable.id,
				set: {
					role,
					lastActive: Math.floor(Date.now() / 1000),
				},
			});
	}

	async getMember(userId: string) {
		return this.db
			.select()
			.from(chatRoomMembersTable)
			.where(eq(chatRoomMembersTable.id, userId))
			.get();
	}

	async getMembers() {
		return this.db.select().from(chatRoomMembersTable).all();
	}
}
