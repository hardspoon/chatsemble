import { hc } from "hono/client";
import type { AppType } from "../../../do-chat-api/src/index";
//import { getSession } from "next-auth/react";

const API_HOST =
	process.env.NEXT_PUBLIC_DO_CHAT_API_HOST || "http://localhost:8787";

/* // Function to get the configured client with auth token
export const getAuthenticatedClient = async () => {
	const session = await getSession();
	console.log("Session:", session);

	return hc<AppType>(API_HOST, {
		headers: session
			? {
					Authorization: `Bearer ${session.sessionToken}`,
				}
			: {},
	});
};
 */
// Default client without authentication
export const client = hc<AppType>(API_HOST, {
	init: {
		credentials: "include",
	},
});
