import { betterAuth } from "better-auth";
import { createAuthMiddleware, organization } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDB } from "@/server/db"; // your drizzle instance
import { eq } from "drizzle-orm";
import { schema } from "@/cs-shared";

export const getAuth = () => {
	const trustedOrigins = process.env.BETTER_AUTH_URL
		? [process.env.BETTER_AUTH_URL]
		: undefined;
	console.log({
		reason: "Trusted origins",
		trustedOrigins: JSON.stringify(process.env.BETTER_AUTH_URL ?? "MISSING"),
	});
	const crossDomain = process.env.BETTER_AUTH_DOMAIN;
	console.log({
		reason: "Cross domain",
		crossDomain: JSON.stringify(crossDomain ?? "MISSING"),
	});
	return betterAuth({
		database: drizzleAdapter(getDB(), {
			provider: "sqlite",
		}),
		emailAndPassword: {
			enabled: true,
		},
		plugins: [organization()],
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
		trustedOrigins,
		databaseHooks: {
			session: {
				create: {
					before: async (session) => {
						const db = getDB();
						const orgSession = await db.query.member.findFirst({
							where: eq(schema.member.userId, session.userId),
						});

						return {
							data: {
								...session,
								activeOrganizationId: orgSession?.organizationId ?? null,
							},
						};
					},
				},
			},
		},
		hooks: {
			after: createAuthMiddleware(async (ctx) => {
				if (ctx.path.startsWith("/sign-up")) {
					const newSession = ctx.context.newSession;
					if (newSession) {
						console.log("ctx", ctx.body);
						const authClient = getAuth();
						const orgName = ctx.body.orgName;
						const org = await authClient.api.createOrganization({
							body: {
								name: orgName,
								slug: newSession.user.email,
								userId: newSession.user.id,
							},
						});
						if (!org) {
							throw new Error("Failed to create organization");
						}
					}
				}
			}),
		},
	});
};
