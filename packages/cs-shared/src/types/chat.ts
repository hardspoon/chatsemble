import { z } from "zod";

// ChatRoomMessage

export const chatMessageSchema = z.object({
	id: z.string().min(1),
	content: z.string().min(1),
	createdAt: z.number(),
});

export type ChatRoomMessagePartial = z.infer<typeof chatMessageSchema>;

export interface ChatRoomMessage extends ChatRoomMessagePartial {
	user: ChatRoomMember;
}

// ChatRoomMember

const CHAT_ROOM_MEMBER_ROLES = ["member", "admin"] as const;

const chatRoomMembersRolesSchema = z.enum(CHAT_ROOM_MEMBER_ROLES);

export type ChatRoomMemberRole = (typeof CHAT_ROOM_MEMBER_ROLES)[number];

const CHAT_ROOM_MEMBER_TYPES = ["user", "agent"] as const;

const chatRoomMembersTypesSchema = z.enum(CHAT_ROOM_MEMBER_TYPES);

export type ChatRoomMemberType = (typeof CHAT_ROOM_MEMBER_TYPES)[number];

export const chatRoomMemberSchema = z.object({
	id: z.string().min(1),
	roomId: z.string().min(1),
	role: chatRoomMembersRolesSchema,
	type: chatRoomMembersTypesSchema,
	name: z.string().min(1),
	email: z.string().min(1),
	image: z.string().nullable(),
});

export const createChatRoomMemberSchema = chatRoomMemberSchema.omit({
	name: true,
	email: true,
	image: true,
});

export type ChatRoomMember = z.infer<typeof chatRoomMemberSchema>;

// ChatRoom

export const chatRoomSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	isPrivate: z.boolean().optional(),
	organizationId: z.string().min(1),
	createdAt: z.number(),
});

export const createChatRoomSchema = chatRoomSchema.omit({
	id: true,
	createdAt: true,
	organizationId: true,
});

export type ChatRoom = z.infer<typeof chatRoomSchema>;

// WsChatRoomMessage

export type WsChatRoomMessage =
	| { type: "message-receive"; message: ChatRoomMessagePartial }
	| { type: "message-broadcast"; message: ChatRoomMessage }
	| { type: "messages-sync"; messages: ChatRoomMessage[] }
	| { type: "member-sync"; members: ChatRoomMember[] };
