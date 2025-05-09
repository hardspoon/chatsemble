import type { User } from "better-auth";
import { customAlphabet } from "nanoid";
import type { ChatRoomMessage, ChatRoomMessagePartial } from "../types/chat";

export function createChatRoomMessagePartial({
	content,
	toolUses,
	mentions,
	threadId,
	roomId,
}: Pick<
	ChatRoomMessagePartial,
	"content" | "toolUses" | "threadId" | "mentions" | "roomId"
>): ChatRoomMessagePartial {
	return {
		id: Number(customAlphabet("0123456789", 20)()),
		threadId,
		roomId,
		content,
		toolUses,
		mentions,
		createdAt: Date.now(),
	};
}

export function createChatRoomOptimisticMessage({
	message,
	user,
	roomId,
}: {
	message: ChatRoomMessagePartial;
	user: User;
	roomId: string;
}): ChatRoomMessage {
	return {
		...message,
		member: {
			id: user.id,
			roomId: roomId,
			name: user.name,
			type: "user",
			role: "member",
			email: user.email,
			image: user.image,
		},
		metadata: {
			optimisticData: {
				createdAt: message.createdAt,
				id: message.id,
			},
		},
	};
}
