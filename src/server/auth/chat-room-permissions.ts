import { createAccessControl } from "better-auth/plugins/access";

import type { ChatRoomType } from "@/shared/types";
import { dbServices } from "../db/services";
import {
	chatRoomPermissionTypes,
	chatRoomMemberPermissionTypes,
} from "./organization-permissions";
import { auth } from ".";

// Permissions for org role member for chat room

const statement = {
	publicGroupChatRoomMember: chatRoomMemberPermissionTypes,
	privateGroupChatRoomMember: chatRoomMemberPermissionTypes,
	oneToOneChatRoomMember: chatRoomMemberPermissionTypes,
	publicGroupChatRoom: chatRoomPermissionTypes,
	privateGroupChatRoom: chatRoomPermissionTypes,
	oneToOneChatRoom: chatRoomPermissionTypes,
} as const;

const accessControl = createAccessControl(statement);

const member = accessControl.newRole({
	publicGroupChatRoomMember: ["create"],
	privateGroupChatRoomMember: [],
	oneToOneChatRoomMember: ["create"],
	publicGroupChatRoom: ["create"],
	privateGroupChatRoom: ["create"],
	oneToOneChatRoom: ["create"],
});

const admin = accessControl.newRole({
	publicGroupChatRoomMember: ["create", "delete"],
	privateGroupChatRoomMember: ["create", "delete"],
	oneToOneChatRoomMember: ["create", "delete"],
	publicGroupChatRoom: ["create", "update", "delete"],
	privateGroupChatRoom: ["create", "update", "delete"],
	oneToOneChatRoom: ["create", "update", "delete"],
});

const owner = accessControl.newRole({
	publicGroupChatRoomMember: ["create", "delete"],
	privateGroupChatRoomMember: ["create", "delete"],
	oneToOneChatRoomMember: ["create", "delete"],
	publicGroupChatRoom: ["create", "update", "delete"],
	privateGroupChatRoom: ["create", "update", "delete"],
	oneToOneChatRoom: ["create", "update", "delete"],
});

const chatRoomPermissions = {
	member,
	admin,
	owner,
	accessControl,
};

export async function chatRoomRoleHasPermission({
	userId,
	chatRoomId,
	permission,
}: {
	userId: string;
	chatRoomId: string;
	permission: {
		[x: string]: string[];
	};
}) {
	const roomMember = await dbServices.roomMember.getChatRoomMember({
		chatRoomId,
		memberId: userId,
	});

	if (!roomMember) {
		return false;
	}

	const { role } = roomMember;

	return chatRoomPermissions[role].authorize(permission);
}

export const chatRoomMemberHasMemberPermission = async ({
	headers,
	params,
}: {
	headers: Headers;

	params: {
		userId: string;
		chatRoomId: string;
		chatRoomType: ChatRoomType;
		permission: "create" | "delete";
	};
}) => {
	const { success: hasOrgRolePermission } = await auth.api.hasPermission({
		headers,
		body: {
			permission: {
				chatRoomMember: [params.permission],
			},
		},
	});

	if (!hasOrgRolePermission) {
		const hasChatRoomPermission = await chatRoomRoleHasPermission({
			userId: params.userId,
			chatRoomId: params.chatRoomId,
			permission: {
				[`${params.chatRoomType}ChatRoomMember`]: [params.permission],
			},
		});

		return !!hasChatRoomPermission;
	}

	return true;
};

export const chatRoomMemberHasChatRoomPermission = async ({
	headers,
	params,
}: {
	headers: Headers;
	params: {
		permission: "create" | "update" | "delete";
		checkMemberPermission?: {
			userId: string;
			chatRoomId: string;
			chatRoomType: ChatRoomType;
		};
	};
}) => {
	const { success: hasOrgRolePermission } = await auth.api.hasPermission({
		headers,
		body: {
			permission: {
				chatRoom: [params.permission],
			},
		},
	});

	if (!hasOrgRolePermission && params.checkMemberPermission) {
		const hasChatRoomPermission = await chatRoomRoleHasPermission({
			userId: params.checkMemberPermission.userId,
			chatRoomId: params.checkMemberPermission.chatRoomId,
			permission: {
				[`${params.checkMemberPermission.chatRoomType}ChatRoom`]: [
					params.permission,
				],
			},
		});

		return !!hasChatRoomPermission;
	}

	return true;
};
