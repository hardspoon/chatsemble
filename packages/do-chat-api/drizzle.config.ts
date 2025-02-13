import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// For Durable Objects
export default defineConfig({
	out: "./src/db/migrations",
	schema: "./src/db/schema.ts",
	dialect: "sqlite",
	driver: "durable-sqlite",
});
