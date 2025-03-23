import { eq } from "drizzle-orm";
// packages/cs-api/src/durable-objects/agent/db/agentConfigOperations.ts
import type { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { agentConfig } from "../schema";

export function createAgentConfigService(
	db: DrizzleSqliteDODatabase,
	agentId: string,
) {
	return {
		async getAgentConfig() {
			const config = await db
				.select()
				.from(agentConfig)
				.where(eq(agentConfig.id, agentId))
				.get();
			if (!config) {
				throw new Error("Agent config not found");
			}
			return config;
		},

		async insertAgentConfig(
			agentConfigData: Omit<
				typeof agentConfig.$inferSelect,
				"id" | "createdAt"
			>,
		) {
			await db
				.insert(agentConfig)
				.values({
					...agentConfigData,
					id: agentId,
				})
				.onConflictDoUpdate({
					target: [agentConfig.id],
					set: {
						image: agentConfigData.image,
						name: agentConfigData.name,
						description: agentConfigData.description,
						tone: agentConfigData.tone,
						verbosity: agentConfigData.verbosity,
						emojiUsage: agentConfigData.emojiUsage,
						languageStyle: agentConfigData.languageStyle,
					},
				});
		},

		async updateAgentConfig(
			agentConfigData: Partial<
				Omit<typeof agentConfig.$inferSelect, "id" | "createdAt">
			>,
		) {
			await db
				.update(agentConfig)
				.set(agentConfigData)
				.where(eq(agentConfig.id, agentId));
		},
	};
}
