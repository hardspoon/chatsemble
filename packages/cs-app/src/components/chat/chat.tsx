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
import { useChatWS } from "@/hooks/use-chat-ws";
import { Button } from "@/components/ui/button";

export function Chat({ roomId }: { roomId: string }) {
	const { messages, sendMessage, isConnected, connectionStatus, connect, disconnect } = useChatWS({ roomId });

	return (
		<div className="flex-1 flex flex-col h-full overflow-y-auto">
			<div className="flex items-center gap-4">
				<Button 
					onClick={connect} 
					disabled={connectionStatus !== 'disconnected'}
				>
					Connect
				</Button>
				<Button 
					onClick={disconnect} 
					disabled={connectionStatus === 'disconnected'}
				>
					Disconnect
				</Button>
				<span className="text-sm">
					Status: {connectionStatus}
				</span>
			</div>
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
