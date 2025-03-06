"use client";

import { type UseChatWSProps, useChatWS } from "@/hooks/use-chat-ws";
import { type ReactNode, createContext, useContext } from "react";

const ChatWsContext = createContext<ReturnType<typeof useChatWS> | null>(null);

interface ChatProviderProps extends UseChatWSProps {
	children: ReactNode;
}

export function ChatWsProvider({
	children,
	roomId,
	...props
}: ChatProviderProps) {
	const chat = useChatWS({ roomId, ...props });

	return (
		<ChatWsContext.Provider value={chat}>{children}</ChatWsContext.Provider>
	);
}

export function useChatWsContext() {
	const context = useContext(ChatWsContext);
	if (!context) {
		throw new Error("useChatWsContext must be used within a ChatWsProvider");
	}
	return context;
}
