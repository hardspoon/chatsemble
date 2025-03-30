import type {
	WsChatIncomingMessage,
	WsChatOutgoingMessage,
	WsMessageChatInitRequest,
} from "@shared/types";
import { useCallback, useEffect, useRef, useState } from "react";

export type UseWebSocketConnectionStatus =
	| "disconnected"
	| "connecting"
	| "connected";

export interface UseWebSocketProps {
	roomId: string | null;
	onMessage: (message: WsChatOutgoingMessage) => void;
}

export function useWebSocket({ roomId, onMessage }: UseWebSocketProps) {
	const wsRef = useRef<WebSocket | null>(null);
	const [connectionStatus, setConnectionStatus] =
		useState<UseWebSocketConnectionStatus>("disconnected");
	const onMessageRef = useRef(onMessage);

	useEffect(() => {
		onMessageRef.current = onMessage;
	}, [onMessage]);

	const startWebSocket = useCallback((roomId: string | null) => {
		if (!roomId) {
			setConnectionStatus("disconnected");
			return;
		}

		setConnectionStatus("connecting");

		const appUrl = import.meta.env.VITE_APP_URL;

		const apiHost = appUrl?.replace(/^https?:\/\//, "") ?? "";
		const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
		const ws = new WebSocket(
			`${wsProtocol}://${apiHost}/websocket/chat-rooms/${roomId}`,
		);

		ws.onopen = () => {
			console.log("WebSocket connected");
			setConnectionStatus("connected");

			const wsMessage: WsMessageChatInitRequest = {
				type: "chat-init-request",
			};
			console.log("[startWebSocket] sending chat-init-request", wsMessage);
			sendMessage(wsMessage);
		};

		ws.onmessage = (event) => {
			try {
				const message: WsChatOutgoingMessage = JSON.parse(event.data);
				onMessageRef.current(message);
			} catch (error) {
				console.error("Failed to parse WebSocket message:", error);
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
	}, []);

	useEffect(() => {
		if (wsRef.current) {
			wsRef.current.close();
			wsRef.current = null;
		}

		setConnectionStatus("disconnected");

		if (roomId) {
			startWebSocket(roomId);
		}

		return () => {
			if (wsRef.current) {
				wsRef.current.close();
				wsRef.current = null;
			}
		};
	}, [roomId, startWebSocket]);

	const sendMessage = useCallback((message: WsChatIncomingMessage) => {
		if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
			console.log("[useWebSocket] sendMessage", message);
			wsRef.current.send(JSON.stringify(message));
		} else {
			console.error("WebSocket is not connected");
		}
	}, []);

	return { sendMessage, connectionStatus };
}
