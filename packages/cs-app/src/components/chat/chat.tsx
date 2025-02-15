"use client";

import {
	ChatInput,
	ChatInputSubmit,
	ChatInputTextArea,
} from "@/components/ui/chat-input";
import {
	ChatMessage,
	ChatMessageAvatar,
	ChatMessageContent,
	ChatMessageUser,
	ChatMessageContentArea,
} from "@/components/ui/chat-message";
import { ChatMessageArea } from "@/components/ui/chat-message-area";
import { useSearchParams } from "next/navigation";
import { ChatProvider, useChatContext } from "@/providers/chat-provider";
import { AppHeader } from "@/components/layout/app-header";

export function ChatWrapper({ userId }: { userId: string }) {
	const queryParams = useSearchParams();
	const roomId = queryParams.get("roomId");

	if (!roomId) {
		return <NoRoomId />;
	}

	return (
		<ChatProvider roomId={roomId} userId={userId}>
			<AppHeader />
			<Chat />
		</ChatProvider>
	);
}

function NoRoomId() {
	return (
		<div className="flex flex-1 flex-col items-center justify-center">
			<span className="text-lg font-bold">No room selected</span>
			<p className="text-sm text-muted-foreground">
				Please select a room from the sidebar
			</p>
		</div>
	);
}

function Chat() {
	const { messages, input, handleInputChange, handleSubmit, stop } =
		useChatContext();

	return (
		<div className="flex-1 flex flex-col h-full overflow-y-auto">
			<ChatMessageArea scrollButtonAlignment="center">
				<div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-4">
					{messages.length > 0 ? (
						messages.map((message) => {
							return (
								<ChatMessage key={message.id} id={message.id}>
									<ChatMessageAvatar />
									<ChatMessageContentArea>
										<ChatMessageUser username={message.user.userId} />
										<ChatMessageContent content={message.content} />
									</ChatMessageContentArea>
								</ChatMessage>
							);
						})
					) : (
						<div className="text-center text-sm text-muted-foreground">
							No messages yet
						</div>
					)}
				</div>
			</ChatMessageArea>
			<div className="px-2 py-4 max-w-2xl mx-auto w-full">
				<ChatInput
					value={input}
					onChange={handleInputChange}
					onSubmit={handleSubmit}
					loading={false}
					onStop={stop}
				>
					<ChatInputTextArea placeholder="Type a message..." />
					<ChatInputSubmit />
				</ChatInput>
			</div>
		</div>
	);
}
