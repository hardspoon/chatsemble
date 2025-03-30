import { env } from "cloudflare:workers";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "../auth";
import type { HonoContext } from "../types/hono";
import protectedRoutes from "./protected";
import websocketRoutes from "./websocket/chat-room";

export const app = new Hono<HonoContext>().use(
	"/api/*",
	cors({
		origin: env.APP_URL,
		allowMethods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
		allowHeaders: ["Content-Type", "Authorization"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}),
);

app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

const routes = app
	.route("/api", protectedRoutes)
	.route("/websocket", websocketRoutes);

app.all("*", async (c) => {
	return c.env.ASSETS.fetch(c.req.raw);
});

export type AppType = typeof routes;
