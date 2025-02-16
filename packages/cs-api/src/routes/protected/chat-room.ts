import { Hono } from "hono";
import { z } from "zod";

import type { HonoVariables } from "../../types/hono";
import { schema as d1Schema } from "@/cs-shared";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";

const app = new Hono<HonoVariables>()
	.post(
		"/create",
		zValidator(
			"json",
			z.object({
				name: z.string().min(1),
				isPrivate: z.boolean().optional(),
			}),
		),
		async (c) => {
			console.log("create chat room");
			const { CHAT_DURABLE_OBJECT } = c.env;
			const db = c.get("db");
			const user = c.get("user");
			const session = c.get("session");
			const { activeOrganizationId } = session;
			const { name, isPrivate } = c.req.valid("json");

			if (!activeOrganizationId) {
				throw new Error("Organization not set");
			}

			// Create durable object
			const id = CHAT_DURABLE_OBJECT.newUniqueId();
			const chatRoom = CHAT_DURABLE_OBJECT.get(id);

			await chatRoom.migrate();
			await chatRoom.addMember({
				id: user.id,
				role: "admin",
				type: "user",
				name: user.name,
				email: user.email,
				image: user.image,
			});

			// Create room record in D1
			await db.insert(d1Schema.chatRoom).values({
				id: id.toString(),
				name,
				organizationId: activeOrganizationId,
				isPrivate: isPrivate ?? false,
			});

			await db.insert(d1Schema.chatRoomMember).values({
				roomId: id.toString(),
				memberId: user.id,
				role: "admin",
				type: "user",
			});

			return c.json({ roomId: id.toString() });
		},
	)
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

		const rooms = userMemberRooms.map((member) => member.room);

		return c.json(rooms);
	});

export default app;
