import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { organization } from "./auth";
import type {
	EmojiUsage,
	Verbosity,
	LanguageStyle,
	Tone,
} from "../../types/agent";

export const agent = sqliteTable("agent", {
	id: text("id").primaryKey(), // Same as the DO ID
	email: text("email").notNull().unique(),
	// Identity
	name: text("name").notNull(),
	image: text("image").notNull(),
	description: text("description").notNull(),
	// Personality
	tone: text("tone").$type<Tone>().notNull(),
	verbosity: text("verbosity").$type<Verbosity>().notNull(),
	emojiUsage: text("emoji_usage").$type<EmojiUsage>().notNull(),
	languageStyle: text("language_style").$type<LanguageStyle>().notNull(),
	// Metadata
	organizationId: text("organization_id")
		.notNull()
		.references(() => organization.id),
	createdAt: integer("created_at", { mode: "number" })
		.notNull()
		.default(sql`(unixepoch() * 1000)`),
});
