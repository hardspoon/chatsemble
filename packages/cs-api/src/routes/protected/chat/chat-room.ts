import { Hono } from "hono";

import {
	type ChatRoom,
	type ChatRoomMember,
	chatRoomMemberHasChatRoomPermission,
	createChatRoomSchema,
	dbServices,
	globalSchema,
} from "@/cs-shared";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import type { HonoContextWithAuth } from "../../../types/hono";

const chatRoom = new Hono<HonoContextWithAuth>()
	.post("/", zValidator("json", createChatRoomSchema), async (c) => {
		const { CHAT_DURABLE_OBJECT } = c.env;
		const db = c.get("db");
		const user = c.get("user");
		const session = c.get("session");
		const { activeOrganizationId } = session;
		const { name, type, members } = c.req.valid("json");

		const hasChatRoomPermission = await chatRoomMemberHasChatRoomPermission({
			headers: c.req.raw.headers,
			db,
			auth: c.get("auth"),
			params: {
				permission: "create",
			},
		});

		if (!hasChatRoomPermission) {
			// TODO Improve error handling, add middleware to handle errors and check if throwing an error or returning a 401 is the best approach
			// NOTE: Also, check that we are correcttly showing some error message on the client side
			throw new Error("Unauthorized");
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

		// TODO: Apply transactions or someway to rollback if one of the operations fails for this and other operations

		// Create room record in D1
		await db.insert(globalSchema.chatRoom).values(newChatRoom);

		await db.insert(globalSchema.chatRoomMember).values({
			roomId: newChatRoom.id,
			memberId: newChatRoomMember.id,
			role: newChatRoomMember.role,
			type: newChatRoomMember.type,
		});

		// Add additional members if provided
		if (members && members.length > 0) {
			// Filter out the current user if they're in the members array
			const additionalMembers = members.filter(
				(member) => member.id !== user.id,
			);

			for (const member of additionalMembers) {
				const chatRoomMember = {
					roomId: newChatRoom.id,
					memberId: member.id,
					role: member.role,
					type: member.type,
				};

				// Add member to D1 database
				await db.insert(globalSchema.chatRoomMember).values(chatRoomMember);

				// Add member to Durable Object
				// For Durable Object, we need more information about the member
				// We'll need to fetch user/agent details based on the member type
				const memberDetails: Partial<ChatRoomMember> = {
					id: member.id,
					roomId: newChatRoom.id,
					role: member.role,
					type: member.type,
				};

				if (member.type === "user") {
					// Fetch user details
					const userDetails = await db
						.select()
						.from(globalSchema.user)
						.where(eq(globalSchema.user.id, member.id))
						.get();

					if (userDetails) {
						memberDetails.name = userDetails.name;
						memberDetails.email = userDetails.email;
						memberDetails.image = userDetails.image;
					}
				} else if (member.type === "agent") {
					// Fetch agent details
					const agentDetails = await db
						.select()
						.from(globalSchema.agent)
						.where(eq(globalSchema.agent.id, member.id))
						.get();

					if (agentDetails) {
						memberDetails.name = agentDetails.name;
						memberDetails.email = `agent-${agentDetails.id}@system.local`;
						memberDetails.image = agentDetails.image;
					}
				}

				// Add member to Durable Object
				await chatRoomDo.addMember(memberDetails as ChatRoomMember);
			}
		}

		return c.json({ roomId: chatRoomDoId.toString() });
	})
	.get("/", async (c) => {
		const db = c.get("db");
		const user = c.get("user");

		const userMemberRooms = await db
			.select({
				room: globalSchema.chatRoom,
			})
			.from(globalSchema.chatRoomMember)
			.innerJoin(
				globalSchema.chatRoom,
				eq(globalSchema.chatRoomMember.roomId, globalSchema.chatRoom.id),
			)
			.where(eq(globalSchema.chatRoomMember.memberId, user.id));

		const rooms: ChatRoom[] = userMemberRooms.map((member) => member.room);

		return c.json(rooms);
	})
	.delete("/:chatRoomId", async (c) => {
		const db = c.get("db");
		const user = c.get("user");
		const chatRoomId = c.req.param("chatRoomId");
		if (!chatRoomId) {
			throw new Error("Chat room ID is required");
		}

		const chatRoom = await dbServices.room.getChatRoom(db, {
			chatRoomId,
			organizationId: c.get("session").activeOrganizationId,
		});

		if (!chatRoom) {
			throw new Error("Chat room not found");
		}

		const hasChatRoomPermission = await chatRoomMemberHasChatRoomPermission({
			headers: c.req.raw.headers,
			db,
			auth: c.get("auth"),
			params: {
				permission: "create",
				checkMemberPermission: {
					userId: user.id,
					chatRoomId,
					chatRoomType: chatRoom.type,
				},
			},
		});

		if (!hasChatRoomPermission) {
			throw new Error("Unauthorized");
		}

		await db
			.delete(globalSchema.chatRoom)
			.where(eq(globalSchema.chatRoom.id, chatRoom.id));

		await db
			.delete(globalSchema.chatRoomMember)
			.where(eq(globalSchema.chatRoomMember.roomId, chatRoom.id));

		const chatRoomDoId = c.env.CHAT_DURABLE_OBJECT.idFromString(chatRoom.id);
		const chatRoomDo = c.env.CHAT_DURABLE_OBJECT.get(chatRoomDoId);
		const members = await chatRoomDo.getMembers();
		const agentMembers = members.filter((member) => member.type === "agent");

		for (const member of agentMembers) {
			const agentDoId = c.env.AGENT_DURABLE_OBJECT.idFromString(member.id);
			const agentDo = c.env.AGENT_DURABLE_OBJECT.get(agentDoId);
			await agentDo.deleteChatRoom(chatRoom.id);
		}

		await chatRoomDo.delete();

		return c.json({
			success: true,
		});
	});

export default chatRoom;
