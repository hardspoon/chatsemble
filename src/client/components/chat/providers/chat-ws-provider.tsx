"use client";

import { type UseChatProps, useChat } from "@client/hooks/chat/use-chat";
import { type ReactNode, createContext, useContext } from "react";

const ChatWsContext = createContext<ReturnType<typeof useChat> | null>(null);

interface ChatProviderProps extends UseChatProps {
	children: ReactNode;
}

export function ChatWsProvider({ children, ...props }: ChatProviderProps) {
	const chatState = useChat(props);

	return (
		<ChatWsContext.Provider value={chatState}>
			{children}
		</ChatWsContext.Provider>
	);
}

export function useChatWsContext() {
	const context = useContext(ChatWsContext);
	if (!context) {
		throw new Error("useChatWsContext must be used within a ChatWsProvider");
	}
	return context;
}
