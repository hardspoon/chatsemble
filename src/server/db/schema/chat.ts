import {
	integer,
	primaryKey,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { organization } from "./auth";
import type {
	ChatRoomMemberRole,
	ChatRoomMemberType,
	ChatRoomType,
} from "@/shared/types";

export const chatRoom = sqliteTable("chat_room", {
	id: text("id").primaryKey(), // Same as the DO ID
	name: text("name").notNull(),
	type: text("type").$type<ChatRoomType>().notNull(),
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id),
	createdAt: integer("created_at", { mode: "number" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`),
});

export const chatRoomRelations = relations(chatRoom, ({ many }) => ({
	members: many(chatRoomMember),
}));

export const chatRoomMember = sqliteTable(
	"chat_room_member",
	{
		memberId: text("member_id").notNull(), // User ID or Agent ID
		roomId: text("room_id")
			.notNull()
			.references(() => chatRoom.id),
		type: text("type").$type<ChatRoomMemberType>().notNull(),
		role: text("role").$type<ChatRoomMemberRole>().notNull(),
		createdAt: integer("created_at", { mode: "number" })
			.notNull()
			.default(sql`(unixepoch() * 1000)`),
	},
	(t) => [primaryKey({ columns: [t.roomId, t.memberId] })],
);

export const chatRoomMemberRelations = relations(chatRoomMember, ({ one }) => ({
	room: one(chatRoom, {
		fields: [chatRoomMember.roomId],
		references: [chatRoom.id],
	}),
}));
