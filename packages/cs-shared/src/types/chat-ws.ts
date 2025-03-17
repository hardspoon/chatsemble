import type {
	ChatRoomMessage,
	ChatRoomMessagePartial,
	ChatRoomMember,
	ChatRoom,
} from "./chat";

export type WsMessageChatInitRequest = {
	type: "chat-init-request";
};
export type WsMessageSend = {
	type: "message-send";
	message: ChatRoomMessagePartial;
};

export type WsMessageThreadInitRequest = {
	type: "thread-init-request";
	threadId: number;
};

export type WsMessageThreadInitResponse = {
	type: "thread-init-response";
	threadId: number;
	threadMessage: ChatRoomMessage;
	messages: ChatRoomMessage[];
};

export type WsChatIncomingMessage =
	| WsMessageSend
	| WsMessageChatInitRequest
	| WsMessageThreadInitRequest;

export type WsMessageBroadcast = {
	type: "message-broadcast";
	threadId: number | null;
	message: ChatRoomMessage;
};

export type WsMessageChatInitResponse = {
	type: "chat-init-response";
	messages: ChatRoomMessage[];
	members: ChatRoomMember[];
	room: ChatRoom;
};

export type WsMemberUpdate = {
	type: "member-update";
	members: ChatRoomMember[];
};

export type WsChatOutgoingMessage =
	| WsMessageChatInitResponse
	| WsMessageThreadInitResponse
	| WsMemberUpdate
	| WsMessageBroadcast;

export type WsChatMessage = WsChatIncomingMessage | WsChatOutgoingMessage;
