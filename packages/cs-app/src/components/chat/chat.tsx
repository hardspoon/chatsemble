"use client";

import { ChatHeader } from "@/components/chat/chat-header";
import { ChatPlaceholderNoRoomSelected } from "@/components/chat/chat-placeholder";
import { ChatWsProvider } from "@/components/chat/chat-ws-provider";
import type { User } from "better-auth";
import { useSearchParams } from "next/navigation";
import { ChatContent } from "./chat-content";

export function Chat({ user }: { user: User }) {
	const queryParams = useSearchParams();
	const roomId = queryParams.get("roomId");

	if (!roomId) {
		return <ChatPlaceholderNoRoomSelected />;
	}

	return (
		<ChatWsProvider roomId={roomId} user={user}>
			<ChatHeader />
			<ChatContent />
		</ChatWsProvider>
	);
}
