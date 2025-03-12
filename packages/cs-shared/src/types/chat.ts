import { z } from "zod";

export type ChatMessageMetadata = {
	optimisticData?: {
		createdAt: number;
		id: number;
	};
};

// ChatMention

export const chatMentionSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
});

export type ChatMention = z.infer<typeof chatMentionSchema>;

export const chatMentionsSchema = z.array(chatMentionSchema);

export type ChatMentions = z.infer<typeof chatMentionsSchema>;

// ChatInputValue

export const chatInputValueSchema = z.object({
	content: z.string().min(1),
	mentions: chatMentionsSchema,
});

export type ChatInputValue = z.infer<typeof chatInputValueSchema>;

// ChatRoomMessage

export const chatMessagePartialSchema = z.object({
	id: z.number(),
	content: z.string().min(1),
	mentions: chatMentionsSchema,
	createdAt: z.number(),
	threadId: z.number().nullable(),
});

export type ChatRoomMessagePartial = z.infer<typeof chatMessagePartialSchema>;

export interface ChatRoomMessage extends ChatRoomMessagePartial {
	user: ChatRoomMember;
	metadata: ChatMessageMetadata;
}

// ChatRoomMember

const CHAT_ROOM_MEMBER_ROLES = ["member", "owner", "admin"] as const;

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
	image: z.string().optional().nullable(),
});

export const createChatRoomMemberSchema = chatRoomMemberSchema.omit({
	name: true,
	email: true,
	image: true,
});

export type ChatRoomMember = z.infer<typeof chatRoomMemberSchema>;

export type CreateChatRoomMember = z.infer<typeof createChatRoomMemberSchema>;

// ChatRoom

const CHAT_ROOM_TYPES = ["publicGroup", "privateGroup", "oneToOne"] as const;

const chatRoomTypesSchema = z.enum(CHAT_ROOM_TYPES);

export type ChatRoomType = (typeof CHAT_ROOM_TYPES)[number];

export const chatRoomSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	type: chatRoomTypesSchema,
	organizationId: z.string().min(1),
	createdAt: z.number(),
});

export const createChatRoomSchema = chatRoomSchema
	.omit({
		id: true,
		createdAt: true,
		organizationId: true,
	})
	.extend({
		members: z.array(createChatRoomMemberSchema.omit({ roomId: true })),
	});

export type ChatRoom = z.infer<typeof chatRoomSchema>;
