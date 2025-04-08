import type { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { createChatRoomConfigService } from "./chat-room-config";
import { createChatRoomMemberService } from "./chat-room-member";
import { createChatRoomMessageService } from "./chat-room-message";

export function createChatRoomDbServices(db: DrizzleSqliteDODatabase) {
	const chatRoomConfigOps = createChatRoomConfigService(db);
	const chatRoomMemberOps = createChatRoomMemberService(db);
	const chatRoomMessageOps = createChatRoomMessageService(db);

	return {
		...chatRoomConfigOps,
		...chatRoomMemberOps,
		...chatRoomMessageOps,
	};
}
