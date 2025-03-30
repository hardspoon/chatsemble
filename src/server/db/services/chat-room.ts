import { and, eq } from "drizzle-orm";
import { db } from "..";
import * as globalSchema from "../schema";

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
