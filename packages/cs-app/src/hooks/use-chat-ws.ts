import type {
	ChatRoomMember,
	ChatRoomMessage,
	ChatRoomMessagePartial,
	WsChatIncomingMessage,
	WsChatOutgoingMessage,
	WsMessageChatInit,
	WsMessageReceive,
} from "@/cs-shared";
import type { User } from "better-auth";
import { nanoid } from "nanoid";
import { useCallback, useEffect, useRef, useState } from "react";

//const RETRY_DELAYS = [1000, 2000, 5000, 10000]; // Increasing delays between retries in ms

export interface UseChatWSProps {
	roomId: string;
	user: User;
}

export function useChatWS({ roomId, user }: UseChatWSProps) {
	const wsRef = useRef<WebSocket | null>(null);

	const [messages, setMessages] = useState<ChatRoomMessage[]>([]);
	const [members, setMembers] = useState<ChatRoomMember[]>([]);
	const [input, setInput] = useState("");
	const [connectionStatus, setConnectionStatus] = useState<
		"disconnected" | "connecting" | "connected" | "ready"
	>("disconnected");

	const startWebSocket = useCallback(() => {
		// Get the host from env and remove http:// or https://
		const apiHost =
			process.env.NEXT_PUBLIC_DO_CHAT_API_HOST?.replace(/^https?:\/\//, "") ??
			"";
		const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
		const ws = new WebSocket(
			`${wsProtocol}://${apiHost}/websocket/chat-room/${roomId}`,
		);

		ws.onopen = () => {
			console.log("WebSocket connected");
			const wsMessage: WsMessageChatInit = {
				type: "chat-init",
			};
			sendMessage(wsMessage);
			setConnectionStatus("connected");
		};

		ws.onmessage = (event) => {
			try {
				const wsMessage: WsChatOutgoingMessage = JSON.parse(event.data);

				switch (wsMessage.type) {
					case "message-broadcast": {
						const newMessage = wsMessage.message;
						setMessages((prev) => [...prev, newMessage]);
						break;
					}
					case "messages-sync": {
						const newMessages = wsMessage.messages;
						setMessages(newMessages);
						break;
					}
					case "member-sync": {
						const newMembers = wsMessage.members;
						setMembers(newMembers);
						break;
					}
					case "chat-ready": {
						setConnectionStatus("ready");
						setMessages(wsMessage.messages);
						setMembers(wsMessage.members);
						break;
					}
				}
			} catch (error) {
				console.error("Failed to parse message:", error);
			}
		};

		ws.onerror = (error) => {
			console.error("WebSocket error:", error);
			setConnectionStatus("disconnected");
		};

		ws.onclose = () => {
			setConnectionStatus("disconnected");
			console.log("WebSocket closed");
		};

		wsRef.current = ws;
	}, [roomId]);

	const sendMessage = useCallback((message: WsChatIncomingMessage) => {
		wsRef.current?.send(JSON.stringify(message));
	}, []);

	// Initialize WebSocket connection
	useEffect(() => {
		startWebSocket();
		return () => wsRef.current?.close();
	}, [startWebSocket]);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			setInput(e.target.value);
		},
		[],
	);

	const handleSubmit = useCallback(
		async (e?: { preventDefault?: () => void }) => {
			e?.preventDefault?.();

			if (!input.trim()) {
				return;
			}

			if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
				console.error("WebSocket is not connected");
				return;
			}

			const newMessagePartial: ChatRoomMessagePartial = {
				id: nanoid(),
				content: input.trim(),
				createdAt: Date.now(),
			};

			const wsMessage: WsMessageReceive = {
				type: "message-receive",
				message: newMessagePartial,
			};

			const newMessage: ChatRoomMessage = {
				...newMessagePartial,
				user: {
					id: user.id,
					roomId,
					role: "member",
					type: "user",
					name: user.name,
					email: user.email,
					image: user.image ?? null,
				},
			};

			sendMessage(wsMessage);
			setMessages((prev) => [...prev, newMessage]);
			setInput("");
		},
		[input, user, roomId, sendMessage],
	);

	return {
		messages,
		members,
		input,
		setInput,
		handleInputChange,
		handleSubmit,
		connectionStatus,
	};
}
