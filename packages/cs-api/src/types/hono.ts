import type { schema } from "@/cs-shared";
import type { DrizzleD1Database } from "drizzle-orm/d1";
export type HonoVariables = {
	Bindings: Env;
	Variables: {
		user: typeof schema.user.$inferSelect;
		session: typeof schema.session.$inferSelect;
		db: DrizzleD1Database<typeof schema>;
	};
};
