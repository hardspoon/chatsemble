import type {
	ChatRoom,
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
import { useCallback, useEffect, useReducer, useRef } from "react";

export interface UseChatWSProps {
	roomId: string | null;
	user: User;
}

// Define the chat state interface
interface ChatState {
	messages: ChatRoomMessage[];
	members: ChatRoomMember[];
	room: ChatRoom | null;
	input: string;
	connectionStatus: "disconnected" | "connecting" | "connected" | "ready";
}

// Initial state for the chat reducer
const initialChatState: ChatState = {
	messages: [],
	members: [],
	room: null,
	input: "",
	connectionStatus: "disconnected",
};

// Define action types
type ChatAction =
	| { type: "SET_CONNECTION_STATUS"; status: ChatState["connectionStatus"] }
	| { type: "SET_INPUT"; input: string }
	| { type: "ADD_MESSAGE"; message: ChatRoomMessage }
	| { type: "SET_MESSAGES"; messages: ChatRoomMessage[] }
	| { type: "SET_MEMBERS"; members: ChatRoomMember[] }
	| { type: "SET_ROOM"; room: ChatRoom }
	| { type: "RESET_STATE" };

// Chat reducer function
function chatReducer(state: ChatState, action: ChatAction): ChatState {
	switch (action.type) {
		case "SET_CONNECTION_STATUS":
			return { ...state, connectionStatus: action.status };
		case "SET_INPUT":
			return { ...state, input: action.input };
		case "ADD_MESSAGE":
			return { ...state, messages: [...state.messages, action.message] };
		case "SET_MESSAGES":
			return { ...state, messages: action.messages };
		case "SET_MEMBERS":
			return { ...state, members: action.members };
		case "SET_ROOM":
			return { ...state, room: action.room };
		case "RESET_STATE":
			return initialChatState;
		default:
			return state;
	}
}

export function useChatWS({ roomId, user }: UseChatWSProps) {
	const wsRef = useRef<WebSocket | null>(null);
	const [state, dispatch] = useReducer(chatReducer, initialChatState);

	const startWebSocket = useCallback(() => {
		if (!roomId) {
			dispatch({ type: "SET_CONNECTION_STATUS", status: "disconnected" });
			return;
		}

		dispatch({ type: "SET_CONNECTION_STATUS", status: "connecting" });

		const apiHost =
			process.env.NEXT_PUBLIC_DO_CHAT_API_HOST?.replace(/^https?:\/\//, "") ??
			"";
		const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
		const ws = new WebSocket(
			`${wsProtocol}://${apiHost}/websocket/chat-rooms/${roomId}`,
		);

		ws.onopen = () => {
			console.log("WebSocket connected");
			const wsMessage: WsMessageChatInit = {
				type: "chat-init",
			};
			sendMessage(wsMessage);
			dispatch({ type: "SET_CONNECTION_STATUS", status: "connected" });
		};

		ws.onmessage = (event) => {
			try {
				const wsMessage: WsChatOutgoingMessage = JSON.parse(event.data);

				switch (wsMessage.type) {
					case "message-broadcast": {
						const newMessage = wsMessage.message;
						dispatch({ type: "ADD_MESSAGE", message: newMessage });
						break;
					}
					case "messages-sync": {
						const newMessages = wsMessage.messages;
						dispatch({ type: "SET_MESSAGES", messages: newMessages });
						break;
					}
					case "member-sync": {
						const newMembers = wsMessage.members;
						dispatch({ type: "SET_MEMBERS", members: newMembers });
						break;
					}
					case "chat-ready": {
						dispatch({ type: "SET_CONNECTION_STATUS", status: "ready" });
						dispatch({ type: "SET_MESSAGES", messages: wsMessage.messages });
						dispatch({ type: "SET_MEMBERS", members: wsMessage.members });
						dispatch({ type: "SET_ROOM", room: wsMessage.room });
						break;
					}
				}
			} catch (error) {
				console.error("Failed to parse message:", error);
			}
		};

		ws.onerror = (error) => {
			console.error("WebSocket error:", error);
			dispatch({ type: "SET_CONNECTION_STATUS", status: "disconnected" });
		};

		ws.onclose = () => {
			dispatch({ type: "SET_CONNECTION_STATUS", status: "disconnected" });
			console.log("WebSocket closed");
		};

		wsRef.current = ws;
	}, [roomId]);

	const sendMessage = useCallback((message: WsChatIncomingMessage) => {
		wsRef.current?.send(JSON.stringify(message));
	}, []);

	// Initialize WebSocket connection when roomId changes
	useEffect(() => {
		// Close any existing connection
		if (wsRef.current) {
			wsRef.current.close();
			wsRef.current = null;
		}

		// Reset state when roomId changes
		dispatch({ type: "RESET_STATE" });

		// Start new connection if we have a roomId
		if (roomId) {
			startWebSocket();
		}

		return () => {
			if (wsRef.current) {
				wsRef.current.close();
				wsRef.current = null;
			}
		};
	}, [roomId, startWebSocket]);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			dispatch({ type: "SET_INPUT", input: e.target.value });
		},
		[],
	);

	const handleSubmit = useCallback(
		async (e?: { preventDefault?: () => void }) => {
			e?.preventDefault?.();

			if (!state.input.trim() || !roomId) {
				return;
			}

			if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
				console.error("WebSocket is not connected");
				return;
			}

			const newMessagePartial: ChatRoomMessagePartial = {
				id: nanoid(),
				content: state.input.trim(),
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
					roomId: roomId,
					role: "member",
					type: "user",
					name: user.name,
					email: user.email,
					image: user.image ?? null,
				},
			};

			sendMessage(wsMessage);
			dispatch({ type: "ADD_MESSAGE", message: newMessage });
			dispatch({ type: "SET_INPUT", input: "" });
		},
		[state.input, user, roomId, sendMessage],
	);

	return {
		...state,
		handleInputChange,
		handleSubmit,
	};
}
