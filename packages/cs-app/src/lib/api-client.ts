import { hc } from "hono/client";
import type { AppType } from "../../../cs-api/src/index";
//import { getSession } from "next-auth/react";

const API_HOST =
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	process.env.NEXT_PUBLIC_DO_CHAT_API_HOST!;

console.log({
	reason: "API_HOST",
	API_HOST,
});

export const client = hc<AppType>(API_HOST, {
	init: {
		credentials: "include",
	},
});
