import type {
	ChatRoom,
	WsChatIncomingMessage,
	WsChatOutgoingMessage,
} from "@shared/types";
import { useCallback, useEffect, useState } from "react";
import type { UseWebSocketConnectionStatus } from "../use-web-socket";

export function useUserState({
	sendMessage,
	connectionStatus,
}: {
	sendMessage: (message: WsChatIncomingMessage) => void;
	connectionStatus: UseWebSocketConnectionStatus;
}) {
	const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
	const [status, setStatus] = useState<"loading" | "success" | "error">(
		"loading",
	);

	useEffect(() => {
		if (connectionStatus === "connected") {
			sendMessage({ type: "user-init-request" });
		}
	}, [connectionStatus, sendMessage]);

	const handleMessage = useCallback((wsMessage: WsChatOutgoingMessage) => {
		switch (wsMessage.type) {
			case "user-init-response":
				setChatRooms(wsMessage.chatRooms);
				setStatus("success");
				break;
			case "chat-rooms-update":
				setChatRooms(wsMessage.chatRooms);
				setStatus("success");
				break;
		}
	}, []);

	return {
		chatRooms,
		status,
		handleMessage,
	};
}
