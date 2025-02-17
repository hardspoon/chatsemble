import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { ChatRoomMemberRole, ChatRoomMemberType } from "@/cs-shared";

export const chatRoomConfig = sqliteTable("chat_room_config", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	organizationId: text("organization_id").notNull(),
	createdAt: integer("created_at", { mode: "number" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`),
});

export const chatMessage = sqliteTable("chat_message", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid()),
	content: text("content").notNull(),
	memberId: text("member_id")
		.notNull()
		.references(() => chatRoomMember.id),
	createdAt: integer("created_at", { mode: "number" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`),
});

export const chatRoomMember = sqliteTable("chat_room_member", {
	id: text("id").primaryKey(), // User ID or Agent ID
	type: text("type").$type<ChatRoomMemberType>().notNull(),
	role: text("role").$type<ChatRoomMemberRole>().notNull(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	image: text("image"),
	createdAt: integer("created_at", { mode: "number" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`),
});
