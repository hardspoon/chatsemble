"use client";

import {
	ChatInput,
	ChatInputSubmit,
	ChatInputTiptap,
} from "@/components/ui/tiptap-chat-input";
import {
	ChatMessage,
	ChatMessageAvatar,
	ChatMessageContent,
	ChatMessageContentArea,
	ChatMessageMetadata,
} from "@/components/ui/chat-message";
import { ChatMessageArea } from "@/components/ui/chat-message-area";
import { SidebarContent, SidebarHeader } from "@/components/ui/sidebar";
import { SidebarRight, useSidebarRight } from "@/components/ui/sidebar-right";
import { useEffect, useMemo } from "react";
import { useChatWsContext } from "../chat-main/chat-ws-provider";
import type { User } from "better-auth";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatParams } from "../chat-main/chat-params-provider";
import { Separator } from "@/components/ui/separator";
import { ChatMessageSkeleton } from "../chat-message-skeleton";
import { ChatMessagesSkeleton } from "../chat-message-skeleton";

export function ChatRoomThreadSidebar({ user }: { user: User }) {
	const { setOpen: setSidebarRightOpen, open: sidebarRightOpen } =
		useSidebarRight();

	const { roomId, threadId } = useChatParams();

	const sidebarRightDefaultOpen = !!roomId && !!threadId;

	useEffect(() => {
		if (sidebarRightDefaultOpen && !sidebarRightOpen) {
			setSidebarRightOpen(true);
		}
		if (!sidebarRightDefaultOpen && sidebarRightOpen) {
			setSidebarRightOpen(false);
		}
	}, [sidebarRightDefaultOpen, sidebarRightOpen, setSidebarRightOpen]);

	return (
		<SidebarRight>
			{!!roomId && !!threadId && <ChatRoomThreadSidebarContent user={user} />}
		</SidebarRight>
	);
}

export function ChatRoomThreadSidebarContent({ user }: { user: User }) {
	const { activeThread, handleSubmit, connectionStatus, members } =
		useChatWsContext();

	const { threadId, clearThreadId } = useChatParams();

	const isLoading =
		connectionStatus !== "ready" || activeThread.status !== "success";

	const membersWithoutCurrentUser = useMemo(
		() => members.filter((member) => member.id !== user.id),
		[members, user.id],
	);

	//console.log("activeThread", activeThread);

	return (
		<SidebarRight>
			<SidebarHeader className="flex flex-row h-16 items-center justify-between border-b px-4">
				<div className="flex flex-col">
					<div className="font-medium">Thread</div>
					<div className="text-xs text-muted-foreground">
						{activeThread.messages.length} messages
					</div>
				</div>
				<Button
					variant="ghost"
					size="icon"
					onClick={() => {
						clearThreadId();
					}}
					title="Close thread"
				>
					<X className="h-4 w-4" />
				</Button>
			</SidebarHeader>

			<SidebarContent className="flex-1 flex flex-col h-full overflow-y-auto">
				<ChatMessageArea scrollButtonAlignment="center">
					<div className="w-full p-8 space-y-4">
						{activeThread.threadMessage ? (
							<ChatMessage
								key={String(activeThread.threadMessage.id)}
								id={String(activeThread.threadMessage.id)}
							>
								<ChatMessageAvatar
									imageSrc={activeThread.threadMessage.user.image ?? undefined}
								/>
								<ChatMessageContentArea>
									<ChatMessageMetadata
										username={activeThread.threadMessage.user.name}
										createdAt={activeThread.threadMessage.createdAt}
									/>
									<ChatMessageContent
										content={activeThread.threadMessage.content}
									/>
								</ChatMessageContentArea>
							</ChatMessage>
						) : (
							isLoading && <ChatMessageSkeleton />
						)}
						<Separator className="my-4" />
						{isLoading ? (
							<ChatMessagesSkeleton />
						) : activeThread.messages.length > 0 ? (
							activeThread.messages.map((message) => (
								<ChatMessage key={String(message.id)} id={String(message.id)}>
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
							))
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
								parentId: threadId,
							});
						}}
						chatMembers={membersWithoutCurrentUser}
						disabled={isLoading}
					>
						<ChatInputTiptap />
						<ChatInputSubmit />
					</ChatInput>
				</div>
			</SidebarContent>
		</SidebarRight>
	);
}
