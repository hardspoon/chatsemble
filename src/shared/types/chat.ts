import { z } from "zod";
import type { AgentToolUse } from "./agent";

export type ChatMessageMetadata = {
	optimisticData?: {
		createdAt: number;
		id: number;
	};
};

export type ChatMessageThreadMetadata = {
	lastMessage: ChatRoomMessage;
	messageCount: number;
} | null;

// ChatMention
export type ChatMention = {
	id: string;
	name: string;
};

export type ChatMentions = ChatMention[];

// ChatInputValue
export type ChatInputValue = {
	content: string;
	mentions: ChatMention[];
};

// ChatRoomMessage
export interface ChatRoomMessagePartial {
	id: number;
	content: string;
	mentions: ChatMention[];
	toolUses: AgentToolUse[];
	createdAt: number;
	threadId: number | null;
	roomId: string;
}

export interface ChatRoomMessage extends ChatRoomMessagePartial {
	member: ChatRoomMember;
	metadata: ChatMessageMetadata;
	threadMetadata?: ChatMessageThreadMetadata;
}

// ChatRoomMember
const CHAT_ROOM_MEMBER_ROLES = ["member", "owner", "admin"] as const;
export type ChatRoomMemberRole = (typeof CHAT_ROOM_MEMBER_ROLES)[number];

const CHAT_ROOM_MEMBER_TYPES = ["user", "agent"] as const;
export type ChatRoomMemberType = (typeof CHAT_ROOM_MEMBER_TYPES)[number];

export interface ChatRoomMember {
	id: string;
	roomId: string;
	role: ChatRoomMemberRole;
	type: ChatRoomMemberType;
	name: string;
	email: string;
	image?: string | null;
}

export const createChatRoomMemberSchema = z.object({
	id: z.string().min(1),
	roomId: z.string().min(1),
	role: z.enum(CHAT_ROOM_MEMBER_ROLES),
	type: z.enum(CHAT_ROOM_MEMBER_TYPES),
});

export type CreateChatRoomMember = z.infer<typeof createChatRoomMemberSchema>;

// ChatRoom
const CHAT_ROOM_TYPES = ["public"] as const;
export type ChatRoomType = (typeof CHAT_ROOM_TYPES)[number];

export interface ChatRoom {
	id: string;
	name: string;
	type: ChatRoomType;
	organizationId: string;
	createdAt: number;
}

export const createChatRoomSchema = z.object({
	name: z.string().min(1),
	members: z.array(createChatRoomMemberSchema.omit({ roomId: true })),
});
