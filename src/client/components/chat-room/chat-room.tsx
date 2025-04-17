import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@client/components/ui/resizable";
import { ChatRoomNotSelected } from "@client/components/chat-room/chat-room-not-selected";
import { ChatRoomMainHeader } from "@client/components/chat-room/main/chat-room-main-header";
import { ChatRoomThreadHeader } from "@client/components/chat-room/thread/chat-room-thread-header";
import { ChatRoomMainDisplay } from "@client/components/chat-room/main/chat-room-main-display";
import { useSearch } from "@tanstack/react-router";

export function ChatRoom() {
	return <ChatRoomContent />;
}

function ChatRoomContent() {
	const { roomId, threadId } = useSearch({ strict: false });

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
							<div>Thread</div>
						</div>
					</ResizablePanel>
				)}
			</ResizablePanelGroup>
		</>
	);
}
