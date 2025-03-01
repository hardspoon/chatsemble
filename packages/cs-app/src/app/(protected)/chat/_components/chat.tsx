"use client";

import { ChatHeader } from "@/app/(protected)/chat/_components/chat-header";
import { ChatWsProvider } from "@/app/(protected)/chat/_components/chat-ws-provider";
import type { User } from "better-auth";
import { useSearchParams } from "next/navigation";
import { ChatContent } from "@/app/(protected)/chat/_components/chat-content";

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

function ChatPlaceholderNoRoomSelected() {
	return (
		<div className="flex flex-1 flex-col items-center justify-center">
			<span className="text-lg font-bold">No room selected</span>
			<p className="text-sm text-muted-foreground">
				Please select a room from the sidebar
			</p>
		</div>
	);
}
