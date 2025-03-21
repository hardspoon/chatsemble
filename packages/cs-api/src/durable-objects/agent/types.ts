import type { ChatRoomMessage } from "@/cs-shared";
import type { agentChatRoomQueue } from "./db/schema";

export type AgentChatRoomQueueItem = typeof agentChatRoomQueue.$inferSelect;

export type AgentMessage = {
	content: ChatRoomMessage["content"];
	toolUses: ChatRoomMessage["toolUses"];
	member: {
		id: ChatRoomMessage["member"]["id"];
		name: ChatRoomMessage["member"]["name"];
		type: ChatRoomMessage["member"]["type"];
	};
};
