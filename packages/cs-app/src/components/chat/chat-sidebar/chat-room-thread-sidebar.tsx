"use client";

import { Button } from "@/components/ui/button";
import { ChatMessageArea } from "@/components/ui/chat-message-area";
import { Separator } from "@/components/ui/separator";
import { SidebarContent, SidebarHeader } from "@/components/ui/sidebar";
import { SidebarRight, useSidebarRight } from "@/components/ui/sidebar-right";
import {
	ChatInput,
	ChatInputSubmit,
	ChatInputTiptap,
} from "@/components/ui/tiptap-chat-input";
import type { ChatInputValue } from "@/cs-shared";
import type { User } from "better-auth";
import { X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useChatParams } from "../chat-main/chat-params-provider";
import { useChatWsContext } from "../chat-main/chat-ws-provider";
import { ChatMessageSkeleton, ChatRoomMessage } from "../chat-room-message";
import { ChatMessagesSkeleton } from "../chat-room-message";

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
			{!!roomId && !!threadId ? (
				<ChatRoomThreadSidebarContent user={user} />
			) : (
				<div className="flex-1 flex flex-col h-full w-full">
					Select a thread to start chatting
				</div>
			)}
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

	const onSubmit = (value: ChatInputValue) => {
		console.log("[ONSUBMIT]", {
			value,
			threadId,
			activeThreadId: activeThread.id,
		});
		handleSubmit({ value, threadId });
	};

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
				<ChatMessageArea scrollButtonAlignment="center" className="px-6">
					<div className="pt-8">
						{activeThread.threadMessage ? (
							<ChatRoomMessage message={activeThread.threadMessage} />
						) : (
							isLoading && <ChatMessageSkeleton />
						)}
					</div>
					<Separator className="mt-3 mb-6" />
					<div className="pb-8 space-y-4">
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
				</ChatMessageArea>
				<div className="p-4 w-full">
					<ChatInput
						onSubmit={onSubmit}
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
