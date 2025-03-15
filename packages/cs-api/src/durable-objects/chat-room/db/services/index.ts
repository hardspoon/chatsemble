import type { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { createChatRoomMemberService } from "./chat-room-member";
import { createChatRoomMessageService } from "./chat-room-message";
import { createChatRoomConfigService } from "./chat-room-config";

export function createChatRoomDbServices(
	db: DrizzleSqliteDODatabase,
	chatRoomId: string,
) {
	const chatRoomConfigOps = createChatRoomConfigService(db, chatRoomId);
	const chatRoomMemberOps = createChatRoomMemberService(db);
	const chatRoomMessageOps = createChatRoomMessageService(db);

	return {
		...chatRoomConfigOps,
		...chatRoomMemberOps,
		...chatRoomMessageOps,
	};
}
