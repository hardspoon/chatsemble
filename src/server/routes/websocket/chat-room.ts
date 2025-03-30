import { dbServices } from "@server/db/services";
import { Hono } from "hono";

import {
	honoAuthCheckMiddleware,
	honoAuthMiddleware,
} from "@server/middleware/auth";
import type { HonoContextWithAuth } from "@server/types/hono";

const app = new Hono<HonoContextWithAuth>()
	.use(honoAuthMiddleware)
	.use(honoAuthCheckMiddleware)
	.get("/chat-rooms/:chatRoomId", async (c) => {
		const upgradeHeader = c.req.header("Upgrade");
		if (!upgradeHeader || upgradeHeader !== "websocket") {
			return c.text("Expected Upgrade: websocket", 426);
		}

		const user = c.get("user");

		const { chatRoomId } = c.req.param();

		const roomMember = await dbServices.roomMember.getChatRoomMember({
			chatRoomId,
			memberId: user.id,
		});

		// TODO: Check org permissions to allow admins and owners to connect to any chat room

		if (!roomMember) {
			throw new Error("Not authorized");
		}

		// Proceed with WebSocket connection
		const id = c.env.CHAT_DURABLE_OBJECT.idFromString(roomMember.roomId);
		const stub = c.env.CHAT_DURABLE_OBJECT.get(id);

		const url = new URL(c.req.url);
		url.searchParams.set("userId", user.id);

		return await stub.fetch(new Request(url, c.req.raw));
	});

export default app;
