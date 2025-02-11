/// <reference types="@cloudflare/workers-types" />
/// <reference types="../../worker-configuration" />
import {
	drizzle,
	type DrizzleSqliteDODatabase,
} from "drizzle-orm/durable-sqlite";
import { DurableObject } from "cloudflare:workers";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";
import migrations from "../db/migrations/migrations";
import { chatMessagesTable } from "../db/schema";
import { desc } from "drizzle-orm";
import type { Session, WsMessage } from "../types/session";
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
			if (meta.userId && meta.userName) {
				this.sessions.set(webSocket, {
					webSocket,
					userId: meta.userId,
					userName: meta.userName,
				});
			}
		}
	}

	async migrate() {
		migrate(this.db, migrations);
	}

	async insert(message: typeof chatMessagesTable.$inferInsert) {
		await this.db.insert(chatMessagesTable).values(message);
	}

	async select(limit?: number) {
		const query = this.db
			.select()
			.from(chatMessagesTable)
			.orderBy(desc(chatMessagesTable.createdAt));
		if (limit) {
			query.limit(limit);
		}
		return await query;
	}

	async fetch(request: Request) {
		if (request.headers.get("Upgrade") === "websocket") {
			const webSocketPair = new WebSocketPair();
			const [client, server] = Object.values(webSocketPair);

			// Create session with generated userId and userName
			const userId = nanoid();
			const userName = `User-${userId.slice(0, 6)}`;
			
			// Serialize the session data for hibernation
			server.serializeAttachment({
				userId,
				userName,
			});

			this.state.acceptWebSocket(server);

			const session: Session = {
				webSocket: server,
				userId,
				userName,
			};
			this.sessions.set(server, session);

			// Broadcast join event
			this.broadcast({ 
				type: "join", 
				userId: session.userId, 
				userName: session.userName 
			});

			return new Response(null, { status: 101, webSocket: client });
		}

		return new Response("Not found", { status: 404 });
	}

	async webSocketMessage(webSocket: WebSocket, message: string) {
		if (typeof message !== "string") {
			return;
		}

		const session = this.sessions.get(webSocket);
		if (!session) {
			return;
		}

		try {
			const parsedMsg: WsMessage = JSON.parse(message);
			
			if (parsedMsg.type === "message") {
				// Store message in database
				await this.insert({
					message: parsedMsg.data,
					userId: session.userId,
					userName: session.userName,
				});

				// Broadcast message to all except sender
				this.broadcast(
					{ 
						type: "message", 
						userId: session.userId, 
						userName: session.userName, 
						data: parsedMsg.data 
					},
					session.userId
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
			// Broadcast quit message
			this.broadcast({ 
				type: "quit", 
				userId: session.userId, 
				userName: session.userName 
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
				userName: session.userName 
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
}
