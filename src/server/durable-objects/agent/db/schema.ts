import type {
	EmojiUsage,
	LanguageStyle,
	WorkflowSteps,
	Tone,
	Verbosity,
} from "@shared/types";
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";

export const agentConfig = sqliteTable("agent_config", {
	id: text("id").primaryKey(), // Same as the DO ID
	email: text("email").notNull().unique(),
	// Identity
	name: text("name").notNull(),
	image: text("image").notNull(),
	description: text("description").notNull(),
	// Personality
	tone: text("tone").$type<Tone>().notNull(),
	verbosity: text("verbosity").$type<Verbosity>().notNull(),
	emojiUsage: text("emoji_usage").$type<EmojiUsage>().notNull(),
	languageStyle: text("language_style").$type<LanguageStyle>().notNull(),
	// Metadata
	organizationId: text("organization_id").notNull(),
	createdAt: integer("created_at").notNull().default(sql`(unixepoch() * 1000)`),
});

export const workflows = sqliteTable("workflows", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid(36)), // Workflow unique ID
	chatRoomId: text("chat_room_id").notNull(),
	goal: text("goal").notNull(),
	steps: text("steps", { mode: "json" }).$type<WorkflowSteps>().notNull(),
	scheduleExpression: text("schedule_expression").notNull(), // e.g., CRON or ISO
	nextExecutionTime: integer("next_execution_time").notNull(), // Timestamp ms
	lastExecutionTime: integer("last_execution_time"), // Timestamp ms
	isActive: integer("is_active", { mode: "boolean" }).notNull(),
	isRecurring: integer("is_recurring", { mode: "boolean" }).notNull(),
	createdAt: integer("created_at").notNull().default(sql`(unixepoch() * 1000)`),
	updatedAt: integer("updated_at").notNull().default(sql`(unixepoch() * 1000)`),
});
