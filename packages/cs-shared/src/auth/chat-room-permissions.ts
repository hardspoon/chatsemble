import { createAccessControl } from "better-auth/plugins/access";
import { and, eq } from "drizzle-orm";
import type { DrizzleDB } from "../types/drizzle";
import * as d1Schema from "../db/schema";

// Permissions for org role member for chat room

export type ChatRoomStatementKeys =
	| "chatRoomPublicGroupMember"
	| "chatRoomPrivateGroupMember"
	| "chatRoomOneToOneMember";

const statement = {
	chatRoomPublicGroupMember: ["create", "update", "delete"],
	chatRoomPrivateGroupMember: ["create", "update", "delete"],
	chatRoomOneToOneMember: ["create", "update", "delete"],
} as const;

const accessControl = createAccessControl(statement);

const member = accessControl.newRole({
	chatRoomPublicGroupMember: ["create"],
	chatRoomPrivateGroupMember: [],
	chatRoomOneToOneMember: ["create"],
});

const admin = accessControl.newRole({
	chatRoomPublicGroupMember: ["create", "update", "delete"],
	chatRoomPrivateGroupMember: ["create", "update", "delete"],
	chatRoomOneToOneMember: ["create", "update", "delete"],
});

const owner = accessControl.newRole({
	chatRoomPublicGroupMember: ["create", "update", "delete"],
	chatRoomPrivateGroupMember: ["create", "update", "delete"],
	chatRoomOneToOneMember: ["create", "update", "delete"],
});

export const chatRoomPermissions = {
	member,
	admin,
	owner,
	accessControl,
};

export async function chatRoomHasPermission({
	db,
	userId,
	chatRoomId,
	permission,
}: {
	db: DrizzleDB;
	userId: string;
	chatRoomId: string;
	permission: {
		[x: string]: string[];
	};
}) {
	const roomMember = await db
		.select({
			roomId: d1Schema.chatRoomMember.roomId,
			role: d1Schema.chatRoomMember.role,
		})
		.from(d1Schema.chatRoomMember)
		.where(
			and(
				eq(d1Schema.chatRoomMember.memberId, userId),
				eq(d1Schema.chatRoomMember.roomId, chatRoomId),
			),
		)
		.limit(1)
		.get();

	if (!roomMember) {
		return false;
	}

	const { role } = roomMember;

	return chatRoomPermissions[role].authorize(permission);
}
