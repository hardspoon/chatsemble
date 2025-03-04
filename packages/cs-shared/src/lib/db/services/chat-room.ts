import type { DrizzleDB } from "../../../types/drizzle";
import { globalSchema } from "../../../db/schema";
import { and, eq } from "drizzle-orm";

export async function getChatRoom(
	db: DrizzleDB,
	params: {
		chatRoomId: string;
		organizationId: string;
	},
) {
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
