import { betterAuth } from "better-auth";
import { createAuthMiddleware, organization } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDB } from "@/server/db"; // your drizzle instance
import { eq } from "drizzle-orm";
import { schema } from "@/do-chat-shared";

export const getAuth = () =>
	betterAuth({
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
			},
		},
		databaseHooks: {
			/* user: {
				create: {
					after: async (user) => {
						const authClient = getAuth();
						await authClient.api.createOrganization({
							body: {
								name: `${user.name} Organization`,
								slug: user.email,
								userId: user.id,
							},
						});
						console.log("finished creating organization");
					},
				},
			}, */
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
						const org = await authClient.api.createOrganization({
							body: {
								name: `${newSession.user.name} Organization`,
								slug: newSession.user.email,
								userId: newSession.user.id,
							},
						});
						if (!org) {
							throw new Error("Failed to create organization");
						}
						console.log("org", org);
						/* try {
							await authClient.api.setActiveOrganization({
								body: {
									organizationId: org.id,
									userId: newSession.user.id,
								},
							});
						} catch (error) {
							console.error("Error setting active organization", error);
						} */
					}
				}
			}),
		},
	});
