import { Hono } from "hono";

import {
	type ChatRoom,
	type ChatRoomMember,
	createChatRoomSchema,
	schema as d1Schema,
} from "@/cs-shared";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import type { HonoContextWithAuth } from "../../../types/hono";
import { METHOD_MAP } from "../../../lib/hono/helpers";

const app = new Hono<HonoContextWithAuth>()
	.use(async (c, next) => {
		const method = c.req.method;
		console.log("method", method);
		const parsedMethod = METHOD_MAP[method as keyof typeof METHOD_MAP];
		console.log("parsedMethod", parsedMethod);

		if (method === "POST" || method === "PUT" || method === "DELETE") {
			const auth = c.get("auth");
			const response = await auth.api.hasPermission({
				headers: c.req.raw.headers,
				body: {
					permission: {
						chatRoom: [parsedMethod],
					},
				},
			});

			if (!response.success) {
				return c.json({ error: "Unauthorized" }, 401);
			}
		}

		await next();
	})
	.post("/create", zValidator("json", createChatRoomSchema), async (c) => {
		const { CHAT_DURABLE_OBJECT } = c.env;
		const db = c.get("db");
		const user = c.get("user");
		const session = c.get("session");
		const { activeOrganizationId } = session;
		const { name, type } = c.req.valid("json");

		if (!activeOrganizationId) {
			throw new Error("Organization not set");
		}

		// Create durable object
		const chatRoomDoId = CHAT_DURABLE_OBJECT.newUniqueId();
		const chatRoomDo = CHAT_DURABLE_OBJECT.get(chatRoomDoId);

		await chatRoomDo.migrate();

		const newChatRoom: ChatRoom = {
			id: chatRoomDoId.toString(),
			name,
			organizationId: activeOrganizationId,
			type,
			createdAt: Date.now(),
		};

		const newChatRoomMember: ChatRoomMember = {
			id: user.id,
			roomId: newChatRoom.id,
			role: "owner",
			type: "user",
			name: user.name,
			email: user.email,
			image: user.image,
		};

		await chatRoomDo.upsertChatRoomConfig(newChatRoom);
		await chatRoomDo.addMember(newChatRoomMember);

		// Create room record in D1
		await db.insert(d1Schema.chatRoom).values(newChatRoom);

		await db.insert(d1Schema.chatRoomMember).values({
			roomId: newChatRoom.id,
			memberId: newChatRoomMember.id,
			role: newChatRoomMember.role,
			type: newChatRoomMember.type,
		});

		return c.json({ roomId: chatRoomDoId.toString() });
	})
	.get("/", async (c) => {
		const db = c.get("db");
		const session = c.get("session");
		const user = c.get("user");
		const { activeOrganizationId } = session;

		if (!activeOrganizationId) {
			throw new Error("Organization not set");
		}

		const userMemberRooms = await db
			.select({
				room: d1Schema.chatRoom,
			})
			.from(d1Schema.chatRoomMember)
			.innerJoin(
				d1Schema.chatRoom,
				eq(d1Schema.chatRoomMember.roomId, d1Schema.chatRoom.id),
			)
			.where(eq(d1Schema.chatRoomMember.memberId, user.id));

		const rooms: ChatRoom[] = userMemberRooms.map((member) => member.room);

		return c.json(rooms);
	});

export default app;
