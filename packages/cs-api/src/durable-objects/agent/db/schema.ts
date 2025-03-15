import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const agentConfig = sqliteTable("agent_config", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	image: text("image").notNull(),
	systemPrompt: text("system_prompt").notNull(),
	organizationId: text("organization_id").notNull(),
	createdAt: integer("created_at").notNull().default(sql`(unixepoch() * 1000)`),
});

export const agentChatRoom = sqliteTable("agent_chat_room", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	organizationId: text("organization_id").notNull(),
	createdAt: integer("created_at").notNull().default(sql`(unixepoch() * 1000)`),
});

// Table to track notifications for both top-level messages and thread messages
export const agentChatRoomQueue = sqliteTable("agent_chat_room_queue", {
	// Composite primary key of roomId + threadId (null for top-level messages)
	id: text("id").primaryKey(), // Format: "roomId:threadId" or "roomId:" for top-level
	roomId: text("room_id").notNull(), // References agentChatRoom.id
	threadId: integer("thread_id"), // null means top-level messages
	lastProcessedId: integer("last_processed_id"),
	// Time when the messages for this room/thread should be processed by the agent
	processAt: integer("process_at"),
	createdAt: integer("created_at").notNull().default(sql`(unixepoch() * 1000)`),
});
