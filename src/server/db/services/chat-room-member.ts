import { and, eq } from "drizzle-orm";
import { db } from "..";
import * as globalSchema from "../schema";

export async function getChatRoomMember(params: {
	chatRoomId: string;
	memberId: string;
}) {
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
