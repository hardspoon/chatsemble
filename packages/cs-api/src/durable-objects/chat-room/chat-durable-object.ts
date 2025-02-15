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
import type { Session } from "../../types/session";
import type { ChatRoomMessage, WsChatRoomMessage } from "@/cs-shared";

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

		this.sendWebSocketMessageToUser(
			{
				type: "messages-sync",
				messages: await this.selectChatRoomMessages(),
			},
			session.userId,
			server,
		);

		return new Response(null, { status: 101, webSocket: client });
	}

	async webSocketMessage(webSocket: WebSocket, message: string) {
		const session = this.sessions.get(webSocket);
		if (!session) {
			return;
		}

		try {
			const parsedMsg: WsChatRoomMessage = JSON.parse(message);

			if (parsedMsg.type === "message-receive") {
				// Store message in database
				const message = await this.insertChatRoomMessage({
					userId: session.userId,
					id: parsedMsg.message.id,
					content: parsedMsg.message.content,
					//createdAt: parsedMsg.message.createdAt,
				});

				// Broadcast message to all except sender
				this.broadcastWebSocketMessage(
					{
						type: "message-broadcast",
						message,
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
			// Broadcast quit message
			/* this.broadcast({
				type: "quit",
				userId: session.userId,
			}); */
			this.sessions.delete(webSocket);
		}
		webSocket.close();
	}

	async webSocketError(webSocket: WebSocket) {
		const session = this.sessions.get(webSocket);
		if (session) {
			/* this.broadcast({
				type: "quit",
				userId: session.userId,
			}); */
			this.sessions.delete(webSocket);
		}
		webSocket.close();
	}

	private sendWebSocketMessageToUser(
		message: WsChatRoomMessage,
		userId: string,
		webSocket?: WebSocket,
	) {
		if (webSocket) {
			webSocket.send(JSON.stringify(message));
			return;
		}

		for (const [ws, session] of this.sessions.entries()) {
			if (session.userId === userId) {
				ws.send(JSON.stringify(message));
			}
		}
	}

	private broadcastWebSocketMessage(
		message: WsChatRoomMessage,
		excludeUserId?: string,
	) {
		for (const [ws, session] of this.sessions.entries()) {
			if (!excludeUserId || session.userId !== excludeUserId) {
				ws.send(JSON.stringify(message));
			}
		}
	}

	async insertChatRoomMessage(
		message: typeof chatMessagesTable.$inferInsert,
	): Promise<ChatRoomMessage> {
		// First insert the message
		const [insertedMessage] = await this.db
			.insert(chatMessagesTable)
			.values(message)
			.returning();

		if (!insertedMessage) {
			throw new Error("Failed to insert message");
		}

		// Then fetch the message with user data
		const messageWithUser = await this.db
			.select({
				id: chatMessagesTable.id,
				content: chatMessagesTable.content,
				userId: chatMessagesTable.userId,
				createdAt: chatMessagesTable.createdAt,
				user: {
					id: chatRoomMembersTable.id,
					role: chatRoomMembersTable.role,
					name: chatRoomMembersTable.name,
					email: chatRoomMembersTable.email,
					image: chatRoomMembersTable.image,
				},
			})
			.from(chatMessagesTable)
			.innerJoin(
				chatRoomMembersTable,
				eq(chatMessagesTable.userId, chatRoomMembersTable.id),
			)
			.where(eq(chatMessagesTable.id, insertedMessage.id))
			.get();

		if (!messageWithUser) {
			throw new Error("Failed to fetch message with user data");
		}

		return messageWithUser;
	}

	async selectChatRoomMessages(limit?: number): Promise<ChatRoomMessage[]> {
		const query = this.db
			.select({
				id: chatMessagesTable.id,
				content: chatMessagesTable.content,
				userId: chatMessagesTable.userId,
				createdAt: chatMessagesTable.createdAt,
				user: {
					id: chatRoomMembersTable.id,
					role: chatRoomMembersTable.role,
					name: chatRoomMembersTable.name,
					email: chatRoomMembersTable.email,
					image: chatRoomMembersTable.image,
				},
			})
			.from(chatMessagesTable)
			.innerJoin(
				chatRoomMembersTable,
				eq(chatMessagesTable.userId, chatRoomMembersTable.id),
			)
			.orderBy(desc(chatMessagesTable.createdAt));

		if (limit) {
			query.limit(limit);
		}

		return await query;
	}

	async addMember(member: typeof chatRoomMembersTable.$inferInsert) {
		await this.db
			.insert(chatRoomMembersTable)
			.values(member)
			.onConflictDoUpdate({
				target: chatRoomMembersTable.id,
				set: {
					role: member.role,
					name: member.name,
					email: member.email,
					image: member.image,
				},
			});
	}

	async getMember(id: string) {
		return this.db
			.select()
			.from(chatRoomMembersTable)
			.where(eq(chatRoomMembersTable.id, id))
			.get();
	}

	async getMembers() {
		return this.db.select().from(chatRoomMembersTable).all();
	}
}
