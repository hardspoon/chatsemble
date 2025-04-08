"use client";

import { ChatRoomNotSelected } from "@client/components/chat/layout/chat-room-not-selected";
import { ChatRoomThreadHeader } from "@client/components/chat/layout/chat-room-thread-header";
import { ChatRoomThreadDisplay } from "@client/components/chat/layout/sidebar/chat-room-thread-display";
import { ChatRoomMainDisplay } from "@client/components/chat/main/chat-room-main-display";
import { ChatRoomMainHeader } from "@client/components/chat/main/chat-room-main-header";
import {
	ChatParamsProvider,
	useChatParams,
} from "@client/components/chat/providers/chat-params-provider";
import { ChatWsProvider } from "@client/components/chat/providers/chat-ws-provider";
import { useAuthSession } from "@client/components/providers/auth-provider";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@client/components/ui/resizable";

export function ChatRoom() {
	return (
		<ChatParamsProvider>
			<ChatRoomWithParams />
		</ChatParamsProvider>
	);
}

function ChatRoomWithParams() {
	const { roomId, threadId } = useChatParams();
	const { user } = useAuthSession();

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
