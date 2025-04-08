import type {
	AgentToolUse,
	ChatMentions,
	ChatMessageMetadata,
	ChatMessageThreadMetadata,
	ChatRoomMemberRole,
	ChatRoomMemberType,
	ChatRoomType,
} from "@shared/types";
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const chatRoomConfig = sqliteTable("chat_room_config", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	type: text("type").$type<ChatRoomType>().notNull(),
	organizationId: text("organization_id").notNull(),
	createdAt: integer("created_at", { mode: "number" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`),
});

export const chatMessage = sqliteTable("chat_message", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	content: text("content").notNull(),
	mentions: text("mentions", { mode: "json" }).$type<ChatMentions>().notNull(),
	toolUses: text("tool_uses", { mode: "json" })
		.$type<AgentToolUse[]>() // TODO: Add versioning to columns that are json type
		.notNull(),
	memberId: text("member_id")
		.notNull()
		.references(() => chatRoomMember.id),
	createdAt: integer("created_at", { mode: "number" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`),
	metadata: text("metadata", { mode: "json" })
		.$type<ChatMessageMetadata>()
		.notNull(),
	threadMetadata: text("thread_metadata", {
		mode: "json",
	}).$type<ChatMessageThreadMetadata>(),
	threadId: integer("thread_id"),
});

export const chatRoomMember = sqliteTable("chat_room_member", {
	id: text("id").primaryKey(), // User ID or Agent ID
	roomId: text("room_id").notNull(),
	type: text("type").$type<ChatRoomMemberType>().notNull(),
	role: text("role").$type<ChatRoomMemberRole>().notNull(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	image: text("image"),
	createdAt: integer("created_at", { mode: "number" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`),
});
