import { getRouteApi } from "@tanstack/react-router";
import { createContext, useContext, useMemo } from "react";

interface ChatParamsContextType {
	roomId: string | null;
	threadId: number | null;
}

const ChatParamsContext = createContext<ChatParamsContextType | undefined>(
	undefined,
);

export function ChatParamsProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const route = getRouteApi("/(app)/chat");
	const { roomId, threadId } = route.useSearch();

	const value = useMemo(
		() => ({
			roomId: roomId ?? null,
			threadId: threadId ?? null,
		}),
		[roomId, threadId],
	);

	return (
		<ChatParamsContext.Provider value={{ ...value }}>
			{children}
		</ChatParamsContext.Provider>
	);
}

export function useChatParams() {
	const context = useContext(ChatParamsContext);

	if (context === undefined) {
		throw new Error("useChatParams must be used within a ChatParamsProvider");
	}

	return context;
}
