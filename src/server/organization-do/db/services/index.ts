import type { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { createChatRoomService } from "./chat-room";
import { createChatRoomMemberService } from "./chat-room-members";
import { createChatRoomMessageService } from "./chat-room-message";
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
