import type { ChatRoomMessage } from "@/cs-shared";
import type { agentChatRoomQueue } from "./db/schema";

export type AgentChatRoomQueueItem = typeof agentChatRoomQueue.$inferSelect;

export type AgentMessage = {
	content: string;
	member: {
		id: ChatRoomMessage["member"]["id"];
		name: ChatRoomMessage["member"]["name"];
		type: ChatRoomMessage["member"]["type"];
	};
};
