import type { DrizzleDB } from "@/cs-shared";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";

export const getAuth = ({
	authHost,
	secret,
	trustedOrigins,
	crossDomain,
	db,
}: {
	authHost: string;
	secret: string;
	trustedOrigins: string[];
	crossDomain: string;
	db: DrizzleDB;
}) => {
	return betterAuth({
		appName: "Chatsemble",
		baseURL: authHost,
		secret,
		trustedOrigins,
		database: drizzleAdapter(db, {
			provider: "sqlite",
		}),
		advanced: {
			crossSubDomainCookies: {
				enabled: true,
				domain: crossDomain,
			},
			defaultCookieAttributes: {
				httpOnly: true,
				sameSite: "none",
				secure: true,
			},
		},
		emailVerification: {
			sendOnSignUp: true,
			autoSignInAfterVerification: true,
		},
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
		},
		plugins: [
			organization({
				schema: {
					member: {
						modelName: "organizationMember",
					},
					invitation: {
						modelName: "organizationInvitation",
					},
				},
			}),
		],
	});
};
