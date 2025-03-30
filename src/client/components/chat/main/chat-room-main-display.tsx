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
import { useUser } from "@/components/providers/auth-provider";
import {
	ChatInput,
	ChatInputSubmit,
	ChatInputTiptap,
} from "@/components/ui/tiptap-chat-input";
import { useRouter } from "@tanstack/react-router";
import { BookmarkIcon, MessageSquareIcon } from "lucide-react";
import { useMemo } from "react";
export function ChatRoomMainDisplay() {
	const {
		mainChat: { messages, handleSubmit, members, status },
		connectionStatus,
	} = useChatWsContext();

	const router = useRouter();

	const user = useUser();

	const isLoading = connectionStatus !== "connected" || status !== "success";

	const membersWithoutCurrentUser = useMemo(
		() => members.filter((member) => member.id !== user.id),
		[members, user.id],
	);

	return (
		<div className="flex-1 flex flex-col overflow-y-auto">
			<ChatMessageArea
				scrollButtonAlignment="center"
				className="overflow-y-auto flex-1"
			>
				<div className="max-w-2xl mx-auto w-full px-8 py-8 space-y-4">
					{isLoading ? (
						<ChatMessagesSkeleton />
					) : messages.length > 0 ? (
						messages.map((message) => {
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
													router.navigate({
														to: "/chat",
														search: (prev) => ({
															...prev,
															threadId: message.id,
														}),
													});
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
												router.navigate({
													to: "/chat",
													search: (prev) => ({
														...prev,
														threadId: id,
													}),
												});
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
