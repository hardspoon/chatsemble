import type {
	ChatRoom,
	ChatRoomMessage,
	ChatRoomMember,
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

export type WsMessageChatRoomMessageSend = {
	type: "chat-room-message-send";
	roomId: string;
	threadId: number | null;
	message: ChatRoomMessagePartial;
};

export type WsChatIncomingMessage =
	| WsMessageUserInitRequest
	| WsMessageChatRoomInitRequest
	| WsMessageChatRoomMessageSend;

export type WsMessageUserInitResponse = {
	type: "user-init-response";
	chatRooms: ChatRoom[];
};

export type WsMessageChatRoomInitResponse = {
	type: "chat-room-init-response";
	messages: ChatRoomMessage[];
	members: ChatRoomMember[];
	room: ChatRoom;
	workflows: Workflow[];
};

export type WsMessageChatRoomsUpdate = {
	type: "chat-rooms-update";
	chatRooms: ChatRoom[];
};

export type WsChatOutgoingMessage =
	| WsMessageUserInitResponse
	| WsMessageChatRoomsUpdate
	| WsMessageChatRoomInitResponse;

export type WsChatMessage = WsChatIncomingMessage | WsChatOutgoingMessage;
