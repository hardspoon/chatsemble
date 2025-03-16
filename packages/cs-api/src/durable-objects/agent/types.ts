import type { ChatRoomMessage } from "@/cs-shared";
import type { agentChatRoomQueue } from "./db/schema";

export type AgentChatRoomQueueItem = typeof agentChatRoomQueue.$inferSelect;

export type AgentMessage = {
	content: string;

	user: {
		id: ChatRoomMessage["user"]["id"];
		name: ChatRoomMessage["user"]["name"];
		type: ChatRoomMessage["user"]["type"];
	};
};
