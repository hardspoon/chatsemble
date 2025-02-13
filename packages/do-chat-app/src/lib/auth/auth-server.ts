import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDB } from "@/server/db"; // your drizzle instance
import { authConfig } from "@/do-chat-shared";

export const getAuth = () =>
	betterAuth({
		database: drizzleAdapter(getDB(), {
			provider: "sqlite",
		}),
		...authConfig,
	});
