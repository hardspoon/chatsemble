import type { schema } from "@/cs-shared";
import type { DrizzleDB } from "@/cs-shared";

export type HonoVariables = {
	Bindings: Env;
	Variables: {
		user: typeof schema.user.$inferSelect;
		session: typeof schema.session.$inferSelect;
		db: DrizzleDB;
	};
};
