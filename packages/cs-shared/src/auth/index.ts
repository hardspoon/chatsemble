import type { BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import type { DrizzleDB } from "../types/drizzle";
import {
	organizationPermissions,
	type StatementKeys,
} from "./organization-permissions";

export { organizationPermissions, type StatementKeys };
export {
	chatRoomPermissions,
	type ChatRoomStatementKeys,
} from "./chat-room-permissions";
export interface AuthBaseConfig {
	authHost: string;
	secret: string;
	trustedOrigins: string[];
	crossDomain: string;
	db: DrizzleDB;
	sendMail?: (
		to: string,
		templateId: string,
		props: Record<string, string>,
	) => Promise<void>;
	databaseHooks?: BetterAuthOptions["databaseHooks"];
}

export const getAuthBaseConfig = ({
	authHost,
	secret,
	trustedOrigins,
	crossDomain,
	db,
	sendMail,
	databaseHooks,
}: AuthBaseConfig) => {
	const baseConfig = {
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
			sendVerificationEmail: sendMail
				? async ({ user, url }) => {
						await sendMail(user.email, "email-verification", {
							verificationUrl: url,
							username: user.email,
						});
					}
				: undefined,
		},
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
			sendResetPassword: sendMail
				? async ({ user, url }) => {
						await sendMail(user.email, "password-reset", {
							resetLink: url,
							username: user.email,
						});
					}
				: undefined,
		},
		plugins: [
			organization({
				ac: organizationPermissions.accessControl,
				roles: {
					member: organizationPermissions.member,
					admin: organizationPermissions.admin,
					owner: organizationPermissions.owner,
				},
				schema: {
					member: {
						modelName: "organizationMember",
					},
					invitation: {
						modelName: "organizationInvitation",
					},
				},
				sendInvitationEmail: sendMail
					? async (data) => {
							const url = `${process.env.BETTER_AUTH_URL}/auth/accept-invitation/${data.id}`;
							await sendMail(data.email, "organization-invitation", {
								inviteLink: url,
								username: data.email,
								invitedByUsername: data.inviter.user.name,
								invitedByEmail: data.inviter.user.email,
								teamName: data.organization.name,
							});
						}
					: undefined,
			}),
		],
		databaseHooks,
	} satisfies BetterAuthOptions;

	return baseConfig;
};
