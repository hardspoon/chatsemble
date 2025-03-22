"use client";

import { useChatWsContext } from "@/components/chat/providers/chat-ws-provider";
import {
	ChatMessageAction,
	ChatMessageActionsArea,
	ChatMessageThread,
} from "@/components/ui/chat-message";
import { ChatMessageArea } from "@/components/ui/chat-message-area";

import {
	ChatMessagesSkeleton,
	ChatRoomMessage,
} from "@/components/chat/chat-room-message";
import { useChatParams } from "@/components/chat/providers/chat-params-provider";
import {
	ChatInput,
	ChatInputSubmit,
	ChatInputTiptap,
} from "@/components/ui/tiptap-chat-input";
import { BookmarkIcon, MessageSquareIcon } from "lucide-react";
import { useMemo } from "react";

export function ChatRoomMainDisplay() {
	const { topLevelMessages, handleSubmit, connectionStatus, members } =
		useChatWsContext();

	const { setThreadId, user } = useChatParams();

	const isLoading =
		connectionStatus !== "ready" || topLevelMessages.status !== "success";

	const membersWithoutCurrentUser = useMemo(
		() => members.filter((member) => member.id !== user.id),
		[members, user.id],
	);

	return (
		<div className="flex-1 flex flex-col h-full overflow-y-auto">
			<ChatMessageArea scrollButtonAlignment="center">
				<div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-4">
					{isLoading ? (
						<ChatMessagesSkeleton />
					) : topLevelMessages.data.length > 0 ? (
						topLevelMessages.data.map((message) => {
							return (
								<ChatRoomMessage
									key={message.id}
									message={message}
									actionArea={
										<ChatMessageActionsArea>
											<ChatMessageAction
												label="Bookmark message"
												onClick={() =>
													console.log("Bookmark message:", message.id)
												}
											>
												<BookmarkIcon />
											</ChatMessageAction>
											<ChatMessageAction
												label="Reply in thread"
												onClick={() => {
													setThreadId(message.id);
												}}
											>
												<MessageSquareIcon />
											</ChatMessageAction>
										</ChatMessageActionsArea>
									}
									threadArea={({ id }, threadMetadata) => (
										<ChatMessageThread
											threadMetadata={threadMetadata}
											onClick={() => {
												setThreadId(id);
											}}
										/>
									)}
								/>
							);
						})
					) : (
						<div className="text-center text-sm text-muted-foreground">
							No messages yet
						</div>
					)}
				</div>
			</ChatMessageArea>
			<div className="p-4 max-w-2xl mx-auto w-full">
				<ChatInput
					onSubmit={(value) => {
						handleSubmit({
							value,
							threadId: null,
						});
					}}
					chatMembers={membersWithoutCurrentUser}
					disabled={isLoading}
				>
					<ChatInputTiptap />
					<ChatInputSubmit />
				</ChatInput>
			</div>
		</div>
	);
}
