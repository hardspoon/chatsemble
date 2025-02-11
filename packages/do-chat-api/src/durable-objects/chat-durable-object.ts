/// <reference types="@cloudflare/workers-types" />
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

export class ChatDurableObject extends DurableObject<Env> {
	storage: DurableObjectStorage;
	db: DrizzleSqliteDODatabase;
	sessions: Map<WebSocket, Session>;
	lastTimestamp: number;
	state: DurableObjectState;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.storage = ctx.storage;
		this.db = drizzle(this.storage, { logger: false });
		this.sessions = new Map();
		this.lastTimestamp = 0;
		this.state = ctx;

		// Restore any existing WebSocket sessions
		for (const webSocket of ctx.getWebSockets()) {
			const meta = webSocket.deserializeAttachment() || {};
			this.sessions.set(webSocket, {
				webSocket,
				name: meta.name,
			});
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
		// Handle WebSocket connections
		if (request.headers.get("Upgrade") === "websocket") {
			const webSocketPair = new WebSocketPair();
			const [client, server] = Object.values(webSocketPair);

			// Use acceptWebSocket for hibernation support
			this.state.acceptWebSocket(server);

			// Create session
			const session: Session = {
				webSocket: server,
			};
			this.sessions.set(server, session);

			this.broadcast({ type: "join", id: "1" });

			return new Response(null, { status: 101, webSocket: client });
		}

		return new Response("Not found", { status: 404 });
	}

	async webSocketMessage(webSocket: WebSocket, message: string) {
		if (typeof message !== "string") {
			return;
		}

		const parsedMsg: WsMessage = JSON.parse(message);

		try {
			switch (parsedMsg.type) {
				case "message":
					this.broadcast({ type: "message", data: parsedMsg.data });
					break;
			}
		} catch (err) {
			if (err instanceof Error) {
				webSocket.send(JSON.stringify({ error: err.stack }));
			}
		}
	}

	async webSocketClose(ws: WebSocket) {
		const id = this.sessions.get(ws)?.name;
		id && this.broadcast({ type: "quit", id });
		this.sessions.delete(ws);
		ws.close();
	}

	async webSocketError(webSocket: WebSocket) {
		// Handle the error by closing the connection
		const session = this.sessions.get(webSocket);
		if (session) {
			session.quit = true;
			this.sessions.delete(webSocket);
			if (session.name) {
				this.broadcast({ quit: session.name });
			}
		}
	}

	private broadcast(message: WsMessage, self?: string) {
		for (const ws of this.ctx.getWebSockets()) {
			const { id } = ws.deserializeAttachment();
			if (id !== self) {
				ws.send(JSON.stringify(message));
			}
		}
	}
}
