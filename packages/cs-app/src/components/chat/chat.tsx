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
} from "@/components/ui/chat-message";
import { ChatMessageArea } from "@/components/ui/chat-message-area";
import { useState } from "react";

interface Message {
	id: string;
	content: string;
	role: "user" | "assistant";
	username: string;
}

const initialMessages: Message[] = [
	{
		id: "1",
		content: "Hi! I need help organizing my project management workflow. Can you guide me through some best practices?",
		role: "user",
		username: "John Doe",
	},
	{
		id: "2",
		content: "I'd be happy to help you with project management best practices! Here's a structured approach:\n\n#### 1. Project Initiation\n- Define clear project objectives\n- Identify key stakeholders\n- Set measurable goals\n- Create project charter\n\n#### 2. Planning Phase\n- Break down work into tasks\n- Set priorities\n- Create timeline\n- Assign responsibilities\n\nWould you like me to elaborate on any of these points?",
		role: "assistant",
		username: "AI Assistant",
	},
	{
		id: "3",
		content: "Yes, please tell me more about breaking down work into tasks. How should I approach this?",
		role: "user",
		username: "Sarah Smith",
	},
	{
		id: "4",
		content: "Breaking down work into tasks is crucial for project success. Here's a detailed approach:\n\n##### Work Breakdown Structure (WBS)\n1. **Start with major deliverables**\n   - Identify end goals\n   - List main project phases\n\n2. **Break into smaller components**\n   - Tasks should be:\n     - Specific\n     - Measurable\n     - Achievable\n     - Time-bound",
		role: "assistant",
		username: "AI Assistant",
	},
];

export function Chat() {
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
					{messages.map((message) => {
						if (message.role !== "user") {
							return (
								<ChatMessage key={message.id} id={message.id}>
									<ChatMessageAvatar />
									<ChatMessageContent 
										content={message.content} 
										username={message.username}
									/>
								</ChatMessage>
							);
						}
						return (
							<ChatMessage
								key={message.id}
								id={message.id}
								variant="bubble"
								type="outgoing"
							>
								<ChatMessageContent 
									content={message.content} 
									username={message.username}
								/>
							</ChatMessage>
						);
					})}
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
