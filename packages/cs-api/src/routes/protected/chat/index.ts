import { Hono } from "hono";
import type { HonoContext } from "../../../types/hono";
import chatRoomRoutes from "./chat-room";
import chatRoomMemberRoutes from "./chat-room-member";

const app = new Hono<HonoContext>()
	.route("/chat-rooms", chatRoomRoutes)
	.route("/chat-rooms", chatRoomMemberRoutes);

export default app;
