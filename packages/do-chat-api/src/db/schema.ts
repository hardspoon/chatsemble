import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { nanoid } from "nanoid";

export const chatMessagesTable = sqliteTable("chat_messages_table", {
	id: text("id", { length: 36 })
		.primaryKey()
		.$defaultFn(() => nanoid(36)),
	message: text("message").notNull(),
	createdAt: integer("created_at", { mode: "number" })
		.notNull()
		.default(sql`(unixepoch())`),
});
