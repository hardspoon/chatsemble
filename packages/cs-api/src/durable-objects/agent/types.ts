import type { agentChatRoomNotification } from "./db/schema";

export type AgentChatRoomNotification =
	typeof agentChatRoomNotification.$inferSelect;
