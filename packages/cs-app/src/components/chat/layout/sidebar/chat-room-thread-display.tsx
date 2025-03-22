"use client";

import { ChatMessageArea } from "@/components/ui/chat-message-area";
import { Separator } from "@/components/ui/separator";
import {
	ChatInput,
	ChatInputSubmit,
	ChatInputTiptap,
} from "@/components/ui/tiptap-chat-input";
import type { ChatInputValue } from "@/cs-shared";
import { useMemo } from "react";
import { ChatMessageSkeleton, ChatRoomMessage } from "../../chat-room-message";
import { ChatMessagesSkeleton } from "../../chat-room-message";
import { useChatParams } from "../../providers/chat-params-provider";
import { useChatWsContext } from "../../providers/chat-ws-provider";

export function ChatRoomThreadDisplay() {
	const { activeThread, handleSubmit, connectionStatus, members } =
		useChatWsContext();

	const { threadId, user } = useChatParams();

	const isLoading =
		connectionStatus !== "ready" || activeThread.status !== "success";

	const membersWithoutCurrentUser = useMemo(
		() => members.filter((member) => member.id !== user.id),
		[members, user.id],
	);

	const onSubmit = (value: ChatInputValue) => {
		console.log("[ONSUBMIT]", {
			value,
			threadId,
			activeThreadId: activeThread.id,
		});
		handleSubmit({ value, threadId });
	};

	return (
		<div className="flex-1 flex flex-col h-full overflow-y-auto">
			<ChatMessageArea scrollButtonAlignment="center" className="px-6">
				<div className="max-w-2xl mx-auto w-full px-4 py-8">
					<div>
						{activeThread.threadMessage ? (
							<ChatRoomMessage message={activeThread.threadMessage} />
						) : (
							isLoading && <ChatMessageSkeleton />
						)}
					</div>
					<Separator className="mt-3 mb-6" />
					<div className="space-y-4">
						{isLoading ? (
							<ChatMessagesSkeleton items={2} />
						) : activeThread.messages.length > 0 ? (
							activeThread.messages.map((message) => (
								<ChatRoomMessage key={String(message.id)} message={message} />
							))
						) : (
							<div className="text-center text-sm text-muted-foreground">
								Send a message to start the thread
							</div>
						)}
					</div>
				</div>
			</ChatMessageArea>
			<div className="p-4 max-w-2xl mx-auto w-full">
				<ChatInput
					onSubmit={onSubmit}
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
