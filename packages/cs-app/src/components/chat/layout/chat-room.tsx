"use client";

import { ChatRoomMainDisplay } from "@/components/chat/main/chat-room-main-display";
import { ChatRoomMainHeader } from "@/components/chat/main/chat-room-main-header";
import { ChatWsProvider } from "@/components/chat/providers/chat-ws-provider";
import type { User } from "better-auth";
import {
	ChatParamsProvider,
	useChatParams,
} from "@/components/chat/providers/chat-params-provider";
import { ChatRoomNotSelected } from "@/components/chat/layout/chat-room-not-selected";

export function ChatRoom({ user }: { user: User }) {
	return (
		<ChatParamsProvider user={user}>
			<ChatRoomWithParams />
		</ChatParamsProvider>
	);
}

function ChatRoomWithParams() {
	const { roomId, threadId, user } = useChatParams();

	return (
		<ChatWsProvider roomId={roomId} threadId={threadId} user={user}>
			<ChatRoomContent />
		</ChatWsProvider>
	);
}

function ChatRoomContent() {
	const { roomId } = useChatParams();

	if (!roomId) {
		return <ChatRoomNotSelected />;
	}

	return (
		<>
			<ChatRoomMainHeader />
			<ChatRoomMainDisplay />
		</>
	);
}
