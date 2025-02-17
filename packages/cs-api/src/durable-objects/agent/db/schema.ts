import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const agentConfig = sqliteTable("agent_config", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	image: text("image").notNull(),
	systemPrompt: text("system_prompt").notNull(),
	organizationId: text("organization_id").notNull(),
	createdAt: integer("created_at", { mode: "number" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`),
});

export const agentChatRoom = sqliteTable("agent_chat_room", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	notifications: integer("notifications").notNull().default(0),
	lastNotificationAt: integer("last_notification_at", {
		mode: "number",
	})
		.notNull()
		.default(sql`(unixepoch() * 1000)`),
	organizationId: text("organization_id").notNull(),
	createdAt: integer("created_at", { mode: "number" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`),
});
