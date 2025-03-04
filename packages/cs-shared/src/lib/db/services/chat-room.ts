import type { DrizzleDB } from "../../../types/drizzle";
import * as d1Schema from "../../../db/schema";
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
		.from(d1Schema.chatRoom)
		.where(
			and(
				eq(d1Schema.chatRoom.id, params.chatRoomId),
				eq(d1Schema.chatRoom.organizationId, params.organizationId),
			),
		)
		.get();

	return room ?? null;
}
