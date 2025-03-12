import { DurableObject } from "cloudflare:workers";
import type {
	ChatRoomMember,
	ChatRoomMemberType,
	ChatRoomMessage,
	ChatRoomMessagePartial,
	WsChatIncomingMessage,
	WsChatOutgoingMessage,
} from "@/cs-shared";
import { desc, eq, inArray, isNull } from "drizzle-orm";
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
			// TODO: Generic opportunity in WebSocket message handlers could benefit from type guards like:
			/* function isWsIncomingMessage(msg: unknown): msg is WsChatIncomingMessage {
				// validation logic
			  } */

			const parsedMsg: WsChatIncomingMessage = JSON.parse(message);
			switch (parsedMsg.type) {
				case "message-send": {
					await this.receiveChatRoomMessage(session.userId, parsedMsg.message, {
						notifyAgents: true,
					});
					break;
				}
				case "chat-init-request": {
					this.sendWebSocketMessageToUser(
						{
							type: "chat-init-response",
							messages: await this.getMessages({
								threadId: null,
							}),
							members: await this.getMembers(),
							room: await this.getConfig(),
						},
						session.userId,
					);
					break;
				}
				case "thread-init-request": {
					const threadMessage = await this.getMessageById(parsedMsg.threadId);
					if (!threadMessage) {
						throw new Error("Thread message not found");
					}

					const threadMessages = await this.getMessages({
						threadId: parsedMsg.threadId,
					});

					this.sendWebSocketMessageToUser(
						{
							type: "thread-init-response",
							threadId: parsedMsg.threadId,
							threadMessage,
							messages: threadMessages,
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
		const chatRoomMessage = await this.insertMessage({
			memberId,
			content: message.content,
			mentions: message.mentions,
			parentId: message.parentId,
			metadata: {
				optimisticData: {
					createdAt: message.createdAt,
					id: message.id,
				},
			},
		});

		if (chatRoomMessage.parentId === null) {
			// Broadcast to all users
			this.broadcastWebSocketMessage({
				type: "message-broadcast",
				message: chatRoomMessage,
			});
		} else {
			this.broadcastWebSocketMessage({
				type: "thread-message-broadcast",
				threadId: chatRoomMessage.parentId,
				message: chatRoomMessage,
			});
		}

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

	async insertMessage(
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
		const messageWithMember = await this.getMessageById(insertedMessage.id);

		if (!messageWithMember) {
			throw new Error("Failed to fetch message with user data");
		}

		return messageWithMember;
	}

	async getMessageById(id: number): Promise<ChatRoomMessage | undefined> {
		return await this.db
			.select({
				id: chatMessage.id,
				content: chatMessage.content,
				mentions: chatMessage.mentions,
				memberId: chatMessage.memberId,
				createdAt: chatMessage.createdAt,
				metadata: chatMessage.metadata,
				parentId: chatMessage.parentId,
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
			.where(eq(chatMessage.id, id))
			.get();
	}

	async getMessages(options: {
		limit?: number;
		threadId?: number | null;
	}): Promise<ChatRoomMessage[]> {
		const query = this.db
			.select({
				id: chatMessage.id,
				content: chatMessage.content,
				mentions: chatMessage.mentions,
				memberId: chatMessage.memberId,
				createdAt: chatMessage.createdAt,
				metadata: chatMessage.metadata,
				parentId: chatMessage.parentId,
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
			.orderBy(desc(chatMessage.id));

		if (options.limit) {
			query.limit(options.limit);
		}

		if (options.threadId === null) {
			query.where(isNull(chatMessage.parentId));
		} else if (typeof options.threadId === "number") {
			query.where(eq(chatMessage.parentId, options.threadId));
		}

		const result = await query;
		// Reverse to get chronological order (oldest to newest)
		return result.reverse();
	}

	async addMembers(members: (typeof chatRoomMember.$inferInsert)[]) {
		await this.db.insert(chatRoomMember).values(members).onConflictDoNothing();

		this.broadcastWebSocketMessage({
			type: "member-update",
			members: await this.getMembers(),
		});
	}

	async removeMembers(memberIds: string[]) {
		await this.db
			.delete(chatRoomMember)
			.where(inArray(chatRoomMember.id, memberIds));

		this.broadcastWebSocketMessage({
			type: "member-update",
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

	async getMembers(filter?: {
		type?: ChatRoomMemberType;
	}): Promise<ChatRoomMember[]> {
		const query = this.db.select().from(chatRoomMember);

		if (filter?.type) {
			query.where(eq(chatRoomMember.type, filter.type));
		}

		return await query.all();
	}

	async upsertConfig(config: typeof chatRoomConfig.$inferInsert) {
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

	async getConfig() {
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
