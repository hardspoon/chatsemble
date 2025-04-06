import type { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { chatRoomConfig } from "../schema";

export function createChatRoomConfigService(db: DrizzleSqliteDODatabase) {
	return {
		async getConfig() {
			const config = await db.select().from(chatRoomConfig).get();

			if (!config) {
				throw new Error("Chat room config not found");
			}

			return config;
		},

		async upsertConfig(config: typeof chatRoomConfig.$inferInsert) {
			await db
				.insert(chatRoomConfig)
				.values(config)
				.onConflictDoUpdate({
					target: [chatRoomConfig.id],
					set: {
						name: config.name,
						organizationId: config.organizationId,
					},
				});
		},
	};
}
