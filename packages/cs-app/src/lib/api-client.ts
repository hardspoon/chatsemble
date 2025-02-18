import { hc } from "hono/client";
import type { AppType } from "../../../cs-api/src/index";
//import { getSession } from "next-auth/react";

const API_HOST =
	process.env.NEXT_PUBLIC_DO_CHAT_API_HOST || "http://localhost:8787";

export const client = hc<AppType>(API_HOST, {
	init: {
		credentials: "include",
	},
});
