import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { account, organizationMember, organization, user } from "./schema";
import { findSqliteFile } from "../lib/db/db-helpers";
import * as schema from "./schema";

// biome-ignore lint/style/noNonNullAssertion: <explanation>
const WRANGLER_STATE_PATH = process.env.WRANGLER_STATE_PATH!;

const sqlite = new Database(findSqliteFile(WRANGLER_STATE_PATH));
const db = drizzle(sqlite, { schema, logger: false });

// Test1234 password hash
const TEST_PASSWORD_HASH =
	"20a5f24e5bd045ef0d039df14b8b7089:86f8b272107169850cbd07a6d8413f222c9ebfa3a6ec23de1254cde97e875becfb183d378b801a3ed21a618c32afcc1dd5c095d600928574ea42620962ed7738";

interface CreateUserParams {
	id: string;
	name: string;
	email: string;
	avatar: string;
}

async function createUserWithAccount({
	id,
	name,
	email,
	avatar,
}: CreateUserParams) {
	const newUser: typeof user.$inferSelect = {
		id,
		name,
		email,
		emailVerified: true,
		image: avatar,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	await db.insert(user).values(newUser).onConflictDoNothing();

	const newAccount: typeof account.$inferSelect = {
		id: `account_${id}`,
		userId: id,
		accountId: id,
		providerId: "credential",
		accessToken: null,
		refreshToken: null,
		accessTokenExpiresAt: null,
		refreshTokenExpiresAt: null,
		scope: null,
		idToken: null,
		password: TEST_PASSWORD_HASH,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	await db.insert(account).values(newAccount).onConflictDoNothing();

	return newUser;
}

async function createOrganizationWithMembers(
	orgData: typeof organization.$inferSelect,
	users: (typeof user.$inferSelect)[],
	ownerUserId: string,
) {
	await db.insert(organization).values(orgData).onConflictDoNothing();

	const members: (typeof organizationMember.$inferSelect)[] = users.map(
		(user) => ({
			id: `member_${user.id}`,
			userId: user.id,
			organizationId: orgData.id,
			role: user.id === ownerUserId ? "owner" : "member",
			createdAt: new Date(),
		}),
	);

	await db.insert(organizationMember).values(members).onConflictDoNothing();
}

async function seed() {
	try {
		// Create users
		const users = await Promise.all([
			createUserWithAccount({
				id: "Fe7gvakGA5tVO5Ulho1BIqVGpMBan8r5",
				name: "Alejandro Wurts",
				email: "alejandrowurts@gmail.com",
				avatar: "/notion-avatars/avatar-08.svg",
			}),
			createUserWithAccount({
				id: "Ks9mPqR4Nt2Wx5Yz8Abc3Def7Ghi1JkL",
				name: "Sarah Johnson",
				email: "sarah.johnson@example.com",
				avatar: "/notion-avatars/avatar-02.svg",
			}),
			createUserWithAccount({
				id: "Lm4nQpR8St2Uv5Wx7Yza3Bcd6Efg9HiJ",
				name: "Michael Chen",
				email: "michael.chen@example.com",
				avatar: "/notion-avatars/avatar-03.svg",
			}),
		]);

		// Create organization with all users
		const orgData: typeof organization.$inferSelect = {
			id: "bu1cEXJI1PLWqnU7nQyvmDTEaEiqE9oR",
			name: "Alwurts",
			slug: "alwurts",
			logo: null,
			metadata: null,
			createdAt: new Date(),
		};

		await createOrganizationWithMembers(orgData, users, users[0].id);

		console.log("Seed completed successfully");
	} catch (error) {
		console.error("Error seeding:", error);
	}
}

seed()
	.catch((error) => {
		console.error("Error seeding:", error);
	})
	.finally(async () => {
		await db.$client.close();
		process.exit(0);
	});
