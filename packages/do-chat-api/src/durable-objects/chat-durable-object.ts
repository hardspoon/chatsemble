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
import type { Session } from "../types/session";

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
			const pair = new WebSocketPair();
			const [client, server] = Object.values(pair);

			// Use acceptWebSocket for hibernation support
			this.state.acceptWebSocket(server);

			// Create session
			const session: Session = {
				webSocket: server,
				blockedMessages: [],
			};
			this.sessions.set(server, session);

			// Send join messages for all online users
			for (const otherSession of this.sessions.values()) {
				if (otherSession.name) {
					session.blockedMessages.push(
						JSON.stringify({ joined: otherSession.name }),
					);
				}
			}

			// Load last 100 messages
			const storage = await this.select(100);
			for (const msg of storage) {
				session.blockedMessages.push(JSON.stringify(msg));
			}

			return new Response(null, { status: 101, webSocket: client });
		}

		return new Response("Not found", { status: 404 });
	}

	async webSocketMessage(webSocket: WebSocket, message: string) {
		const session = this.sessions.get(webSocket);
		if (!session || session.quit) {
			webSocket.close(1011, "WebSocket broken.");
			return;
		}

		try {
			const data = JSON.parse(message);

			// Handle initial user info message
			if (!session.name) {
				session.name = String(data.name || "anonymous");
				webSocket.serializeAttachment({ name: session.name });

				if (session.name.length > 32) {
					webSocket.send(JSON.stringify({ error: "Name too long." }));
					webSocket.close(1009, "Name too long.");
					return;
				}

				// Send queued messages
				for (const msg of session.blockedMessages) {
					webSocket.send(msg);
				}
				session.blockedMessages = [];

				// Broadcast join
				this.broadcast({ joined: session.name });
				webSocket.send(JSON.stringify({ ready: true }));
				return;
			}

			// Handle chat message
			if (data.message) {
				if (data.message.length > 256) {
					webSocket.send(JSON.stringify({ error: "Message too long." }));
					return;
				}

				const messageData = {
					name: session.name,
					message: String(data.message),
					timestamp: Math.max(Date.now(), this.lastTimestamp + 1),
				};
				this.lastTimestamp = messageData.timestamp;

				// Broadcast message
				const messageStr = JSON.stringify(messageData);
				this.broadcast(messageStr);

				// Save message
				await this.insert({
					message: messageData.message,
				});
			}
		} catch (err) {
			if (err instanceof Error) {
				webSocket.send(JSON.stringify({ error: err.stack }));
			}
		}
	}

	async webSocketClose(webSocket: WebSocket) {
		const session = this.sessions.get(webSocket);
		if (session) {
			session.quit = true;
			this.sessions.delete(webSocket);
			if (session.name) {
				this.broadcast({ quit: session.name });
			}
		}
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

	private broadcast(message: unknown) {
		const messageStr =
			typeof message === "string" ? message : JSON.stringify(message);

		// Send to all connected sessions
		const quitters: Session[] = [];
		for (const session of this.sessions.values()) {
			if (session.name) {
				try {
					session.webSocket.send(messageStr);
				} catch {
					session.quit = true;
					quitters.push(session);
					this.sessions.delete(session.webSocket);
				}
			} else {
				session.blockedMessages.push(messageStr);
			}
		}

		// Broadcast quit messages for failed connections
		for (const quitter of quitters) {
			if (quitter.name) {
				this.broadcast({ quit: quitter.name });
			}
		}
	}
}
