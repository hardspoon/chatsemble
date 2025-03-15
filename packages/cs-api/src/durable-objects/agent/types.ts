import type { agentChatRoomQueue } from "./db/schema";

export type AgentChatRoomQueueItem = typeof agentChatRoomQueue.$inferSelect;
