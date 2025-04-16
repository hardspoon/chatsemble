import type { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { createChatRoomService } from "./chat-room";

export function createChatRoomDbServices(db: DrizzleSqliteDODatabase) {
	const chatRoomService = createChatRoomService(db);

	return {
		...chatRoomService,
	};
}
