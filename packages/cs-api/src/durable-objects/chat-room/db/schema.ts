import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { ChatRoomMemberRole } from "@/cs-shared";

export const chatMessagesTable = sqliteTable("chat_messages_table", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid()),
	content: text("content").notNull(),
	userId: text("user_id")
		.notNull()
		.references(() => chatRoomMembersTable.id),
	createdAt: integer("created_at", { mode: "number" })
		.notNull()
		.default(sql`(unixepoch())`),
});

export const chatRoomMembersTable = sqliteTable("chat_room_members", {
	id: text("id").primaryKey(),
	role: text("role").$type<ChatRoomMemberRole>().notNull().default("member"),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	image: text("image"),
});
