import { useCallback, useRef, useState } from "react";

interface Message {
	id: string;
	content: string;
	role: "user" | "assistant";
	username: string;
}

interface WsMessage {
	type: "message" | "join" | "quit";
	userId: string;
	data?: string;
}

export function useChatWS({ roomId }: { roomId: string }) {
	const wsRef = useRef<WebSocket | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [isConnected, setIsConnected] = useState(false);
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
		const ws = new WebSocket(`${wsProtocol}://${apiHost}/chat-room/ws/${roomId}`);
		wsRef.current = ws;

		ws.onopen = () => {
			console.log("WebSocket connected");
			setIsConnected(true);
			setConnectionStatus("connected");
		};

		ws.onmessage = (event) => {
			try {
				const wsMessage: WsMessage = JSON.parse(event.data);

				switch (wsMessage.type) {
					case "message":
						if (wsMessage.data) {
							const newMessage: Message = {
								id: crypto.randomUUID(),
								content: wsMessage.data,
								role: "user",
								username: wsMessage.userId,
							};
							setMessages((prev) => [...prev, newMessage]);
						}
						break;
					case "join":
						console.log(`User ${wsMessage.userId} joined`);
						break;
					case "quit":
						console.log(`User ${wsMessage.userId} left`);
						break;
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

		ws.onclose = (event) => {
			console.log("WebSocket disconnected:", event.code, event.reason);
			setIsConnected(false);
			setConnectionStatus("disconnected");
			wsRef.current = null;
		};

		return ws;
	}, [roomId]);

	const disconnect = useCallback(() => {
		if (wsRef.current) {
			wsRef.current.close();
			wsRef.current = null;
			setIsConnected(false);
			setConnectionStatus("disconnected");
		}
	}, []);

	const sendMessage = useCallback((content: string) => {
		if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
			console.error("WebSocket is not connected");
			return;
		}

		const message: WsMessage = {
			type: "message",
			userId: "current-user", // This should come from auth context
			data: content,
		};

		wsRef.current.send(JSON.stringify(message));

		// Add message to local state immediately for optimistic UI update
		const newMessage: Message = {
			id: crypto.randomUUID(),
			content,
			role: "user",
			username: "You", // This should come from auth context
		};
		setMessages((prev) => [...prev, newMessage]);
	}, []);

	return {
		messages,
		sendMessage,
		isConnected,
		connectionStatus,
		connect,
		disconnect,
	};
}
