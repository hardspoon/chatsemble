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

export class ChatDurableObject extends DurableObject<Env> {
	storage: DurableObjectStorage;
	db: DrizzleSqliteDODatabase;
	sessions: Map<WebSocket, Session>;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.storage = ctx.storage;
		this.db = drizzle(this.storage, { logger: false });
		this.sessions = new Map();

		// Restore any existing WebSocket sessions
		for (const webSocket of ctx.getWebSockets()) {
			const meta = webSocket.deserializeAttachment() || {};
			this.sessions.set(webSocket, meta);
		}
	}

	async migrate() {
		migrate(this.db, migrations);
	}

	async fetch() {
		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);

		this.ctx.acceptWebSocket(server);

		const session: Session = {
			userId: "123",
		};
		server.serializeAttachment(session);
		this.sessions.set(server, session);

		console.log("sessions", this.sessions);

		// Broadcast join event
		this.broadcast(
			{
				type: "join",
				userId: session.userId,
			},
			session.userId,
		);

		return new Response(null, { status: 101, webSocket: client });
	}

	async webSocketMessage(webSocket: WebSocket, message: string) {
		const session = this.sessions.get(webSocket);
		if (!session) {
			return;
		}

		try {
			const parsedMsg: WsMessage = JSON.parse(message);

			if (parsedMsg.type === "message") {
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

	async webSocketClose(webSocket: WebSocket) {
		const session = this.sessions.get(webSocket);
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
			this.sessions.delete(webSocket);
		}
		webSocket.close();
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
