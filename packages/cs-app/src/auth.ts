import { type DrizzleDB, getAuthBaseConfig, globalSchema } from "@/cs-shared";
import { sendMail } from "@/lib/email";
import { getDB } from "@/server/db";
import { betterAuth } from "better-auth";
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

	if (!authHost || !secret || !trustedOrigins || !crossDomain) {
		throw new Error("Missing required auth config");
	}

	return betterAuth(
		getAuthBaseConfig({
			authHost,
			secret,
			trustedOrigins,
			crossDomain,
			db: getDB() as DrizzleDB,
			databaseHooks: {
				session: {
					create: {
						before: async (session) => {
							const db = getDB();
							const orgSession = await db.query.organizationMember.findFirst({
								where: eq(
									globalSchema.organizationMember.userId,
									session.userId,
								),
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
			// @ts-expect-error - templateId is not typed
			sendMail,
		}),
	);
};
