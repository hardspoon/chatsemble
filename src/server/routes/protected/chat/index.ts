import chatRoomRoutes from "@server/routes/protected/chat/chat-room";
import type { HonoContext } from "@server/types/hono";
import { Hono } from "hono";

const app = new Hono<HonoContext>().route("/chat-rooms", chatRoomRoutes);

export default app;
