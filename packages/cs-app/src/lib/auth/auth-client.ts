import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

console.log({
	reason: "ENV auth-clients",
	BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
	NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
	BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
	NEXT_PUBLIC_DO_CHAT_API_HOST: process.env.NEXT_PUBLIC_DO_CHAT_API_HOST,
});

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_URL, // the base url of your auth server
	plugins: [organizationClient()],
});
