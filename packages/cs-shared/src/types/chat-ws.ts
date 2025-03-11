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
	threadId: number; // This is the parentId of the thread messages
};

export type WsMessageThreadInitResponse = {
	type: "thread-init-response";
	threadId: number;
	messages: ChatRoomMessage[];
};

export type WsMessageThreadBroadcast = {
	type: "thread-message-broadcast";
	threadId: number;
	message: ChatRoomMessage;
};

export type WsChatIncomingMessage =
	| WsMessageSend
	| WsMessageChatInitRequest
	| WsMessageThreadInitRequest;

export type WsMessageBroadcast = {
	type: "message-broadcast";
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
	| WsMessageBroadcast
	| WsMessageThreadBroadcast;

export type WsChatMessage = WsChatIncomingMessage | WsChatOutgoingMessage;
