import type { DrizzleDB } from "../../../types/drizzle";
import * as d1Schema from "../../../db/schema";
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
		.from(d1Schema.chatRoomMember)
		.where(
			and(
				eq(d1Schema.chatRoomMember.memberId, params.memberId),
				eq(d1Schema.chatRoomMember.roomId, params.chatRoomId),
			),
		)
		.limit(1)
		.get();

	return roomMember ?? null;
}
