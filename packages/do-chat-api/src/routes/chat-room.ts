import { Hono } from "hono";
import { z } from "zod";

import type { HonoVariables } from "../types/hono";
import { schema as d1Schema } from "@/do-chat-shared";
import { zValidator } from "@hono/zod-validator";

// Validation schemas
/* const paramsSchema = z.object({
	roomId: z.string().min(1),
}); */

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
			const { CHAT_DURABLE_OBJECT } = c.env;
			const db = c.get("db");
			const user = c.get("user");
			const session = c.get("session");
			const { activeOrganizationId } = session;
			const { name, isPrivate } = c.req.valid("json");

			if (!activeOrganizationId) {
				return c.json({ error: "Organization not set" }, 403);
			}

			// Create durable object
			const id = CHAT_DURABLE_OBJECT.newUniqueId();
			const chatRoom = CHAT_DURABLE_OBJECT.get(id);

			await chatRoom.migrate();
			await chatRoom.addMember(user.id, "admin");

			// Create room record in D1
			await db.insert(d1Schema.chatRoom).values({
				id: id.toString(),
				name,
				organizationId: activeOrganizationId,
				isPrivate: isPrivate ?? false,
			});
			await db.insert(d1Schema.chatRoomMember).values({
				roomId: id.toString(),
				userId: user.id,
			});

			return c.json({ roomId: id.toString() });
		},
	)
	.get("/", async (c) => {
		const db = c.get("db");
		const session = c.get("session");
		const { activeOrganizationId } = session;

		if (!activeOrganizationId) {
			return c.json({ error: "Organization not set" }, 403);
		}

		const rooms = await db.query.chatRoom.findMany({
			where: (rooms, { eq }) => eq(rooms.organizationId, activeOrganizationId),
			with: {
				members: {
					with: {
						user: true,
					},
				},
			},
		});

		return c.json({ rooms });
	});
/* .get("/:roomId", zValidator("param", paramsSchema), async (c) => {
		const { CHAT_DURABLE_OBJECT } = c.env;
		const { roomId } = c.req.valid("param");

		try {
			// Get the room's Durable Object
			const id = CHAT_DURABLE_OBJECT.idFromString(roomId);
			const stub = CHAT_DURABLE_OBJECT.get(id);

			//await stub.migrate();
			const messages = (await stub.select()) as ChatMessage[];

			return c.json({
				messages,
			});
		} catch (err) {
			const error = err instanceof Error ? err.message : "Invalid room ID";
			return c.json({ error }, 400);
		}
	})
	.post(
		"/:roomId",
		zValidator("param", paramsSchema),
		zValidator("json", insertChatMessageSchema),
		async (c) => {
			const { CHAT_DURABLE_OBJECT } = c.env;
			const { roomId } = c.req.valid("param");
			const body = c.req.valid("json");

			try {
				// Get the room's Durable Object
				const id = CHAT_DURABLE_OBJECT.idFromString(roomId);
				const stub = CHAT_DURABLE_OBJECT.get(id);

				await stub.migrate();
				await stub.insert({
					message: body.message,
					userId: body.userId,
					userName: body.userName,
				});

				return c.json({ success: true });
			} catch (err) {
				const error =
					err instanceof Error ? err.message : "Failed to post message";
				return c.json({ error }, 400);
			}
		},
	)
	.get("/:roomId/websocket", zValidator("param", paramsSchema), async (c) => {
		const user = c.get("user");
		const { roomId } = c.req.valid("param");
		const db = c.get("db");

		// Verify organization membership through D1
		const room = await db.query.chatRoom.findFirst({
			where: (rooms, { eq }) => eq(rooms.id, roomId),
			with: {
				organization: {
					with: {
						members: {
							where: (members, { eq }) => eq(members.userId, user.id)
						}
					}
				}
			}
		});

		if (!room?.organization?.members?.length) {
			return c.json({ error: "Not authorized" }, 403);
		}

		// Proceed with WebSocket connection
		const id = c.env.CHAT_DURABLE_OBJECT.idFromString(room.durableObjectId);
		const stub = c.env.CHAT_DURABLE_OBJECT.get(id);
		return stub.fetch(c.req.url, c.req);
	}); */

export default app;
