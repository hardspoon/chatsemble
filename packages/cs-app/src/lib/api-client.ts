import { hc } from "hono/client";
import type { AppType } from "../../../cs-api/src/index";
//import { getSession } from "next-auth/react";

const API_HOST =
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	process.env.NEXT_PUBLIC_DO_CHAT_API_HOST!;

console.log({
	reason: "ENV api-client",
	NEXT_PUBLIC_DO_CHAT_API_HOST: process.env.NEXT_PUBLIC_DO_CHAT_API_HOST,
	BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
	NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
	BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
});

export const client = hc<AppType>(API_HOST, {
	init: {
		credentials: "include",
		
	},
});
