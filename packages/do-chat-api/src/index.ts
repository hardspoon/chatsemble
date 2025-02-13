export { ChatDurableObject } from "./durable-objects/chat-durable-object";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie } from "hono/cookie";
import chatRoomRoute from "./routes/chat-room";
import type { HonoVariables } from "./types/hono";
import { drizzle } from "drizzle-orm/d1";
import { schema } from "@/do-chat-shared";
import { and, eq, gt } from "drizzle-orm";

const app = new Hono<HonoVariables>()
	.use(
		"*",
		cors({
			origin: (_origin, c) => {
				return c.env.ALLOWED_ORIGINS;
			},
			allowMethods: ["GET", "POST", "OPTIONS"],
			allowHeaders: ["Content-Type"],
			credentials: true,
		}),
	)
	.use("*", async (c, next) => {
		const db = drizzle(c.env.DB);
		c.set("db", db);
		await next();
	})
	.use("*", async (c, next) => {
		const sessionToken = getCookie(c, "better-auth.session_token");
		if (!sessionToken) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const searchToken = sessionToken.split(".")[0];

		const db = c.get("db");

		const [validSession] = await db
			.select()
			.from(schema.session)
			.where(
				and(
					eq(schema.session.token, searchToken),
					gt(schema.session.expiresAt, new Date()),
				),
			)
			.limit(1);

		if (!validSession) {
			return c.json({ error: "Invalid or expired session" }, 401);
		}

		c.set("userId", validSession.userId);
		await next();
	});

const routes = app.route("/chat-room", chatRoomRoute);

export type AppType = typeof routes;
export default app;
