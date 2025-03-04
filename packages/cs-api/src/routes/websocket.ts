import { schema as d1Schema } from "@/cs-shared";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import {
	honoAuthCheckMiddleware,
	honoAuthMiddleware,
	honoDbMiddleware,
} from "../lib/hono/middleware";
import type { HonoContextWithAuth } from "../types/hono";

const app = new Hono<HonoContextWithAuth>()
	.use(honoDbMiddleware)
	.use(honoAuthMiddleware)
	.use(honoAuthCheckMiddleware)
	.get("/chat-room/:roomId", async (c) => {
		const upgradeHeader = c.req.header("Upgrade");
		if (!upgradeHeader || upgradeHeader !== "websocket") {
			return c.text("Expected Upgrade: websocket", 426);
		}

		const user = c.get("user");

		const { roomId } = c.req.param();
		const db = c.get("db");

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
