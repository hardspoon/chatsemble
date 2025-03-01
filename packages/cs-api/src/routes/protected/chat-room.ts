import { Hono } from "hono";
import { z } from "zod";

import {
	chatRoomMembersRolesSchema,
	chatRoomMembersTypesSchema,
	schema as d1Schema,
} from "@/cs-shared";
import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import type { HonoVariables } from "../../types/hono";

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
				throw new Error("Organization not set");
			}

			// Create durable object
			const id = CHAT_DURABLE_OBJECT.newUniqueId();
			const chatRoom = CHAT_DURABLE_OBJECT.get(id);

			await chatRoom.migrate();
			await chatRoom.upsertChatRoomConfig({
				id: id.toString(),
				name,
				organizationId: activeOrganizationId,
			});
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
	})
	.post(
		"/members",
		zValidator(
			"json",
			z.object({
				roomId: z.string().min(1),
				memberId: z.string().min(1),
				role: chatRoomMembersRolesSchema,
				type: chatRoomMembersTypesSchema,
			}),
		),
		async (c) => {
			const { CHAT_DURABLE_OBJECT, AGENT_DURABLE_OBJECT } = c.env;
			const db = c.get("db");
			const session = c.get("session");
			const { activeOrganizationId } = session;

			if (!activeOrganizationId) {
				throw new Error("Organization not set");
			}

			const { roomId, memberId, role, type } = c.req.valid("json");

			const room = await db
				.select()
				.from(d1Schema.chatRoom)
				.where(
					and(
						eq(d1Schema.chatRoom.id, roomId),
						eq(d1Schema.chatRoom.organizationId, activeOrganizationId),
					),
				)
				.get();

			if (!room) {
				throw new Error("Room not found");
			}

			const id = CHAT_DURABLE_OBJECT.idFromString(room.id);
			const chatRoom = CHAT_DURABLE_OBJECT.get(id);

			let member: {
				memberId: string;
				name: string;
				email?: string;
				image: string | null;
			} | null = null;

			if (type === "user") {
				const result = await db
					.select({
						user: d1Schema.user,
					})
					.from(d1Schema.organizationMember)
					.innerJoin(
						d1Schema.user,
						eq(d1Schema.organizationMember.userId, d1Schema.user.id),
					)
					.where(
						and(
							eq(d1Schema.organizationMember.userId, memberId),
							eq(
								d1Schema.organizationMember.organizationId,
								activeOrganizationId,
							),
						),
					)
					.get();

				if (!result?.user) {
					throw new Error("User not found");
				}

				member = {
					memberId: result.user.id,
					name: result.user.name,
					email: result.user.email,
					image: result.user.image,
				};
			}

			if (type === "agent") {
				const agent = await db
					.select()
					.from(d1Schema.agent)
					.where(
						and(
							eq(d1Schema.agent.id, memberId),
							eq(d1Schema.agent.organizationId, activeOrganizationId),
						),
					)
					.get();

				if (!agent) {
					throw new Error("Agent not found");
				}

				member = {
					memberId: agent.id,
					name: agent.name,
					image: agent.image,
				};
			}

			if (!member) {
				throw new Error("Member not found");
			}

			await chatRoom.addMember({
				id: member.memberId,
				role,
				type,
				name: member.name,
				email: member.email ?? "agent@chatsemble.com",
				image: member.image,
			});

			const [newMember] = await db
				.insert(d1Schema.chatRoomMember)
				.values({
					roomId: room.id,
					memberId: member.memberId,
					role,
					type,
				})
				.returning();

			if (!newMember) {
				throw new Error("Failed to add member");
			}

			if (type === "agent") {
				const agentId = AGENT_DURABLE_OBJECT.idFromString(member.memberId);
				const agent = AGENT_DURABLE_OBJECT.get(agentId);

				await agent.addChatRoom({
					id: room.id,
					name: room.name,
					organizationId: activeOrganizationId,
				});
			}

			return c.json({ success: true });
		},
	);

export default app;
