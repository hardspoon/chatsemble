import type { DrizzleDB } from "../../../types/drizzle";
import { globalSchema } from "../../../db/schema";
import { and, eq } from "drizzle-orm";

export async function getChatRoomMember(
	db: DrizzleDB,
	params: {
		chatRoomId: string;
		memberId: string;
	},
) {
	const roomMember = await db
		.select()
		.from(globalSchema.chatRoomMember)
		.where(
			and(
				eq(globalSchema.chatRoomMember.memberId, params.memberId),
				eq(globalSchema.chatRoomMember.roomId, params.chatRoomId),
			),
		)
		.limit(1)
		.get();

	return roomMember ?? null;
}
