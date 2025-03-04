import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import Database from "better-sqlite3";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { drizzle } from "drizzle-orm/d1";
import type { DrizzleD1Database } from "drizzle-orm/d1";

import { globalSchema } from "@/cs-shared";

// eslint-disable-next-line import/no-unused-modules
export let db:
	| DrizzleD1Database<typeof globalSchema>
	| BetterSQLite3Database<typeof globalSchema>
	| null = null;

export const getDB = () => {
	if (db) {
		return db;
	}

	const wranglerStatePath = process.env.WRANGLER_STATE_PATH;
	if (wranglerStatePath?.length) {
		const dbPath = findSqliteFile(wranglerStatePath);
		if (!dbPath) {
			throw new Error(
				"Could not find SQLite database file. Make sure you've run migrations first.",
			);
		}

		const sqlite = new Database(dbPath);
		db = drizzleSqlite(sqlite, { schema: globalSchema, logger: false });
		return db;
	}

	// Check for Cloudflare environment first
	const { env } = getCloudflareContext();

	// If we have the D1 binding and we're not explicitly using local DB, use D1
	if (env.DB) {
		db = drizzle(env.DB, { schema: globalSchema, logger: false });
		return db;
	}

	throw new Error(
		"No database configuration found. Set WRANGLER_STATE_PATH for local development or use D1 binding.",
	);
};

function findSqliteFile(basePath: string): string | null {
	try {
		const d1Path = resolve(process.cwd(), basePath, "v3/d1");
		const dbFile = readdirSync(d1Path, {
			encoding: "utf-8",
			recursive: true,
		}).find((f) => f.endsWith(".sqlite"));

		if (!dbFile) {
			throw new Error(`.sqlite file not found in ${d1Path}`);
		}

		return resolve(d1Path, dbFile);
	} catch (err) {
		console.error("Failed to find SQLite database:", err);
		return null;
	}
}
