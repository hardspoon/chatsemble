import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { organization } from "./auth";

export const agent = sqliteTable("agent", {
	id: text("id").primaryKey(), // Same as the DO ID
	name: text("name").notNull(),
	image: text("image").notNull(),
	systemPrompt: text("system_prompt").notNull(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id),
	createdAt: integer("created_at", { mode: "number" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`),
});
