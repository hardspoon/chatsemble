"use client";

import { useChatWsContext } from "@/components/chat/chat-main/chat-ws-provider";
import {
	ChatMessage,
	ChatMessageActionsArea,
	ChatMessageAction,
	ChatMessageAvatar,
	ChatMessageContent,
	ChatMessageContentArea,
	ChatMessageMetadata,
} from "@/components/ui/chat-message";
import { ChatMessageArea } from "@/components/ui/chat-message-area";

import {
	ChatInput,
	ChatInputSubmit,
	ChatInputTiptap,
} from "@/components/ui/tiptap-chat-input";
import type { User } from "better-auth";
import { useMemo } from "react";
import { BookmarkIcon, MessageSquareIcon } from "lucide-react";
import { useChatParams } from "@/components/chat/chat-main/chat-params-provider";
import { ChatMessagesSkeleton } from "@/components/chat/chat-message-skeleton";

export function ChatContent({ user }: { user: User }) {
	const { topLevelMessages, handleSubmit, connectionStatus, members } =
		useChatWsContext();

	const { setThreadId } = useChatParams();

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
								<ChatMessage key={String(message.id)} id={String(message.id)}>
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
									<ChatMessageAvatar
										imageSrc={message.user.image ?? undefined}
									/>
									<ChatMessageContentArea>
										<ChatMessageMetadata
											username={message.user.name}
											createdAt={message.createdAt}
										/>
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
					onSubmit={(value) => {
						handleSubmit({
							value,
							parentId: null,
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
