import type { ChatRoomMember } from "@shared/types";
import { eq } from "drizzle-orm";
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
	};
}
