import { schema } from "@/cs-shared";
import { sendMail } from "@/lib/email";
import { getDB } from "@/server/db";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { eq } from "drizzle-orm";

export const getAuth = () => {
	const apiHost = process.env.NEXT_PUBLIC_DO_CHAT_API_HOST;
	const authHost = process.env.BETTER_AUTH_URL;
	const trustedOrigins: string[] = [];
	if (authHost) {
		trustedOrigins.push(authHost);
	}
	if (apiHost) {
		trustedOrigins.push(apiHost);
	}

	const crossDomain = process.env.BETTER_AUTH_DOMAIN;
	const secret = process.env.BETTER_AUTH_SECRET;

	return betterAuth({
		appName: "Chatsemble",
		baseURL: authHost,
		secret,
		trustedOrigins,
		database: drizzleAdapter(getDB(), {
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
			async sendVerificationEmail({ user, url }) {
				await sendMail(user.email, "email-verification", {
					verificationUrl: url,
					username: user.email,
				});
			},
		},
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
			async sendResetPassword({ user, url }) {
				await sendMail(user.email, "password-reset", {
					resetLink: url,
					username: user.email,
				});
			},
		},
		plugins: [
			organization({
				async sendInvitationEmail(data) {
					const url = `${process.env.BETTER_AUTH_URL}/auth/accept-invitation/${data.id}`;
					await sendMail(data.email, "organization-invitation", {
						inviteLink: url,
						username: data.email,
						invitedByUsername: data.inviter.user.name,
						invitedByEmail: data.inviter.user.email,
						teamName: data.organization.name,
					});
				},
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
		databaseHooks: {
			session: {
				create: {
					before: async (session) => {
						const db = getDB();
						const orgSession = await db.query.organizationMember.findFirst({
							where: eq(schema.organizationMember.userId, session.userId),
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
	});
};
