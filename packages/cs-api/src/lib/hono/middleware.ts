import { schema } from "@/cs-shared";
import { drizzle } from "drizzle-orm/d1";
import type { Context, Next } from "hono";
import { getAuth } from "../auth";

export const honoDbMiddleware = async (c: Context, next: Next) => {
	const db = drizzle(c.env.DB, { schema });
	c.set("db", db);
	await next();
};

export const honoAuthMiddleware = async (c: Context, next: Next) => {
	const auth = getAuth({
		authHost: c.env.BETTER_AUTH_URL,
		secret: c.env.BETTER_AUTH_SECRET,
		crossDomain: c.env.BETTER_AUTH_DOMAIN,
		trustedOrigins: [c.env.DO_CHAT_API_URL, c.env.BETTER_AUTH_URL],
		db: c.get("db"),
	});
	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	c.set("user", session.user);
	c.set("session", session.session);
	await next();
};
