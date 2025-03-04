import { hc } from "hono/client";
import type { AppType } from "../../../cs-api/src/index";
//import { getSession } from "next-auth/react";

const API_HOST =
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	process.env.NEXT_PUBLIC_DO_CHAT_API_HOST!;

// TODO: Create a error handler wrapper around the api client to handle errors and show messages to the user with a optional toast
// NOTE: Should the wrapper also wrap around react query?

export const client = hc<AppType>(API_HOST, {
	init: {
		credentials: "include",
	},
});
