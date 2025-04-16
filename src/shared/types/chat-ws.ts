import type { ChatRoom } from "./chat";

export type WsMessageUserInitRequest = {
	type: "user-init-request";
};

export type WsChatIncomingMessage = WsMessageUserInitRequest;

export type WsMessageUserInitResponse = {
	type: "user-init-response";
	chatRooms: ChatRoom[];
};

export type WsMessageChatRoomsUpdate = {
	type: "chat-rooms-update";
	chatRooms: ChatRoom[];
};

export type WsChatOutgoingMessage =
	| WsMessageUserInitResponse
	| WsMessageChatRoomsUpdate;

export type WsChatMessage = WsChatIncomingMessage | WsChatOutgoingMessage;
