import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDB } from "@/server/db"; // your drizzle instance

export const getAuth = () =>
	betterAuth({
		database: drizzleAdapter(getDB(), {
			provider: "sqlite",
		}),
		emailAndPassword: {
			enabled: true,
		},
		advanced: {
			crossSubDomainCookies: {
				enabled: true,
			},
		},
	});
