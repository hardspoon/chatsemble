import type { ChatRoomMessage } from "@shared/types";
import { and, desc, eq, gt, isNull, lte } from "drizzle-orm";
import type { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { chatMessage, chatRoomMember } from "../schema";

export function createChatRoomMessageService(db: DrizzleSqliteDODatabase) {
	async function getChatRoomMessages(options: {
		roomId: string;
		threadId?: number | null;
		limit?: number;
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
				roomId: chatMessage.roomId,
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

		const conditions = [eq(chatMessage.roomId, options.roomId)];

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
		getChatRoomMessages,
	};
}
