import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { DrizzleD1Database } from "drizzle-orm/d1";

import * as schema from "@/server/db/schema";

// eslint-disable-next-line import/no-unused-modules
export let db: DrizzleD1Database<typeof schema> | null = null;

export const getDB = () => {
	if (db) {
		return db;
	}

	const { env } = getCloudflareContext();

	db = drizzle(env.DB, { schema, logger: true });

	return db;
};
