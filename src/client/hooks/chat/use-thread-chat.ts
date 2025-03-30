import { updateMessageList } from "@client/lib/chat";
import type {
	ChatInputValue,
	ChatRoomMessage,
	WsChatIncomingMessage,
	WsChatOutgoingMessage,
	WsMessageSend,
	WsMessageThreadInitRequest,
} from "@shared/types";
import type { User } from "better-auth";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	createChatRoomMessagePartial,
	createChatRoomOptimisticMessage,
} from "../../../shared/lib/chat";
import type { UseWebSocketConnectionStatus } from "./use-web-socket";

export function useThreadChat({
	roomId,
	threadId,
	user,
	topLevelMessages,
	sendMessage,
	connectionStatus,
}: {
	roomId: string | null;
	threadId: number | null;
	user: User;
	topLevelMessages: ChatRoomMessage[];
	sendMessage: (message: WsChatIncomingMessage) => void;
	connectionStatus: UseWebSocketConnectionStatus;
}) {
	const [threadMessage, setThreadMessage] = useState<ChatRoomMessage | null>(
		null,
	);
	const [messages, setMessages] = useState<ChatRoomMessage[]>([]);
	const [status, setStatus] = useState<
		"idle" | "loading" | "success" | "error"
	>("idle");
	const isLoadingRef = useRef(false);
	const activeThreadIdRef = useRef<number | null>(null);

	const handleMessage = useCallback(
		(wsMessage: WsChatOutgoingMessage) => {
			if (threadId === null) {
				return;
			}

			switch (wsMessage.type) {
				case "message-broadcast":
					if (wsMessage.message.id === threadId) {
						setThreadMessage(wsMessage.message);
					} else if (wsMessage.message.threadId === threadId) {
						setMessages((prev) =>
							updateMessageList({
								messages: prev,
								newMessage: wsMessage.message,
							}),
						);
					}
					break;
				case "thread-init-response":
					if (wsMessage.threadId === threadId) {
						setThreadMessage(wsMessage.threadMessage);
						setMessages(wsMessage.messages);
						setStatus("success");
						isLoadingRef.current = false;
					}
					break;
			}
		},
		[threadId],
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
				threadId,
			});

			const wsMessage: WsMessageSend = {
				type: "message-send",
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
			setStatus("idle");
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
			activeThreadIdRef.current = threadId;
			console.log("messages", JSON.parse(JSON.stringify(topLevelMessages)));
			const threadMessage =
				topLevelMessages.find((message) => message.id === threadId) ?? null;
			console.log("threadMessage", JSON.parse(JSON.stringify(threadMessage)));
			setThreadMessage(threadMessage);
			setStatus("loading");
		}

		if (
			(threadIdChanged || connectionBecameReady) &&
			threadId &&
			connectionStatus === "connected"
		) {
			const wsMessage: WsMessageThreadInitRequest = {
				type: "thread-init-request",
				threadId,
			};
			sendMessage(wsMessage);
		}
	}, [threadId, sendMessage, connectionStatus, topLevelMessages, status]);

	return {
		threadMessage,
		messages,
		status,
		handleSubmit,
		handleMessage,
	};
}
