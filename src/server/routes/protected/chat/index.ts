import chatRoomRoutes from "@server/routes/protected/chat/chat-room";
import chatRoomMemberRoutes from "@server/routes/protected/chat/chat-room-member";
import chatRoomWorkflowRoutes from "@server/routes/protected/chat/chat-room-workflow";
import type { HonoContext } from "@server/types/hono";
import { Hono } from "hono";

const app = new Hono<HonoContext>()
	.route("/chat-rooms", chatRoomRoutes)
	.route("/chat-rooms", chatRoomMemberRoutes)
	.route("/chat-rooms", chatRoomWorkflowRoutes);

export default app;
