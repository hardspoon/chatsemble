export { ChatDurableObject } from "./chat-durable-object";
import { Hono } from "hono";
import { cors } from "hono/cors";
import messagesRoute from "./routes/messages";

const app = new Hono<{ Bindings: Env }>().use(
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
