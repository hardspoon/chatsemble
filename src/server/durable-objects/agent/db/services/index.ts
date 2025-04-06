import type { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { createAgentConfigService } from "./agent-config";
import { createWorkflowService } from "./workflow";

export function createAgentDbServices(
	db: DrizzleSqliteDODatabase,
	agentId: string,
) {
	const agentConfigService = createAgentConfigService(db, agentId);
	const workflowService = createWorkflowService(db);
	return {
		...agentConfigService,
		...workflowService,
	};
}
