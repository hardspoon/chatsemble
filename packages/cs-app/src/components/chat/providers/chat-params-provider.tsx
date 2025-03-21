"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useMemo } from "react";
import type { User } from "better-auth";
interface ChatParamsContextType {
	roomId: string | null;
	threadId: number | null;
	setRoomId: (roomId: string) => void;
	setThreadId: (threadId: number | null) => void;
	clearThreadId: () => void;
	updateParams: (params: { roomId?: string; threadId?: number | null }) => void;
	user: User;
}

const ChatParamsContext = createContext<ChatParamsContextType | undefined>(
	undefined,
);

export function ChatParamsProvider({
	user,
	children,
}: {
	user: User;
	children: React.ReactNode;
}) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const roomId = searchParams.get("roomId");
	const threadIdText = searchParams.get("threadId");
	const threadId = threadIdText ? Number(threadIdText) : null;

	const updateParams = useCallback(
		(params: { roomId?: string; threadId?: number | null }) => {
			const newParams = new URLSearchParams(searchParams.toString());

			if (params.roomId !== undefined) {
				newParams.set("roomId", params.roomId);
			}

			if (params.threadId !== undefined) {
				if (params.threadId === null) {
					newParams.delete("threadId");
				} else {
					newParams.set("threadId", String(params.threadId));
				}
			}

			router.push(`/chat?${newParams.toString()}`);
		},
		[router, searchParams],
	);

	const setRoomId = useCallback(
		(newRoomId: string) => {
			updateParams({ roomId: newRoomId });
		},
		[updateParams],
	);

	const setThreadId = useCallback(
		(newThreadId: number | null) => {
			updateParams({ threadId: newThreadId });
		},
		[updateParams],
	);

	const clearThreadId = useCallback(() => {
		updateParams({ threadId: null });
	}, [updateParams]);

	const value = useMemo(
		() => ({
			roomId,
			threadId,
			setRoomId,
			setThreadId,
			clearThreadId,
			updateParams,
		}),
		[roomId, threadId, setRoomId, setThreadId, clearThreadId, updateParams],
	);

	return (
		<ChatParamsContext.Provider value={{ ...value, user }}>
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
