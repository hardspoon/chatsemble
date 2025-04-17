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
import {
	integer,
	primaryKey,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";

export const chatRoom = sqliteTable("chat_room", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid(36)), // Same as the DO ID
	name: text("name").notNull(),
	type: text("type").$type<ChatRoomType>().notNull(),
	organizationId: text("organization_id").notNull(),
	createdAt: integer("created_at", { mode: "number" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`),
});

export const chatRoomMember = sqliteTable(
	"chat_room_member",
	{
		id: text("id").notNull(), // User ID or Agent ID
		roomId: text("room_id")
			.notNull()
			.references(() => chatRoom.id),
		type: text("type").$type<ChatRoomMemberType>().notNull(),
		role: text("role").$type<ChatRoomMemberRole>().notNull(),
		name: text("name").notNull(),
		email: text("email").notNull(),
		image: text("image"),
		createdAt: integer("created_at", { mode: "number" })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
	},
	(t) => [primaryKey({ columns: [t.roomId, t.id] })],
);

export const chatMessage = sqliteTable("chat_message", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	content: text("content").notNull(),
	mentions: text("mentions", { mode: "json" }).$type<ChatMentions>().notNull(),
	toolUses: text("tool_uses", { mode: "json" })
		.$type<AgentToolUse[]>() // TODO: Add versioning to columns that are json type
		.notNull(),
	memberId: text("member_id").notNull(),
	createdAt: integer("created_at", { mode: "number" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`),
	metadata: text("metadata", { mode: "json" })
		.$type<ChatMessageMetadata>()
		.notNull(),
	threadMetadata: text("thread_metadata", {
		mode: "json",
	}).$type<ChatMessageThreadMetadata>(),
	roomId: text("room_id")
		.notNull()
		.references(() => chatRoom.id),
	threadId: integer("thread_id"),
});
