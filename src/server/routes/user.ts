import { Hono } from "hono";
import type { HonoContext } from "../types/hono";

const app = new Hono<HonoContext>().get("/", async (c) => {
	return c.json({
		message: "Hello, world!",
	});
});

export default app;
