import { DurableObject } from "cloudflare:workers";
import type {
	ChatRoomMember,
	ChatRoomMemberType,
	ChatRoomMessage,
	ChatRoomMessagePartial,
	WsChatIncomingMessage,
	WsChatOutgoingMessage,
} from "@/cs-shared";
import { desc, eq } from "drizzle-orm";
/// <reference types="@cloudflare/workers-types" />
/// <reference types="../../../worker-configuration" />
import {
	type DrizzleSqliteDODatabase,
	drizzle,
} from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";
import type { Session } from "../../types/session";
import migrations from "./db/migrations/migrations";
import { chatMessage, chatRoomConfig, chatRoomMember } from "./db/schema";

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
			switch (parsedMsg.type) {
				case "message-receive": {
					await this.receiveChatRoomMessage(session.userId, parsedMsg.message, {
						notifyAgents: true,
					});
					break;
				}
				case "chat-init": {
					this.sendWebSocketMessageToUser(
						{
							type: "chat-ready",
							messages: await this.selectChatRoomMessages(),
							members: await this.getMembers(),
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

	async receiveChatRoomMessage(
		memberId: string,
		message: ChatRoomMessagePartial,
		config: {
			notifyAgents: boolean;
		},
	) {
		const chatRoomMessage = await this.insertChatRoomMessage({
			memberId,
			id: message.id,
			content: message.content,
		});

		this.broadcastWebSocketMessage(
			{
				type: "message-broadcast",
				message: chatRoomMessage,
			},
			memberId,
		);

		if (config?.notifyAgents) {
			const agentMembers = await this.getMembers({
				type: "agent",
			});

			for (const agent of agentMembers) {
				const agentDO = this.env.AGENT_DURABLE_OBJECT.get(
					this.env.AGENT_DURABLE_OBJECT.idFromString(agent.id),
				);

				await agentDO.receiveNotification({
					chatRoomId: this.ctx.id.toString(),
				});
			}
		}
	}

	async insertChatRoomMessage(
		message: typeof chatMessage.$inferInsert,
	): Promise<ChatRoomMessage> {
		// First insert the message
		const [insertedMessage] = await this.db
			.insert(chatMessage)
			.values(message)
			.returning();

		if (!insertedMessage) {
			throw new Error("Failed to insert message");
		}

		// Then fetch the message with user data
		const messageWithMember = await this.db
			.select({
				id: chatMessage.id,
				content: chatMessage.content,
				memberId: chatMessage.memberId,
				createdAt: chatMessage.createdAt,
				user: {
					id: chatRoomMember.id,
					roomId: chatRoomMember.roomId,
					role: chatRoomMember.role,
					type: chatRoomMember.type,
					name: chatRoomMember.name,
					email: chatRoomMember.email,
					image: chatRoomMember.image,
				},
			})
			.from(chatMessage)
			.innerJoin(chatRoomMember, eq(chatMessage.memberId, chatRoomMember.id))
			.where(eq(chatMessage.id, insertedMessage.id))
			.get();

		if (!messageWithMember) {
			throw new Error("Failed to fetch message with user data");
		}

		return messageWithMember;
	}

	async selectChatRoomMessages(limit?: number): Promise<ChatRoomMessage[]> {
		const query = this.db
			.select({
				id: chatMessage.id,
				content: chatMessage.content,
				memberId: chatMessage.memberId,
				createdAt: chatMessage.createdAt,
				user: {
					id: chatRoomMember.id,
					roomId: chatRoomMember.roomId,
					role: chatRoomMember.role,
					type: chatRoomMember.type,
					name: chatRoomMember.name,
					email: chatRoomMember.email,
					image: chatRoomMember.image,
				},
			})
			.from(chatMessage)
			.innerJoin(chatRoomMember, eq(chatMessage.memberId, chatRoomMember.id))
			.orderBy(desc(chatMessage.createdAt));

		if (limit) {
			query.limit(limit);
		}

		const result = await query;
		// Reverse to get chronological order (oldest to newest)
		return result.reverse();
	}

	async addMember(member: typeof chatRoomMember.$inferInsert) {
		await this.db
			.insert(chatRoomMember)
			.values(member)
			.onConflictDoUpdate({
				target: [chatRoomMember.id],
				set: {
					role: member.role,
					type: member.type,
					name: member.name,
					email: member.email,
					image: member.image,
				},
			});

		this.broadcastWebSocketMessage({
			type: "member-sync",
			members: await this.getMembers(),
		});
	}

	async getMember(id: string): Promise<ChatRoomMember | undefined> {
		return this.db
			.select()
			.from(chatRoomMember)
			.where(eq(chatRoomMember.id, id))
			.get();
	}

	async getMembers(
		filter?:
			| {
					type?: ChatRoomMemberType;
			  }
			| undefined,
	): Promise<ChatRoomMember[]> {
		const query = this.db.select().from(chatRoomMember);

		if (filter?.type) {
			query.where(eq(chatRoomMember.type, filter.type));
		}

		return await query.all();
	}

	async upsertChatRoomConfig(config: typeof chatRoomConfig.$inferInsert) {
		await this.db
			.insert(chatRoomConfig)
			.values(config)
			.onConflictDoUpdate({
				target: [chatRoomConfig.id],
				set: {
					name: config.name,
					organizationId: config.organizationId,
				},
			});
	}

	async getChatRoomConfig() {
		const config = await this.db
			.select()
			.from(chatRoomConfig)
			.where(eq(chatRoomConfig.id, this.ctx.id.toString()))
			.get();

		if (!config) {
			throw new Error("Chat room config not found");
		}

		return config;
	}
}
