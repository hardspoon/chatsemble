import type {
	ChatRoom,
	ChatRoomMember,
	ChatRoomMessage,
	ChatRoomMessagePartial,
} from "@shared/types/chat";
import type { Workflow } from "@shared/types/workflow";

export type WsMessageUserInitRequest = {
	type: "user-init-request";
};

export type WsMessageChatRoomInitRequest = {
	type: "chat-room-init-request";
	roomId: string;
};

export type WsMessageChatRoomThreadInitRequest = {
	type: "chat-room-thread-init-request";
	roomId: string;
	threadId: number;
};

export type WsMessageChatRoomMessageSend = {
	type: "chat-room-message-send";
	roomId: string;
	threadId: number | null;
	message: ChatRoomMessagePartial;
};

export type WsChatIncomingMessage =
	| WsMessageUserInitRequest
	| WsMessageChatRoomInitRequest
	| WsMessageChatRoomMessageSend
	| WsMessageChatRoomThreadInitRequest;

export type WsMessageUserInitResponse = {
	type: "user-init-response";
	chatRooms: ChatRoom[];
};

export type WsMessageChatRoomInitResponse = {
	type: "chat-room-init-response";
	roomId: string;
	messages: ChatRoomMessage[];
	members: ChatRoomMember[];
	room: ChatRoom;
	workflows: Workflow[];
};

export type WsMessageChatRoomThreadInitResponse = {
	type: "chat-room-thread-init-response";
	roomId: string;
	threadId: number;
	threadMessage: ChatRoomMessage;
	messages: ChatRoomMessage[];
};

export type WsMessageChatRoomsUpdate = {
	type: "chat-rooms-update";
	chatRooms: ChatRoom[];
};

export type WsMessageChatRoomMessageBroadcast = {
	type: "chat-room-message-broadcast";
	roomId: string;
	threadId: number | null;
	message: ChatRoomMessage;
};

export type WsMessageChatRoomWorkflowsUpdate = {
	type: "chat-room-workflows-update";
	roomId: string;
	workflows: Workflow[];
};

export type WsMessageChatRoomMembersUpdate = {
	type: "chat-room-members-update";
	roomId: string;
	members: ChatRoomMember[];
};

export type WsChatOutgoingMessage =
	| WsMessageUserInitResponse
	| WsMessageChatRoomsUpdate
	| WsMessageChatRoomInitResponse
	| WsMessageChatRoomMessageBroadcast
	| WsMessageChatRoomThreadInitResponse
	| WsMessageChatRoomWorkflowsUpdate
	| WsMessageChatRoomMembersUpdate;

export type WsChatMessage = WsChatIncomingMessage | WsChatOutgoingMessage;
