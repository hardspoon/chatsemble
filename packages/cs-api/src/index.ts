export { ChatDurableObject } from "./durable-objects/chat-room/chat-durable-object";
export { AgentDurableObject } from "./durable-objects/agent/agent-durable-object";

import { Hono } from "hono";
import type { HonoVariables } from "./types/hono";
import protectedRoutes from "./routes/protected";
import websocketRoutes from "./routes/websocket";

const app = new Hono<HonoVariables>();
/* .use("*", honoDbMiddleware)
	.use("*", honoAuthMiddleware)
	.get("/ws/:roomId", async (c) => {
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

		const url = new URL(c.req.url);
		url.searchParams.set("userId", user.id);

		return await stub.fetch(new Request(url, c.req.raw));
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
	); */

const routes = app
	.route("/protected", protectedRoutes)
	.route("/websocket", websocketRoutes);

export type AppType = typeof routes;
export default app;
