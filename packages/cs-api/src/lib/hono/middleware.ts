import { schema, type StatementKeys } from "@/cs-shared";
import { drizzle } from "drizzle-orm/d1";
import type { Context, Next } from "hono";
import type { HonoContext, HonoContextWithAuth } from "../../types/hono";
import { getAuth } from "../auth";

export const honoDbMiddleware = async (c: Context<HonoContext>, next: Next) => {
	const db = drizzle(c.env.DB, { schema });
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

	if (!session || !user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	c.set("user", user);
	c.set("session", session);
	await next();
};

export const honoAuthPermissionMiddleware = async (
	c: Context<HonoContextWithAuth>,
	next: Next,
	permission: StatementKeys,
) => {
	const method = c.req.method;
	const auth = c.get("auth");
	let hasPermission = true;
	switch (method) {
		case "POST": {
			const response = await auth.api.hasPermission({
				headers: c.req.raw.headers,
				body: {
					permission: {
						[permission as string]: ["create"],
					},
				},
			});
			hasPermission = response.success;
			break;
		}
		case "PUT": {
			const response = await auth.api.hasPermission({
				headers: c.req.raw.headers,
				body: {
					permission: {
						[permission as string]: ["update"],
					},
				},
			});
			hasPermission = response.success;
			break;
		}
		case "DELETE": {
			const response = await auth.api.hasPermission({
				headers: c.req.raw.headers,
				body: {
					permission: {
						[permission as string]: ["delete"],
					},
				},
			});
			hasPermission = response.success;
			break;
		}
	}

	if (!hasPermission) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	await next();
};
