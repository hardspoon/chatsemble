import { createAccessControl } from "better-auth/plugins/access";
import { and, eq } from "drizzle-orm";
import type { DrizzleDB } from "../types/drizzle";
import * as d1Schema from "../db/schema";
import type { ChatRoomType } from "../types/chat";

// Permissions for org role member for chat room

const statement = {
	publicGroupChatRoomMember: ["create", "delete"],
	privateGroupChatRoomMember: ["create", "delete"],
	oneToOneChatRoomMember: ["create", "delete"],
} as const;

const accessControl = createAccessControl(statement);

const member = accessControl.newRole({
	publicGroupChatRoomMember: ["create"],
	privateGroupChatRoomMember: [],
	oneToOneChatRoomMember: ["create"],
});

const admin = accessControl.newRole({
	publicGroupChatRoomMember: ["create", "delete"],
	privateGroupChatRoomMember: ["create", "delete"],
	oneToOneChatRoomMember: ["create", "delete"],
});

const owner = accessControl.newRole({
	publicGroupChatRoomMember: ["create", "delete"],
	privateGroupChatRoomMember: ["create", "delete"],
	oneToOneChatRoomMember: ["create", "delete"],
});

export const chatRoomPermissions = {
	member,
	admin,
	owner,
	accessControl,
};

export async function chatRoomRoleHasPermission({
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

export const chatRoomMemberHasMemberPermission = async ({
	userId,
	chatRoomId,
	chatRoomType,
	db,
}: {
	userId: string;
	chatRoomId: string;
	chatRoomType: ChatRoomType;
	db: DrizzleDB;
	permission: "create" | "delete";
}) => {
	const hasChatRoomPermission = await chatRoomRoleHasPermission({
		db,
		userId,
		chatRoomId,
		permission: {
			[`${chatRoomType}ChatRoomMember`]: ["create", "delete"],
		},
	});

	return !!hasChatRoomPermission;
};
