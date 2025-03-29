import { Hono } from "hono";
import {
	honoAuthCheckMiddleware,
	honoAuthMiddleware,
} from "../../middleware/auth";
import type { HonoContext } from "../../types/hono";
import agentRoutes from "./agent";
import chatRoutes from "./chat";
import organizationUserRoutes from "./organization-user";

const app = new Hono<HonoContext>()
	.use(honoAuthMiddleware)
	.use(honoAuthCheckMiddleware)
	.route("/chat", chatRoutes)
	.route("/agents", agentRoutes)
	.route("/organization", organizationUserRoutes);

export default app;
