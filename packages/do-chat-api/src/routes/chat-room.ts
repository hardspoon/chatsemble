import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { insertChatMessageSchema, type ChatMessage } from "../types/db";
import type { HonoVariables } from "../types/hono";

// Validation schemas
const paramsSchema = z.object({
	roomId: z.string().min(1),
});

const app = new Hono<HonoVariables>()
	.post("/create", async (c) => {
		const { CHAT_DURABLE_OBJECT } = c.env;
		// Generate a unique ID for the new chat room
		const id = CHAT_DURABLE_OBJECT.newUniqueId();
		const stub = CHAT_DURABLE_OBJECT.get(id);
		await stub.migrate();
		return c.json({ roomId: id.toString() as string });
	})
	.get("/:roomId", zValidator("param", paramsSchema), async (c) => {
		const { CHAT_DURABLE_OBJECT } = c.env;
		const { roomId } = c.req.valid("param");

		try {
			// Get the room's Durable Object
			const id = CHAT_DURABLE_OBJECT.idFromString(roomId);
			const stub = CHAT_DURABLE_OBJECT.get(id);

			//await stub.migrate();
			const messages = (await stub.select()) as ChatMessage[];

			return c.json({
				messages,
			});
		} catch (err) {
			const error = err instanceof Error ? err.message : "Invalid room ID";
			return c.json({ error }, 400);
		}
	})
	.post(
		"/:roomId",
		zValidator("param", paramsSchema),
		zValidator("json", insertChatMessageSchema),
		async (c) => {
			const { CHAT_DURABLE_OBJECT } = c.env;
			const { roomId } = c.req.valid("param");
			const body = c.req.valid("json");

			try {
				// Get the room's Durable Object
				const id = CHAT_DURABLE_OBJECT.idFromString(roomId);
				const stub = CHAT_DURABLE_OBJECT.get(id);

				await stub.migrate();
				await stub.insert({
					message: body.message,
					userId: body.userId,
					userName: body.userName,
				});

				return c.json({ success: true });
			} catch (err) {
				const error =
					err instanceof Error ? err.message : "Failed to post message";
				return c.json({ error }, 400);
			}
		},
	)
	.get("/:roomId/websocket", zValidator("param", paramsSchema), async (c) => {
		const { CHAT_DURABLE_OBJECT } = c.env;
		const { roomId } = c.req.valid("param");

		try {
			// Verify this is a websocket request
			if (c.req.header("Upgrade") !== "websocket") {
				return c.json({ error: "Expected websocket" }, 400);
			}

			// Get the room's Durable Object
			const id = CHAT_DURABLE_OBJECT.idFromString(roomId);
			const stub = CHAT_DURABLE_OBJECT.get(id);

			// Forward the websocket request to the Durable Object
			return stub.fetch(c.req.url, c.req);
		} catch (err) {
			const error = err instanceof Error ? err.message : "Invalid room ID";
			return c.json({ error }, 400);
		}
	});

export default app;
