export { ChatDurableObject } from "./durable-objects/chat-room/chat-durable-object";
export { AgentDurableObject } from "./durable-objects/agent/agent-durable-object";

import { Hono } from "hono";
import protectedRoutes from "./routes/protected";
import websocketRoutes from "./routes/websocket";
import type { HonoVariables } from "./types/hono";

const app = new Hono<HonoVariables>();

const routes = app
	.route("/protected", protectedRoutes)
	.route("/websocket", websocketRoutes);

export type AppType = typeof routes;
export default app;
