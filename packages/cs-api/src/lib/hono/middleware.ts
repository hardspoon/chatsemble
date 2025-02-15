import { drizzle } from "drizzle-orm/d1";
import { schema } from "@/cs-shared";
import { and, eq, gt } from "drizzle-orm";
import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";

export const honoDbMiddleware = async (c: Context, next: Next) => {
	const db = drizzle(c.env.DB, { schema });
	c.set("db", db);
	await next();
};

export const honoAuthMiddleware = async (c: Context, next: Next) => {
	const sessionToken = getCookie(c, "better-auth.session_token");
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

	if (!validSession) {
		return c.json({ error: "Invalid session" }, 401);
	}

	const { user, ...session } = validSession;

	c.set("user", user);
	c.set("session", session);
	console.log("session", session);
	await next();
};
