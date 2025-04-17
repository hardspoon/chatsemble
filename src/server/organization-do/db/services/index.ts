import type { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { createChatRoomService } from "./chat-room";
import { createChatRoomMessageService } from "./chat-room-message";
import { createChatRoomMemberService } from "./chat-room-members";
export function createChatRoomDbServices(db: DrizzleSqliteDODatabase) {
	const chatRoomService = createChatRoomService(db);
	const chatRoomMessageService = createChatRoomMessageService(db);
	const chatRoomMemberService = createChatRoomMemberService(db);
	return {
		...chatRoomService,
		...chatRoomMessageService,
		...chatRoomMemberService,
	};
}
