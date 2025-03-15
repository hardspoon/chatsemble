// packages/cs-api/src/durable-objects/agent/agentDbOperations.ts
import type { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { createAgentConfigService } from "./agent-config";
import { createAgentChatRoomService } from "./agent-chat-room";
import { createAgentChatRoomQueueService } from "./agent-chat-room-queue";

export function createAgentDbServices(
	db: DrizzleSqliteDODatabase,
	agentId: string,
) {
	const agentConfigOps = createAgentConfigService(db, agentId);
	const agentChatRoomOps = createAgentChatRoomService(db);
	const agentChatRoomQueueOps = createAgentChatRoomQueueService(db);

	return {
		...agentConfigOps,
		...agentChatRoomOps,
		...agentChatRoomQueueOps,
	};
}
