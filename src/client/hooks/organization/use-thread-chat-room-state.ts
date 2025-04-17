import { updateMessageList } from "@client/lib/chat";
import {
	createChatRoomMessagePartial,
	createChatRoomOptimisticMessage,
} from "@shared/lib/chat";
import type {
	ChatInputValue,
	ChatRoomMessage,
	WsChatIncomingMessage,
	WsChatOutgoingMessage,
	WsMessageChatRoomMessageSend,
	WsMessageChatRoomThreadInitRequest,
} from "@shared/types";
import type { User } from "better-auth";
import { useCallback, useEffect, useRef, useState } from "react";
import type { UseWebSocketConnectionStatus } from "@client/hooks/use-web-socket";

export function useThreadChatRoomState({
	roomId,
	threadId,
	user,
	topLevelMessages,
	sendMessage,
	connectionStatus,
}: {
	roomId: string | undefined;
	threadId: number | undefined;
	user: User;
	topLevelMessages: ChatRoomMessage[];
	sendMessage: (message: WsChatIncomingMessage) => void;
	connectionStatus: UseWebSocketConnectionStatus;
}) {
	const [threadMessage, setThreadMessage] = useState<ChatRoomMessage | null>(
		null,
	);
	const [messages, setMessages] = useState<ChatRoomMessage[]>([]);
	const [status, setStatus] = useState<"loading" | "success" | "error">(
		"loading",
	);
	const isLoadingRef = useRef(false);
	const activeThreadIdRef = useRef<number | null>(null);

	const handleMessage = useCallback(
		(wsMessage: WsChatOutgoingMessage) => {
			if (threadId === null) {
				return;
			}

			switch (wsMessage.type) {
				case "chat-room-thread-init-response": {
					console.log("chat-room-thread-init-response", wsMessage);
					if (wsMessage.roomId === roomId && wsMessage.threadId === threadId) {
						setThreadMessage(wsMessage.threadMessage);
						setMessages(wsMessage.messages);
						setStatus("success");
						isLoadingRef.current = false;
					}
					break;
				}
				case "chat-room-message-broadcast": {
					if (
						wsMessage.roomId === roomId &&
						wsMessage.message.id === threadId
					) {
						setThreadMessage(wsMessage.message);
					} else if (
						wsMessage.roomId === roomId &&
						wsMessage.message.threadId === threadId
					) {
						setMessages((prev) =>
							updateMessageList({
								messages: prev,
								newMessage: wsMessage.message,
							}),
						);
					}
					break;
				}
			}
		},
		[roomId, threadId],
	);

	const handleSubmit = useCallback(
		({ value }: { value: ChatInputValue }) => {
			if (
				!value.content.trim() ||
				!roomId ||
				connectionStatus !== "connected" ||
				threadId === null
			) {
				return;
			}

			const newMessagePartial = createChatRoomMessagePartial({
				content: value.content,
				mentions: value.mentions,
				toolUses: [],
				threadId: threadId ?? null,
			});

			const wsMessage: WsMessageChatRoomMessageSend = {
				type: "chat-room-message-send",
				roomId,
				threadId: threadId ?? null,
				message: newMessagePartial,
			};

			sendMessage(wsMessage);

			const newMessage = createChatRoomOptimisticMessage({
				message: newMessagePartial,
				user,
				roomId,
			});

			setMessages((prev) =>
				updateMessageList({
					messages: prev,
					newMessage,
					addAsNew: true,
				}),
			);
		},
		[roomId, threadId, user, connectionStatus, sendMessage],
	);

	useEffect(() => {
		if (!threadId) {
			setThreadMessage(null);
			setMessages([]);
			setStatus("loading");
			activeThreadIdRef.current = null;
		}
	}, [threadId]);

	useEffect(() => {
		// We need to update the thread if either:
		// 1. The threadId has changed
		// 2. Connection status changes to 'ready' while we have an active threadId
		const threadIdChanged = threadId !== activeThreadIdRef.current;
		const connectionBecameReady =
			connectionStatus === "connected" &&
			threadId !== null &&
			status !== "success";

		if (threadIdChanged) {
			activeThreadIdRef.current = threadId ?? null;
			const threadMessage =
				topLevelMessages.find((message) => message.id === threadId) ?? null;
			setThreadMessage(threadMessage);
			setStatus("loading");
		}

		if (
			(threadIdChanged || connectionBecameReady) &&
			threadId &&
			roomId &&
			connectionStatus === "connected"
		) {
			const wsMessage: WsMessageChatRoomThreadInitRequest = {
				type: "chat-room-thread-init-request",
				roomId,
				threadId,
			}; // TODO: This is being sent twice
			sendMessage(wsMessage);
		}
	}, [
		threadId,
		sendMessage,
		connectionStatus,
		topLevelMessages,
		status,
		roomId,
	]);

	return {
		threadMessage,
		messages,
		status,
		handleSubmit,
		handleMessage,
	};
}
