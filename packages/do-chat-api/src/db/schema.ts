import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export const chatMessagesTable = sqliteTable("chat_messages_table", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid(36)),
	message: text("message").notNull(),
	userId: text("member_user_id").notNull(),
	createdAt: integer("created_at", { mode: "number" })
		.notNull()
		.default(sql`(unixepoch())`),
});

export const chatRoomSettingsTable = sqliteTable("chat_room_settings", {
	isArchived: integer("is_archived", { mode: "boolean" })
		.notNull()
		.default(false),
	maxHistory: integer("max_history").default(100),
});

export const chatRoomMembersTable = sqliteTable("chat_room_members", {
	id: text("user_id").notNull(),
	role: text("role").notNull().default("member"),
	joinedAt: integer("joined_at", { mode: "number" })
		.notNull()
		.default(sql`(unixepoch())`),
	lastActive: integer("last_active", { mode: "number" })
		.notNull()
		.default(sql`(unixepoch())`),
});
