import type { DrizzleD1Database } from "drizzle-orm/d1";

export type HonoVariables = {
	Bindings: Env;
	Variables: {
		userId: string;
		db: DrizzleD1Database;
	};
};
