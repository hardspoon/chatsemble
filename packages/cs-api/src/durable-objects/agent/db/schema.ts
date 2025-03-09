import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
	// Time when the chat room should be processed by the agent
	processAt: integer("process_at", { mode: "number" }),
	organizationId: text("organization_id").notNull(),
	createdAt: integer("created_at", { mode: "number" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`),
});
