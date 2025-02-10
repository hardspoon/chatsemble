import { Hono } from "hono";
import type { ChatMessage } from "../db/schema";

const app = new Hono<{ Bindings: Env }>()
	.get("/", async (c) => {
		const { CHAT_DURABLE_OBJECT } = c.env;
		const id = CHAT_DURABLE_OBJECT.idFromName("main-chat");
		const stub = CHAT_DURABLE_OBJECT.get(id);

		await stub.migrate();
		const messages = (await stub.select()) as ChatMessage[];

		return c.json({
			messages,
		});
	})
	.post("/", async (c) => {
		const { CHAT_DURABLE_OBJECT } = c.env;
		const id = CHAT_DURABLE_OBJECT.idFromName("main-chat");
		const stub = CHAT_DURABLE_OBJECT.get(id);

		const body = await c.req.json();
		await stub.migrate();
		await stub.insert({
			message: body.message,
		});

		return c.json({ success: true });
	});

export default app;
