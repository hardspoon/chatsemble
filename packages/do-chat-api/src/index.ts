export { ChatDurableObject } from "./chat-durable-object";
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono<{ Bindings: Env }>();

// Add CORS middleware
app.use(
	"*",
	cors({
		origin: "*",
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type"],
	}),
);

// Chat routes
app.get("/messages", async (c) => {
	const { CHAT_DURABLE_OBJECT } = c.env;
	const id = CHAT_DURABLE_OBJECT.idFromName("main-chat");
	const stub = CHAT_DURABLE_OBJECT.get(id);

	await stub.migrate();
	const messages = await stub.select();

	return c.json({ messages });
});

app.post("/messages", async (c) => {
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
