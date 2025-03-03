import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "../db/schema";

export type DrizzleDB = DrizzleD1Database<typeof schema>;
