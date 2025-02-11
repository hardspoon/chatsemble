export { ChatDurableObject } from "./durable-objects/chat-durable-object";
import { Hono } from "hono";
import { cors } from "hono/cors";
import chatRoomRoute from "./routes/chat-room";
import type { HonoVariables } from "./types/hono";
import { drizzle } from "drizzle-orm/d1";
import { sessions } from "@do-chat/db";
import { and, eq, gt } from "drizzle-orm";

const app = new Hono<HonoVariables>()
	.use(
		"*",
		cors({
			origin: "*",
			allowMethods: ["GET", "POST", "OPTIONS"],
			allowHeaders: ["Content-Type", "Authorization"],
		}),
	)
	.use("*", async (c, next) => {
		// Initialize the database and set it in the context
		const db = drizzle(c.env.DB);
		c.set("db", db);
		await next();
	})
	.use("*", async (c, next) => {
		const authHeader = c.req.header("Authorization");
		if (!authHeader?.startsWith("Bearer ")) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const sessionToken = authHeader.split(" ")[1];
		// Get the database from context instead of initializing it here
		const db = c.get("db");

		console.log("sessionToken", sessionToken);

		// Query the session and verify it's valid
		const [validSession] = await db
			.select()
			.from(sessions)
			.where(
				and(
					eq(sessions.sessionToken, sessionToken),
					gt(sessions.expires, new Date()),
				),
			)
			.limit(1);

		console.log("validSession", validSession);

		if (
			!validSession ||
			!validSession.userId ||
			validSession.expires < new Date()
		) {
			return c.json({ error: "Invalid or expired session" }, 401);
		}

		// Add the userId to the context for use in routes
		c.set("userId", validSession.userId);
		await next();
	});

const routes = app.route("/chat-room", chatRoomRoute);

export type AppType = typeof routes;
export default app;
