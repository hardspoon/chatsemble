import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "../auth";
import type { HonoContext } from "../types/hono";
import users from "./user";

export const app = new Hono<HonoContext>().use(
	"*",
	cors({
		origin: "http://localhost:5173",
		allowMethods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
		allowHeaders: ["Content-Type", "Authorization"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}),
);

app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

const routes = app.route("/api/users", users);

app.all("*", async (c) => {
	return c.env.ASSETS.fetch(c.req.raw);
});

export type AppType = typeof routes;
