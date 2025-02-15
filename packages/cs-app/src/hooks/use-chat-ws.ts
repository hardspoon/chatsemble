import { useCallback, useRef, useState, useEffect } from "react";
import type {
	ChatRoomMessage,
	ChatRoomMessagePartial,
	WsChatRoomMessage,
} from "@/cs-shared";
import { nanoid } from "nanoid";
import type { User } from "better-auth";

const RETRY_DELAYS = [1000, 2000, 5000, 10000]; // Increasing delays between retries in ms

export interface UseChatWSProps {
	roomId: string;
	user: User;
}

export function useChatWS({ roomId, user }: UseChatWSProps) {
	const wsRef = useRef<WebSocket | null>(null);
	const [messages, setMessages] = useState<ChatRoomMessage[]>([]);
	const [input, setInput] = useState("");
	const retryCountRef = useRef(0);
	const retryTimeoutRef = useRef<NodeJS.Timeout>();

	const [connectionStatus, setConnectionStatus] = useState<
		"disconnected" | "connecting" | "connected"
	>("disconnected");

	const connect = useCallback(() => {
		if (wsRef.current) {
			console.log("WebSocket already exists");
			return;
		}

		setConnectionStatus("connecting");

		// Get the host from env and remove http:// or https://
		const apiHost =
			process.env.NEXT_PUBLIC_DO_CHAT_API_HOST?.replace(/^https?:\/\//, "") ??
			"";
		const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
		const ws = new WebSocket(
			`${wsProtocol}://${apiHost}/chat-room/ws/${roomId}`,
		);
		wsRef.current = ws;

		ws.onopen = () => {
			console.log("WebSocket connected");
			setConnectionStatus("connected");
			retryCountRef.current = 0; // Reset retry count on successful connection
		};

		ws.onmessage = (event) => {
			try {
				const wsMessage: WsChatRoomMessage = JSON.parse(event.data);

				switch (wsMessage.type) {
					case "message-broadcast": {
						const newMessage = wsMessage.message;
						setMessages((prev) => [...prev, newMessage]);
						break;
					}
					case "messages-sync": {
						const newMessages = wsMessage.messages;
						setMessages((prev) => [...prev, ...newMessages]);
						break;
					}
					default:
						console.warn("Unknown message type:", wsMessage.type);
				}
			} catch (error) {
				console.error("Failed to parse message:", error);
			}
		};

		ws.onerror = (error) => {
			console.error("WebSocket error:", error);
			setConnectionStatus("disconnected");
			wsRef.current = null;
			ws.close();
		};

		ws.onclose = () => {
			setConnectionStatus("disconnected");
			wsRef.current = null;

			// Implement retry logic
			const retryDelay =
				RETRY_DELAYS[retryCountRef.current] ??
				RETRY_DELAYS[RETRY_DELAYS.length - 1];

			if (retryCountRef.current < RETRY_DELAYS.length) {
				console.log(`Reconnecting in ${retryDelay}ms...`);
				retryTimeoutRef.current = setTimeout(() => {
					retryCountRef.current += 1;
					connect();
				}, retryDelay);
			}
		};

		return ws;
	}, [roomId]);

	const disconnect = useCallback(() => {
		if (retryTimeoutRef.current) {
			clearTimeout(retryTimeoutRef.current);
			retryTimeoutRef.current = undefined;
		}

		if (wsRef.current) {
			wsRef.current.close();
			wsRef.current = null;
			setConnectionStatus("disconnected");
		}
		retryCountRef.current = 0; // Reset retry count on manual disconnect
	}, []);

	// Auto-connect when the hook is initialized
	useEffect(() => {
		connect();
		return () => {
			disconnect();
		};
	}, [connect, disconnect]);

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

			const wsMessage: WsChatRoomMessage = {
				type: "message-receive",
				message: newMessagePartial,
			};

			const newMessage: ChatRoomMessage = {
				...newMessagePartial,
				user: {
					id: user.id,
					role: "member",
					name: user.name,
					email: user.email,
					image: user.image ?? null,
				},
			};

			wsRef.current.send(JSON.stringify(wsMessage));
			setMessages((prev) => [...prev, newMessage]);
			setInput("");
		},
		[input, user],
	);

	return {
		messages,
		input,
		setInput,
		handleInputChange,
		handleSubmit,
		connectionStatus,
		connect,
		disconnect,
	};
}
