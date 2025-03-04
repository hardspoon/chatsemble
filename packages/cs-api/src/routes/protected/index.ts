import { Hono } from "hono";
import { cors } from "hono/cors";
import {
	honoAuthCheckMiddleware,
	honoAuthMiddleware,
	honoDbMiddleware,
} from "../../lib/hono/middleware";
import type { HonoContext } from "../../types/hono";
import agentRoutes from "./agent";
import chatRoutes from "./chat";
import organizationRoutes from "./organization-user";

const app = new Hono<HonoContext>()
	.use(
		"*",
		cors({
			origin: (_origin, c) => {
				return c.env.BETTER_AUTH_URL;
			},
			allowMethods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
			allowHeaders: ["Content-Type", "Authorization"],
			exposeHeaders: ["Content-Length"],
			credentials: true,
		}),
	)
	.use(honoDbMiddleware)
	.use(honoAuthMiddleware)
	.use(honoAuthCheckMiddleware)
	.route("/chat", chatRoutes)
	.route("/agents", agentRoutes)
	.route("/organization", organizationRoutes);

export default app;
