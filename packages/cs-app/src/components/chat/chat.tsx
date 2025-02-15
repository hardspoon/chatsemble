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
	ChatMessageUser,
	ChatMessageContentArea,
} from "@/components/ui/chat-message";
import { ChatMessageArea } from "@/components/ui/chat-message-area";
import { useState } from "react";

interface Message {
	id: string;
	content: string;
	role: "user" | "assistant";
	username: string;
}

const initialMessages: Message[] = [];

export function Chat({ roomId }: { roomId: string }) {
	const [messages, setMessages] = useState<Message[]>(initialMessages);
	const [input, setInput] = useState("");
	const [isStreaming, setIsStreaming] = useState(false);

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setInput(e.target.value);
	};

	const handleSubmit = () => {
		if (!input.trim()) {
			return;
		}

		// Add user message
		const userMessage: Message = {
			id: String(messages.length + 1),
			content: input,
			role: "user",
			username: "John Doe", // This would come from auth context in a real app
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput("");

		// Simulate assistant response
		setTimeout(() => {
			const assistantMessage: Message = {
				id: String(messages.length + 2),
				content: "This is a placeholder response from the assistant.",
				role: "assistant",
				username: "AI Assistant",
			};
			setMessages((prev) => [...prev, assistantMessage]);
		}, 1000);
	};

	const handleStop = () => {
		setIsStreaming(false);
	};

	return (
		<div className="flex-1 flex flex-col h-full overflow-y-auto">
			<ChatMessageArea scrollButtonAlignment="center">
				<div className="max-w-2xl mx-auto w-full px-4 py-8 space-y-4">
					{messages.length > 0 ? (
						messages.map((message) => {
							return (
								<ChatMessage key={message.id} id={message.id}>
									<ChatMessageAvatar />
									<ChatMessageContentArea>
										<ChatMessageUser username={message.username} />
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
					loading={isStreaming}
					onStop={handleStop}
				>
					<ChatInputTextArea placeholder="Type a message..." />
					<ChatInputSubmit />
				</ChatInput>
			</div>
		</div>
	);
}
