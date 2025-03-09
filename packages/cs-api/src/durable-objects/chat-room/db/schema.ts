import type {
	ChatMentions,
	ChatRoomMemberRole,
	ChatRoomMemberType,
	ChatRoomType,
} from "@/cs-shared";
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";

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
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid()), // TODO: Should be sequential id
	content: text("content").notNull(),
	mentions: text("mentions", { mode: "json" }).$type<ChatMentions>().notNull(),
	memberId: text("member_id")
		.notNull()
		.references(() => chatRoomMember.id),
	createdAt: integer("created_at", { mode: "number" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`),
});

export const chatRoomMember = sqliteTable("chat_room_member", {
	id: text("id").primaryKey(), // User ID or Agent ID // TODO: Check about using branded types
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
