"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
} from "@/components/ui/sidebar";
import { useState } from "react";
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

interface Message {
	id: string;
	content: string;
	user: {
		name: string;
		image?: string;
	};
	createdAt: number;
	isCurrentUser: boolean;
}

// This is a placeholder component that will be replaced with actual data
const mockMessages: Message[] = [
	{
		id: "1",
		content: "Hey there! How's the project coming along?",
		user: {
			name: "Alex Johnson",
			image: "",
		},
		createdAt: Date.now() - 1000 * 60 * 5, // 5 minutes ago
		isCurrentUser: false,
	},
	{
		id: "2",
		content: "Making good progress. Just finishing up the UI components.",
		user: {
			name: "You",
			image: "",
		},
		createdAt: Date.now() - 1000 * 60 * 3, // 3 minutes ago
		isCurrentUser: true,
	},
	{
		id: "3",
		content: "Great! Can you share a preview when you're done?",
		user: {
			name: "Alex Johnson",
			image: "",
		},
		createdAt: Date.now() - 1000 * 60 * 1, // 1 minute ago
		isCurrentUser: false,
	},
	{
		id: "4",
		content: "Sure thing. I'll have something to show by end of day.",
		user: {
			name: "You",
			image: "",
		},
		createdAt: Date.now() - 1000 * 30, // 30 seconds ago
		isCurrentUser: true,
	},
	{
		id: "5",
		content: "I'm running into some issues with the backend. Any thoughts?",
		user: {
			name: "Alex Johnson",
			image: "",
		},
		createdAt: Date.now() - 1000 * 20, // 20 seconds ago
		isCurrentUser: false,
	},
	{
		id: "6",
		content: "I'm running into some issues with the backend. Any thoughts?",
		user: {
			name: "Alex Johnson",
			image: "",
		},
		createdAt: Date.now() - 1000 * 10, // 10 seconds ago
		isCurrentUser: false,
	},
	{
		id: "7",
		content: "I'm running into some issues with the backend. Any thoughts?",
		user: {
			name: "Alex Johnson",
			image: "",
		},
		createdAt: Date.now() - 1000 * 5, // 5 seconds ago
		isCurrentUser: false,
	},
	{
		id: "8",
		content: "I'm running into some issues with the backend. Any thoughts?",
		user: {
			name: "Alex Johnson",
			image: "",
		},
		createdAt: Date.now() - 1000 * 2, // 2 seconds ago
		isCurrentUser: false,
	},
	{
		id: "9",
		content:
			"I'm running into some issues with the backend. Any thoughts? Not now, I'm busy. Do you have any other questions? Can you send me the code? Do you need help with anything else?",
		user: {
			name: "Alex Johnson",
			image: "",
		},
		createdAt: Date.now() - 1000 * 1, // 1 second ago
		isCurrentUser: false,
	},
];

export function AppRightSidebar({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	const [input, setInput] = useState("");
	const [messages, setMessages] = useState<Message[]>(mockMessages);
	const isLoading = false;

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setInput(e.target.value);
	};

	const handleSubmit = () => {
		if (!input.trim()) {
			return;
		}

		const newMessage: Message = {
			id: Date.now().toString(),
			content: input,
			user: {
				name: "You",
				image: "",
			},
			createdAt: Date.now(),
			isCurrentUser: true,
		};

		setMessages([...messages, newMessage]);
		setInput("");
	};

	return (
		<Sidebar
			side="right"
			collapsible="none"
			className="sticky hidden lg:flex top-0 h-svh border-l"
			style={
				{
					"--sidebar-width": "30rem",
				} as React.CSSProperties
			}
			{...props}
		>
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
		</Sidebar>
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
