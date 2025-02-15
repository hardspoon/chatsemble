"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useChatWS } from "@/hooks/use-chat-ws";

const ChatContext = createContext<ReturnType<typeof useChatWS> | null>(null);

interface ChatProviderProps {
	children: ReactNode;
	roomId: string;
	userId: string;
}

export function ChatProvider({ children, roomId, userId }: ChatProviderProps) {
	const chat = useChatWS({
		roomId,
		userId,
	});

	return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
	const context = useContext(ChatContext);
	if (!context) {
		throw new Error("useChatContext must be used within a ChatProvider");
	}
	return context;
}
