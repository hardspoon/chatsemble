import * as globalSchema from "../schema";
import { and, eq } from "drizzle-orm";
import { db } from "..";

export async function getChatRoom(params: {
	chatRoomId: string;
	organizationId: string;
}) {
	const room = await db
		.select()
		.from(globalSchema.chatRoom)
		.where(
			and(
				eq(globalSchema.chatRoom.id, params.chatRoomId),
				eq(globalSchema.chatRoom.organizationId, params.organizationId),
			),
		)
		.get();

	return room ?? null;
}
