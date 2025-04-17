import type { ChatRoomMember } from "@shared/types";
import { and, eq } from "drizzle-orm";
import type { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { chatRoomMember } from "../schema";

export function createChatRoomMemberService(db: DrizzleSqliteDODatabase) {
	return {
		/**
		 * Get all members of a chat room
		 * @param roomId - The id of the chat room
		 * @returns All members of the chat room
		 */
		async getChatRoomMembers(roomId: string): Promise<ChatRoomMember[]> {
			return await db
				.select()
				.from(chatRoomMember)
				.where(eq(chatRoomMember.roomId, roomId));
		},

		/**
		 * Delete a member from a chat room
		 * @param roomId - The id of the chat room
		 * @param memberId - The id of the member to delete
		 */
		async deleteChatRoomMember({
			roomId,
			memberId,
		}: {
			roomId: string;
			memberId: string;
		}) {
			await db
				.delete(chatRoomMember)
				.where(
					and(
						eq(chatRoomMember.roomId, roomId),
						eq(chatRoomMember.id, memberId),
					),
				);
		},

		/**
		 * Add a member to a chat room
		 * @param newChatRoomMember - The member to add
		 */
		async addChatRoomMember(
			newChatRoomMember: typeof chatRoomMember.$inferInsert,
		) {
			return await db
				.insert(chatRoomMember)
				.values(newChatRoomMember)
				.returning().get();
		},
	};
}
