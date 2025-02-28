import { schema as d1Schema } from "@/cs-shared";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { honoAuthMiddleware } from "../lib/hono/middleware";
import { honoDbMiddleware } from "../lib/hono/middleware";
import type { HonoVariables } from "../types/hono";

const app = new Hono<HonoVariables>()
	.use(honoDbMiddleware)
	.use(honoAuthMiddleware)
	.get("/chat-room/:roomId", async (c) => {
		const upgradeHeader = c.req.header("Upgrade");
		if (!upgradeHeader || upgradeHeader !== "websocket") {
			return c.text("Expected Upgrade: websocket", 426);
		}

		const user = c.get("user");

		const { roomId } = c.req.param();
		const db = c.get("db");

		// Verify organization membership through D1
		/* const roomMember = await db.query.chatRoomMember.findFirst({
			where: (members, { eq, and }) =>
				and(eq(members.userId, user.id), eq(members.roomId, roomId)),
			with: {
				room: true,
			},
		}); */

		const roomMember = await db
			.select({
				roomId: d1Schema.chatRoomMember.roomId,
			})
			.from(d1Schema.chatRoomMember)
			.where(
				and(
					eq(d1Schema.chatRoomMember.memberId, user.id),
					eq(d1Schema.chatRoomMember.roomId, roomId),
				),
			)
			.limit(1)
			.get();

		if (!roomMember) {
			return c.text("Not authorized", 403);
		}

		// Proceed with WebSocket connection
		const id = c.env.CHAT_DURABLE_OBJECT.idFromString(roomMember.roomId);
		const stub = c.env.CHAT_DURABLE_OBJECT.get(id);

		const url = new URL(c.req.url);
		url.searchParams.set("userId", user.id);

		return await stub.fetch(new Request(url, c.req.raw));
	});

export default app;
