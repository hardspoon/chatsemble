import type { ChatRoomMessage } from "@/shared/types";
import { and, desc, eq, gt, isNull, lte } from "drizzle-orm";
import type { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { chatMessage, chatRoomMember } from "../schema";

export function createChatRoomMessageService(db: DrizzleSqliteDODatabase) {
	async function getMessageById(
		id: number,
	): Promise<ChatRoomMessage | undefined> {
		return await db
			.select({
				id: chatMessage.id,
				content: chatMessage.content,
				mentions: chatMessage.mentions,
				toolUses: chatMessage.toolUses,
				memberId: chatMessage.memberId,
				createdAt: chatMessage.createdAt,
				metadata: chatMessage.metadata,
				threadId: chatMessage.threadId,
				threadMetadata: chatMessage.threadMetadata,
				member: {
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

	async function updateMessage(
		id: number,
		{
			...message
		}: Omit<
			typeof chatMessage.$inferSelect,
			| "id"
			| "createdAt"
			| "memberId"
			| "metadata"
			| "threadId"
			| "threadMetadata"
		>,
	): Promise<ChatRoomMessage> {
		const [updatedMessage] = await db
			.update(chatMessage)
			.set(message)
			.where(eq(chatMessage.id, id))
			.returning();

		if (!updatedMessage) {
			throw new Error("Failed to update message");
		}

		const messageWithMember = await getMessageById(updatedMessage.id);

		if (!messageWithMember) {
			throw new Error("Failed to fetch message with user data");
		}

		return messageWithMember;
	}

	async function updateMessageThreadMetadata(
		id: number,
		newMessage: ChatRoomMessage,
	) {
		const currentMessage = await getMessageById(id);

		if (!currentMessage) {
			throw new Error("Message not found");
		}

		const messageCount = currentMessage.threadMetadata?.messageCount ?? 0;

		await db
			.update(chatMessage)
			.set({
				threadMetadata: {
					lastMessage: newMessage,
					messageCount: messageCount + 1,
				},
			})
			.where(eq(chatMessage.id, id));

		const updatedMessage = await getMessageById(id);

		if (!updatedMessage) {
			throw new Error("Failed to fetch updated message");
		}

		return updatedMessage;
	}

	async function insertMessage(
		message: typeof chatMessage.$inferInsert,
	): Promise<ChatRoomMessage> {
		const [insertedMessage] = await db
			.insert(chatMessage)
			.values(message)
			.returning();

		if (!insertedMessage) {
			throw new Error("Failed to insert message");
		}

		const messageWithMember = await getMessageById(insertedMessage.id);

		if (!messageWithMember) {
			throw new Error("Failed to fetch message with user data");
		}

		return messageWithMember;
	}

	async function getMessages(options: {
		limit?: number;
		threadId?: number | null;
		afterId?: number;
		beforeId?: number;
	}): Promise<ChatRoomMessage[]> {
		const query = db
			.select({
				id: chatMessage.id,
				content: chatMessage.content,
				mentions: chatMessage.mentions,
				toolUses: chatMessage.toolUses,
				memberId: chatMessage.memberId,
				createdAt: chatMessage.createdAt,
				metadata: chatMessage.metadata,
				threadId: chatMessage.threadId,
				threadMetadata: chatMessage.threadMetadata,
				member: {
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

		const conditions = [];

		if (options.threadId === null) {
			conditions.push(isNull(chatMessage.threadId));
		} else if (options.threadId && typeof options.threadId === "number") {
			conditions.push(eq(chatMessage.threadId, options.threadId));
		}

		if (options.afterId) {
			conditions.push(gt(chatMessage.id, options.afterId));
		}

		if (options.beforeId) {
			conditions.push(lte(chatMessage.id, options.beforeId));
		}

		if (conditions.length > 0) {
			query.where(and(...conditions));
		}

		if (options.limit) {
			query.limit(options.limit);
		}

		const result = await query;
		return result.reverse();
	}

	return {
		insertMessage,
		updateMessage,
		updateMessageThreadMetadata,
		getMessageById,
		getMessages,
	};
}
