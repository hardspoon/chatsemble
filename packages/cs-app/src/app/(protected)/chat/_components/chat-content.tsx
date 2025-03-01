"use client";

import { useChatWsContext } from "@/app/(protected)/chat/_components/chat-ws-provider";
import {
	ChatInput,
	ChatInputSubmit,
	ChatInputTextArea,
} from "@/components/ui/chat-input";
import {
	ChatMessage,
	ChatMessageAvatar,
	ChatMessageContent,
	ChatMessageContentArea,
	ChatMessageMetadata,
} from "@/components/ui/chat-message";
import { ChatMessageArea } from "@/components/ui/chat-message-area";
import { Skeleton } from "@/components/ui/skeleton";

export function ChatContent() {
	const { messages, input, handleInputChange, handleSubmit, connectionStatus } =
		useChatWsContext();

	const isLoading = connectionStatus !== "ready";

	return (
		<div className="flex-1 flex flex-col h-full overflow-y-auto">
			<ChatMessageArea scrollButtonAlignment="center">
				<div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-4">
					{isLoading ? (
						<ChatMessageSkeleton />
					) : messages.length > 0 ? (
						messages.map((message) => {
							return (
								<ChatMessage key={message.id} id={message.id}>
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
					value={input}
					onChange={handleInputChange}
					onSubmit={handleSubmit}
				>
					<ChatInputTextArea placeholder="Type a message..." />
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
