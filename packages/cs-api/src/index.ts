export { ChatDurableObject } from "./durable-objects/chat-room/chat-durable-object";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie } from "hono/cookie";
import chatRoomRoute from "./routes/chat-room";
import type { HonoVariables } from "./types/hono";
import { drizzle } from "drizzle-orm/d1";
import { schema } from "@/cs-shared";
import { and, eq, gt } from "drizzle-orm";

const app = new Hono<HonoVariables>()
	.use("*", async (c, next) => {
		const db = drizzle(c.env.DB, { schema });
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
		await next();
	})
	.get("/chat-room/ws/:roomId", async (c) => {
		const upgradeHeader = c.req.header("Upgrade");
		if (!upgradeHeader || upgradeHeader !== "websocket") {
			return c.text("Expected Upgrade: websocket", 426);
		}

		const user = c.get("user");

		const { roomId } = c.req.param();
		const db = c.get("db");

		// Verify organization membership through D1
		const roomMember = await db.query.chatRoomMember.findFirst({
			where: (members, { eq, and }) =>
				and(eq(members.userId, user.id), eq(members.roomId, roomId)),
			with: {
				room: true,
			},
		});

		if (!roomMember) {
			return c.text("Not authorized", 403);
		}

		// Proceed with WebSocket connection
		const id = c.env.CHAT_DURABLE_OBJECT.idFromString(roomMember.room.id);
		const stub = c.env.CHAT_DURABLE_OBJECT.get(id);
		return await stub.fetch(c.req.raw);
	})
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
	);

const routes = app.route("/chat-room", chatRoomRoute);

export type AppType = typeof routes;
export default app;
