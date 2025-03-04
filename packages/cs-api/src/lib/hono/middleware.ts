import { globalSchema } from "@/cs-shared";
import { drizzle } from "drizzle-orm/d1";
import type { Context, Next } from "hono";
import type { HonoContext } from "../../types/hono";
import { getAuth } from "../auth";

export const honoDbMiddleware = async (c: Context<HonoContext>, next: Next) => {
	const db = drizzle(c.env.DB, { schema: globalSchema });
	c.set("db", db);
	await next();
};

export const honoAuthMiddleware = async (
	c: Context<HonoContext>,
	next: Next,
) => {
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

	c.set("user", session?.user ?? null);
	c.set("session", session?.session ?? null);
	c.set("auth", auth);
	await next();
};

export const honoAuthCheckMiddleware = async (
	c: Context<HonoContext>,
	next: Next,
) => {
	const session = c.get("session");
	const user = c.get("user");

	if (!session || !user || !session.activeOrganizationId) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	c.set("user", user);
	c.set("session", session);
	await next();
};
