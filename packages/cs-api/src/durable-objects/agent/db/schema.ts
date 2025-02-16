import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export const agentConfig = sqliteTable("agent_config", {
	id: text("id").primaryKey().default(nanoid()),
	name: text("name").notNull(),
	image: text("image").notNull(),
	systemPrompt: text("system_prompt").notNull(),
	organizationId: text("organization_id").notNull(),
	createdAt: integer("created_at", { mode: "number" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`),
});
