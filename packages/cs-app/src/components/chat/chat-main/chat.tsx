"use client";

import { ChatContent } from "@/components/chat/chat-main/chat-content";
import { ChatHeader } from "@/components/chat/chat-main/chat-header";
import { ChatWsProvider } from "@/components/chat/chat-main/chat-ws-provider";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import type { User } from "better-auth";
import { ChatRoomThreadSidebar } from "@/components/chat/chat-sidebar/chat-room-thread-sidebar";
import { SidebarRightProvider } from "@/components/ui/sidebar-right";
import { ChatParamsProvider, useChatParams } from "./chat-params-provider";

export function Chat({ user }: { user: User }) {
	return (
		<>
			<ChatParamsProvider>
				<ChatWithParams user={user} />
			</ChatParamsProvider>
		</>
	);
}

function ChatWithParams({ user }: { user: User }) {
	const { roomId, threadId } = useChatParams();
	const sidebarRightDefaultOpen = !!roomId && !!threadId;

	return (
		<>
			<ChatWsProvider roomId={roomId} threadId={threadId} user={user}>
				<SidebarRightProvider defaultOpen={sidebarRightDefaultOpen}>
					<SidebarInset>
						<ChatRoomUI user={user} />
					</SidebarInset>
					<ChatRoomThreadSidebar user={user} />
				</SidebarRightProvider>
			</ChatWsProvider>
		</>
	);
}

function ChatRoomUI({ user }: { user: User }) {
	const { roomId } = useChatParams();

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
