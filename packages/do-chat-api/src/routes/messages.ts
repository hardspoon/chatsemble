import { Hono } from "hono";
import type { ChatMessage } from "../db/schema";
import type { HonoVariables } from "../types/hono";

const app = new Hono<HonoVariables>()
	.post("/create", async (c) => {
		const { CHAT_DURABLE_OBJECT } = c.env;
		// Generate a unique ID for the new chat room
		const id = CHAT_DURABLE_OBJECT.newUniqueId();
		return c.json({ roomId: id.toString() });
	})
	.get("/:roomId", async (c) => {
		const { CHAT_DURABLE_OBJECT } = c.env;
		const roomId = c.req.param("roomId");
		
		// Get the room's Durable Object
		const id = CHAT_DURABLE_OBJECT.idFromString(roomId);
		const stub = CHAT_DURABLE_OBJECT.get(id);

		await stub.migrate();
		const messages = (await stub.select()) as ChatMessage[];

		return c.json({
			messages,
		});
	})
	.post("/:roomId", async (c) => {
		const { CHAT_DURABLE_OBJECT } = c.env;
		const roomId = c.req.param("roomId");
		
		// Get the room's Durable Object
		const id = CHAT_DURABLE_OBJECT.idFromString(roomId);
		const stub = CHAT_DURABLE_OBJECT.get(id);

		const body = await c.req.json();
		await stub.migrate();
		await stub.insert({
			message: body.message,
		});

		return c.json({ success: true });
	})
	.get("/:roomId/websocket", async (c) => {
		const { CHAT_DURABLE_OBJECT } = c.env;
		const roomId = c.req.param("roomId");

		// Verify this is a websocket request
		if (c.req.header("Upgrade") !== "websocket") {
			return c.json({ error: "Expected websocket" }, 400);
		}

		// Get the room's Durable Object
		const id = CHAT_DURABLE_OBJECT.idFromString(roomId);
		const stub = CHAT_DURABLE_OBJECT.get(id);

		// Forward the websocket request to the Durable Object
		return stub.fetch(c.req.url, c.req);
	});

export default app;
