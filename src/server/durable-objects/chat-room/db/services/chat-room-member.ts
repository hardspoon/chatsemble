import type { ChatRoomMember, ChatRoomMemberType } from "@shared/types";
import { eq, inArray } from "drizzle-orm";
import type { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { chatRoomMember } from "../schema";

export function createChatRoomMemberService(db: DrizzleSqliteDODatabase) {
	return {
		async addMembers(members: (typeof chatRoomMember.$inferInsert)[]) {
			await db.insert(chatRoomMember).values(members).onConflictDoNothing();
		},

		async removeMembers(memberIds: string[]) {
			await db
				.delete(chatRoomMember)
				.where(inArray(chatRoomMember.id, memberIds));
		},

		async getMember(id: string): Promise<ChatRoomMember | undefined> {
			return db
				.select()
				.from(chatRoomMember)
				.where(eq(chatRoomMember.id, id))
				.get();
		},

		async getMembers(filter?: {
			type?: ChatRoomMemberType;
		}): Promise<ChatRoomMember[]> {
			const query = db.select().from(chatRoomMember);

			if (filter?.type) {
				query.where(eq(chatRoomMember.type, filter.type));
			}

			return await query.all();
		},
	};
}
