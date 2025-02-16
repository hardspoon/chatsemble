import {
	sqliteTable,
	text,
	integer,
	primaryKey,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { ChatRoomMemberRole, ChatRoomMemberType } from "@/cs-shared";

export const chatMessagesTable = sqliteTable("chat_messages_table", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid()),
	content: text("content").notNull(),
	memberId: text("member_id")
		.notNull()
		.references(() => chatRoomMembersTable.id),
	createdAt: integer("created_at", { mode: "number" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`),
});

export const chatRoomMembersTable = sqliteTable(
	"chat_room_members",
	{
		id: text("id").notNull(), // User ID or Agent ID
		role: text("role").$type<ChatRoomMemberRole>().notNull(),
		type: text("type").$type<ChatRoomMemberType>().notNull(),
		name: text("name").notNull(),
		email: text("email").notNull().unique(),
		image: text("image"),
	},
	(t) => [primaryKey({ columns: [t.id, t.role] })],
);
