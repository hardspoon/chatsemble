import NextAuth, { type Session } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDB } from "@/server/db";
import {
	accounts,
	authenticators,
	sessions,
	users,
	verificationTokens,
} from "@/server/db/schema";
import { MagicLinkProvider } from "@/lib/auth/magic-link-provider";

export type AuthenticatedSession = Session & {
	user: NonNullable<Session["user"]> & { id: string };
};

export const getNextAuth = () => {
	return NextAuth({
		adapter: DrizzleAdapter(getDB(), {
			usersTable: users,
			accountsTable: accounts,
			sessionsTable: sessions,
			verificationTokensTable: verificationTokens,
			authenticatorsTable: authenticators,
		}),
		providers: [MagicLinkProvider()],
		debug: true,
	});
};
