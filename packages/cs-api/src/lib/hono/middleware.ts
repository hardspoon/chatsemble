import { drizzle } from "drizzle-orm/d1";
import { schema } from "@/cs-shared";
import { and, eq, gt } from "drizzle-orm";
import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";

export const honoDbMiddleware = async (c: Context, next: Next) => {
	const db = drizzle(c.env.DB, { schema });
	console.log({
		reason: "Setting db",
		db,
	});
	c.set("db", db);
	await next();
};

export const honoAuthMiddleware = async (c: Context, next: Next) => {
	const sessionToken = getCookie(c, "better-auth.session_token");
	console.log({
		reason: "Session token",
		sessionToken,
	});
	if (!sessionToken) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const searchToken = sessionToken.split(".")[0];

	const db = c.get("db");

	const validSession = await db.query.session.findFirst({
		where: and(
			eq(schema.session.token, searchToken),
			gt(schema.session.expiresAt, new Date()),
		),
		with: {
			user: true,
		},
	});

	console.log({
		reason: "Validating session",
		validSession,
	});

	if (!validSession) {
		console.log({
			reason: "Invalid session",
			validSession,
		});
		return c.json({ error: "Invalid session" }, 401);
	}

	console.log({
		reason: "Valid session",
		validSession,
	});

	const { user, ...session } = validSession;

	console.log({
		reason: "Setting user and session",
		user,
		session,
	});

	c.set("user", user);
	c.set("session", session);
	await next();
};
