"use client";

import { ChatContent } from "@/components/chat/chat-main/chat-content";
import { ChatHeader } from "@/components/chat/chat-main/chat-header";
import { ChatWsProvider } from "@/components/chat/chat-main/chat-ws-provider";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import type { User } from "better-auth";
import { useSearchParams } from "next/navigation";
import { ChatRoomThreadSidebar } from "@/components/chat/chat-sidebar/chat-room-thread-sidebar";
import { SidebarRightProvider } from "@/components/ui/sidebar-right";

export function Chat({ user }: { user: User }) {
	const queryParams = useSearchParams();
	const roomId = queryParams.get("roomId");
	const threadIdText = queryParams.get("threadId");
	const threadId = threadIdText ? Number(threadIdText) : null;

	const sidebarRightDefaultOpen = !!roomId && !!threadId;

	return (
		<>
			<ChatWsProvider roomId={roomId} threadId={threadId} user={user}>
				<SidebarRightProvider defaultOpen={sidebarRightDefaultOpen}>
					<SidebarInset>
						<ChatRoomUI user={user} roomId={roomId} />
					</SidebarInset>
					<ChatRoomThreadSidebar
						user={user}
						roomId={roomId}
						threadId={threadId}
					/>
				</SidebarRightProvider>
			</ChatWsProvider>
		</>
	);
}

function ChatRoomUI({ user, roomId }: { user: User; roomId: string | null }) {
	if (!roomId) {
		return <NoChatRoomSelected />;
	}

	return (
		<>
			<ChatHeader />
			<ChatContent user={user} />
		</>
	);
}

function NoChatRoomSelected() {
	return (
		<>
			<header className="sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-4">
				<SidebarTrigger />
			</header>
			<div className="flex flex-1 flex-col items-center justify-center">
				<div className="max-w-md text-center">
					<h2 className="mb-2 text-xl font-bold">No chat room selected</h2>
					<p className="text-muted-foreground">
						Select a chat room from the sidebar to start chatting
					</p>
				</div>
			</div>
		</>
	);
}
