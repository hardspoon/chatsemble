// packages/cs-api/src/durable-objects/agent/agentDbOperations.ts
import type { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { createAgentChatRoomService } from "./agent-chat-room";
import { createAgentChatRoomQueueService } from "./agent-chat-room-queue";
import { createAgentConfigService } from "./agent-config";

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
