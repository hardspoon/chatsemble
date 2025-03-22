"use client";

import { ChatRoomNotSelected } from "@/components/chat/layout/chat-room-not-selected";
import { ChatRoomThreadHeader } from "@/components/chat/layout/chat-room-thread-header";
import { ChatRoomThreadDisplay } from "@/components/chat/layout/sidebar/chat-room-thread-display";
import { ChatRoomMainDisplay } from "@/components/chat/main/chat-room-main-display";
import { ChatRoomMainHeader } from "@/components/chat/main/chat-room-main-header";
import {
	ChatParamsProvider,
	useChatParams,
} from "@/components/chat/providers/chat-params-provider";
import { ChatWsProvider } from "@/components/chat/providers/chat-ws-provider";
import { ResizableHandle } from "@/components/ui/resizable";
import { ResizablePanel } from "@/components/ui/resizable";
import { ResizablePanelGroup } from "@/components/ui/resizable";
import type { User } from "better-auth";

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
	const { roomId, threadId } = useChatParams();

	if (!roomId) {
		return <ChatRoomNotSelected />;
	}

	return (
		<>
			<ResizablePanelGroup direction="horizontal">
				<ResizablePanel
					id="main-panel"
					order={1}
					defaultSize={threadId ? 50 : 100}
					minSize={35}
				>
					<div className="flex-1 flex flex-col h-full">
						<ChatRoomMainHeader />
						<ChatRoomMainDisplay />
					</div>
				</ResizablePanel>
				{threadId && <ResizableHandle className="bg-transparent" />}
				{threadId && (
					<ResizablePanel
						id="thread-panel"
						order={2}
						defaultSize={50}
						minSize={35}
					>
						<div className="flex-1 flex flex-col h-full border-border border-l rounded-l-xl shadow">
							<ChatRoomThreadHeader />
							<ChatRoomThreadDisplay />
						</div>
					</ResizablePanel>
				)}
			</ResizablePanelGroup>
		</>
	);
}
