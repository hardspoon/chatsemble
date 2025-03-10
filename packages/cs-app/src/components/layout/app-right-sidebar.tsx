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
	ChatMessageContentArea,
	ChatMessageMetadata,
} from "@/components/ui/chat-message";
import { ChatMessageArea } from "@/components/ui/chat-message-area";
import {
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
} from "@/components/ui/sidebar";
import { SidebarRight } from "@/components/ui/sidebar-right";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChatRoomMessage } from "@/cs-shared";
import { useState } from "react";

export function AppRightSidebar({
	...props
}: React.ComponentProps<typeof SidebarRight>) {
	const [input, setInput] = useState("");
	const [messages, setMessages] = useState<ChatRoomMessage[]>([]);
	const isLoading = false;

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setInput(e.target.value);
	};

	const handleSubmit = () => {
		if (!input.trim()) {
			return;
		}

		const newMessage: ChatRoomMessage = {
			id: Date.now(),
			content: input,
			metadata: {},
			mentions: [],
			user: {
				name: "You",
				image: "",
				id: "user",
				role: "member",
				type: "user",
				roomId: "room",
				email: "you@example.com",
			},
			createdAt: Date.now(),
		};

		setMessages([...messages, newMessage]);
		setInput("");
	};

	return (
		<SidebarRight {...props}>
			<SidebarHeader className="flex h-16 items-center justify-between border-b px-4">
				<div className="flex flex-col">
					<div className="font-medium">Thread</div>
					<div className="text-xs text-muted-foreground">
						{messages.length} messages
					</div>
				</div>
			</SidebarHeader>

			<SidebarContent>
				<div className="flex-1 flex flex-col h-full overflow-y-auto">
					<ChatMessageArea scrollButtonAlignment="center">
						<div className="px-4 py-8 space-y-4">
							{isLoading ? (
								<ChatMessageSkeleton />
							) : messages.length > 0 ? (
								messages.map((message) => (
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
				</div>
			</SidebarContent>

			<SidebarFooter className="border-t p-4">
				<ChatInput
					value={input}
					onChange={handleInputChange}
					onSubmit={handleSubmit}
				>
					<ChatInputTextArea placeholder="Type a message..." />
					<ChatInputSubmit />
				</ChatInput>
			</SidebarFooter>
		</SidebarRight>
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
