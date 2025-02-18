"use client";

import { useSearchParams } from "next/navigation";
import { ChatWsProvider } from "@/components/chat/chat-ws-provider";
import { ChatHeader } from "@/components/chat/chat-header";
import type { User } from "better-auth";
import { ChatPlaceholderNoRoomSelected } from "@/components/chat/chat-placeholder";
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
