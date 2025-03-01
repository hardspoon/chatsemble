import type {
	ChatRoomMessage,
	ChatRoomMessagePartial,
	ChatRoomMember,
} from "./chat";

export type WsMessageChatInit = {
	type: "chat-init";
};
export type WsMessageReceive = {
	type: "message-receive";
	message: ChatRoomMessagePartial;
};

export type WsChatIncomingMessage = WsMessageReceive | WsMessageChatInit;

export type WsMessageBroadcast = {
	type: "message-broadcast";
	message: ChatRoomMessage;
};

export type WsMessageChatReady = {
	type: "chat-ready";
	messages: ChatRoomMessage[];
	members: ChatRoomMember[];
};

export type WsMessagesSync = {
	type: "messages-sync";
	messages: ChatRoomMessage[];
};
export type WsMemberSync = { type: "member-sync"; members: ChatRoomMember[] };

export type WsChatOutgoingMessage =
	| WsMessageBroadcast
	| WsMessagesSync
	| WsMemberSync
	| WsMessageChatReady;

export type WsChatMessage = WsChatIncomingMessage | WsChatOutgoingMessage;
