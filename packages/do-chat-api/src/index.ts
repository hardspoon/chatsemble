export { ChatDurableObject } from "./durable-objects/chat-durable-object";
import { Hono } from "hono";
import { cors } from "hono/cors";
import messagesRoute from "./routes/messages";
import type { HonoVariables } from "./types/hono";

const app = new Hono<HonoVariables>().use(
	"*",
	cors({
		origin: "*",
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type"],
	}),
);

const routes = app.route("/messages", messagesRoute);

export type AppType = typeof routes;
export default app;
