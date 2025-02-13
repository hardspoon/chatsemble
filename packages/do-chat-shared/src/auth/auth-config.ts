import type { BetterAuthOptions } from "better-auth";

export const authConfig = {
	emailAndPassword: {
		enabled: true,
	},
	advanced: {
		crossSubDomainCookies: {
			enabled: true,
		},
	},
} satisfies BetterAuthOptions;
