import { Hono } from "hono";
import type { HonoVariables } from "../../types/hono";
import chatRoomRoutes from "./chat-room";
import organizationUserRoutes from "./organization-user";
import agentRoutes from "./agent";
import { honoAuthMiddleware } from "../../lib/hono/middleware";
import { honoDbMiddleware } from "../../lib/hono/middleware";
import { cors } from "hono/cors";

const app = new Hono<HonoVariables>()
	.use(
		"*",
		cors({
			origin: (_origin, c) => {
				return c.env.ALLOWED_ORIGINS;
			},
			allowMethods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
			allowHeaders: ["Content-Type"],
			credentials: true,
		}),
	)
	.use(honoDbMiddleware)
	.use(honoAuthMiddleware)
	.route("/chat-room", chatRoomRoutes)
	.route("/agent", agentRoutes)
	.route("/organization-user", organizationUserRoutes);

export default app;
