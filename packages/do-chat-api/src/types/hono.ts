import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { schema } from "@/do-chat-shared";
export type HonoVariables = {
	Bindings: Env;
	Variables: {
		user: typeof schema.user.$inferSelect;
		db: DrizzleD1Database<typeof schema>;
	};
};
