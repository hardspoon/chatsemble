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
import { Skeleton } from "@/components/ui/skeleton";
import {
	ChatInput,
	ChatInputSubmit,
	ChatInputTiptap,
} from "@/components/ui/tiptap-chat-input";
import type { User } from "better-auth";
import { useMemo } from "react";
import { BookmarkIcon, MessageSquareIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSidebarRight } from "@/components/ui/sidebar-right";

export function ChatContent({ user }: { user: User }) {
	const { messages, handleSubmit, connectionStatus, members } =
		useChatWsContext();

	const router = useRouter();
	const searchParams = useSearchParams();
	const { setOpen } = useSidebarRight();

	const isLoading = connectionStatus !== "ready";

	const membersWithoutCurrentUser = useMemo(
		() => members.filter((member) => member.id !== user.id),
		[members, user.id],
	);

	const handleBookmark = (messageId: string) => {
		// Implement bookmark functionality
		console.log("Bookmark message:", messageId);
	};

	return (
		<div className="flex-1 flex flex-col h-full overflow-y-auto">
			<ChatMessageArea scrollButtonAlignment="center">
				<div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-4">
					{isLoading ? (
						<ChatMessageSkeleton />
					) : messages.length > 0 ? (
						messages.map((message) => {
							return (
								<ChatMessage key={String(message.id)} id={String(message.id)}>
									<ChatMessageActionsArea>
										<ChatMessageAction
											label="Bookmark message"
											onClick={() => handleBookmark(String(message.id))}
										>
											<BookmarkIcon />
										</ChatMessageAction>
										<ChatMessageAction
											label="Reply in thread"
											onClick={() => {
												const params = new URLSearchParams(
													searchParams.toString(),
												);
												params.set("threadId", String(message.id));
												router.push(`/chat?${params.toString()}`);
												setOpen(true);
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

function ChatMessageSkeleton() {
	return (
		<>
			{[1, 2, 3].map((i) => (
				<div key={i} className="flex space-x-3">
					<Skeleton className="h-10 w-10 rounded-full" />
					<div className="space-y-2 flex-1">
						<Skeleton className="h-4 w-[200px]" />
						<Skeleton className="h-4 w-[300px]" />
						<Skeleton className="h-4 w-[250px]" />
					</div>
				</div>
			))}
		</>
	);
}
