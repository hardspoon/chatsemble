import type {
	ChatInputValue,
	ChatRoom,
	ChatRoomMember,
	ChatRoomMessage,
	ChatRoomMessagePartial,
	WsChatIncomingMessage,
	WsChatOutgoingMessage,
	WsMessageChatInitRequest,
	WsMessageSend,
	WsMessageThreadInitRequest,
} from "@/cs-shared";
import type { User } from "better-auth";
import { useCallback, useEffect, useReducer, useRef } from "react";

// Define the chat state interface with separate message collections
interface ChatState {
	topLevelMessages: {
		data: ChatRoomMessage[];
		status: "idle" | "loading" | "success" | "error";
	};
	// Track active thread with its own messages and status
	activeThread: {
		id: number | null;
		threadMessage: ChatRoomMessage | null;
		messages: ChatRoomMessage[];
		status: "idle" | "loading" | "success" | "error";
	};
	members: ChatRoomMember[];
	room: ChatRoom | null;
	connectionStatus: "disconnected" | "connecting" | "connected" | "ready";
}

// Initial state for the chat reducer
const initialChatState: ChatState = {
	topLevelMessages: {
		data: [],
		status: "idle",
	},
	activeThread: {
		id: null,
		threadMessage: null,
		messages: [],
		status: "idle",
	},
	members: [],
	room: null,
	connectionStatus: "disconnected",
};

// Define action types
type ChatAction =
	| { type: "SET_CONNECTION_STATUS"; status: ChatState["connectionStatus"] }
	| { type: "ADD_TOP_LEVEL_MESSAGE"; message: ChatRoomMessage }
	| { type: "SET_TOP_LEVEL_MESSAGES"; messages: ChatRoomMessage[] }
	| {
			type: "SET_TOP_LEVEL_MESSAGES_STATUS";
			status: "idle" | "loading" | "success" | "error";
	  }
	| { type: "ADD_THREAD_MESSAGE"; message: ChatRoomMessage }
	| {
			type: "SET_THREAD_MESSAGES";
			threadMessage: ChatRoomMessage;
			messages: ChatRoomMessage[];
	  }
	| {
			type: "SET_ACTIVE_THREAD";
			threadId: number | null;
			threadMessage: ChatRoomMessage | null;
	  }
	| {
			type: "SET_ACTIVE_THREAD_STATUS";
			status: "idle" | "loading" | "success" | "error";
	  }
	| { type: "SET_MEMBERS"; members: ChatRoomMember[] }
	| { type: "SET_ROOM"; room: ChatRoom }
	| { type: "RESET_STATE" };

// Chat reducer function
function chatReducer(state: ChatState, action: ChatAction): ChatState {
	switch (action.type) {
		case "SET_CONNECTION_STATUS":
			return { ...state, connectionStatus: action.status };

		case "ADD_TOP_LEVEL_MESSAGE": {
			const existingOptimisticMessage = state.topLevelMessages.data.some(
				(message) => message.id === action.message.metadata.optimisticData?.id,
			);

			if (existingOptimisticMessage) {
				return {
					...state,
					topLevelMessages: {
						...state.topLevelMessages,
						data: state.topLevelMessages.data.map((message) =>
							message.id === action.message.metadata.optimisticData?.id
								? action.message
								: message,
						),
					},
				};
			}

			return {
				...state,
				topLevelMessages: {
					...state.topLevelMessages,
					data: [...state.topLevelMessages.data, action.message],
				},
			};
		}

		case "SET_TOP_LEVEL_MESSAGES":
			return {
				...state,
				topLevelMessages: {
					...state.topLevelMessages,
					data: action.messages,
					status: "success", // Auto set to success when we have messages
				},
			};

		case "SET_TOP_LEVEL_MESSAGES_STATUS":
			return {
				...state,
				topLevelMessages: {
					...state.topLevelMessages,
					status: action.status,
				},
			};

		case "ADD_THREAD_MESSAGE": {
			// Check if this is an optimistic message that needs to be replaced
			const existingOptimisticIndex = state.activeThread.messages.findIndex(
				(message) => message.id === action.message.metadata.optimisticData?.id,
			);

			// Create updated thread messages array
			let updatedThreadMessages: ChatRoomMessage[];
			if (existingOptimisticIndex >= 0) {
				// Replace the existing optimistic message
				updatedThreadMessages = [...state.activeThread.messages];
				updatedThreadMessages[existingOptimisticIndex] = action.message;
			} else {
				// Add new message
				updatedThreadMessages = [
					...state.activeThread.messages,
					action.message,
				];
			}

			return {
				...state,
				activeThread: {
					...state.activeThread,
					messages: updatedThreadMessages,
				},
			};
		}

		case "SET_THREAD_MESSAGES":
			return {
				...state,
				activeThread: {
					...state.activeThread,
					threadMessage: action.threadMessage,
					messages: action.messages,
					status: "success",
				},
			};

		case "SET_ACTIVE_THREAD":
			return {
				...state,
				activeThread: {
					id: action.threadId,
					threadMessage: action.threadMessage,
					messages: [], // Clear messages when changing threads
					status: action.threadId !== null ? "loading" : "idle",
				},
			};

		case "SET_ACTIVE_THREAD_STATUS":
			return {
				...state,
				activeThread: {
					...state.activeThread,
					status: action.status,
				},
			};

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

export interface UseChatWSProps {
	roomId: string | null;
	threadId: number | null;
	user: User;
}

export function useChatWS({ roomId, threadId, user }: UseChatWSProps) {
	const wsRef = useRef<WebSocket | null>(null);
	const [state, dispatch] = useReducer(chatReducer, initialChatState);
	// Keep a ref to the current active thread ID to avoid closure issues
	const activeThreadIdRef = useRef<number | null>(null);

	// Handler for WebSocket messages
	const handleWebSocketMessage = useCallback(
		(event: MessageEvent) => {
			try {
				const wsMessage: WsChatOutgoingMessage = JSON.parse(event.data);

				switch (wsMessage.type) {
					case "message-broadcast": {
						const newMessage = wsMessage.message;

						// Determine if this is a top-level message or thread message
						if (newMessage.threadId === null) {
							dispatch({ type: "ADD_TOP_LEVEL_MESSAGE", message: newMessage });
						} else if (newMessage.threadId === activeThreadIdRef.current) {
							// Use the ref instead of state.activeThread.id
							dispatch({
								type: "ADD_THREAD_MESSAGE",
								message: newMessage,
							});
						}
						break;
					}
					case "member-update": {
						const newMembers = wsMessage.members;
						dispatch({ type: "SET_MEMBERS", members: newMembers });
						break;
					}
					case "chat-init-response": {
						console.log("chat-init-response", JSON.parse(JSON.stringify(wsMessage)));
						dispatch({ type: "SET_CONNECTION_STATUS", status: "ready" });
						dispatch({
							type: "SET_TOP_LEVEL_MESSAGES",
							messages: wsMessage.messages,
						});
						dispatch({ type: "SET_MEMBERS", members: wsMessage.members });
						dispatch({ type: "SET_ROOM", room: wsMessage.room });
						break;
					}
					case "thread-init-response": {
						// Only update if this response is for the current active thread
						if (wsMessage.threadId === activeThreadIdRef.current) {
							dispatch({
								type: "SET_THREAD_MESSAGES",
								threadMessage: wsMessage.threadMessage,
								messages: wsMessage.messages,
							});
						}
						break;
					}
					case "thread-message-broadcast": {
						// Only handle if it's for the current active thread
						if (wsMessage.threadId === activeThreadIdRef.current) {
							dispatch({
								type: "ADD_THREAD_MESSAGE",
								message: wsMessage.message,
							});
						}
						break;
					}
				}
			} catch (error) {
				console.error("Failed to parse message:", error);
			}
		},
		[], // No dependencies needed since we use the ref
	);

	// Start WebSocket connection
	const startWebSocket = useCallback(
		(roomId: string | null) => {
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
				dispatch({ type: "SET_CONNECTION_STATUS", status: "connected" });

				// Initialize by requesting top-level messages
				const wsMessage: WsMessageChatInitRequest = {
					type: "chat-init-request",
				};
				sendWsMessage(wsMessage);
			};

			ws.onmessage = handleWebSocketMessage;

			ws.onerror = (error) => {
				console.error("WebSocket error:", error);
				dispatch({ type: "SET_CONNECTION_STATUS", status: "disconnected" });
			};

			ws.onclose = () => {
				dispatch({ type: "SET_CONNECTION_STATUS", status: "disconnected" });
				console.log("WebSocket closed");
			};

			wsRef.current = ws;
		},
		[handleWebSocketMessage],
	);

	// Initialize WebSocket connection when roomId changes
	useEffect(() => {
		// Close any existing connection
		if (wsRef.current) {
			wsRef.current.close();
			wsRef.current = null;
		}

		// Reset state when roomId changes
		dispatch({ type: "RESET_STATE" });
		activeThreadIdRef.current = null; // Reset the ref as well

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

	const sendWsMessage = useCallback((message: WsChatIncomingMessage) => {
		if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
			wsRef.current.send(JSON.stringify(message));
		} else {
			console.error("WebSocket is not connected");
		}
	}, []);

	// Handle thread ID changes from props
	useEffect(() => {
		// We need to update the thread if either:
		// 1. The threadId has changed
		// 2. Connection status changes to 'ready' while we have an active threadId
		const threadIdChanged = threadId !== activeThreadIdRef.current;
		const connectionBecameReady =
			state.connectionStatus === "ready" &&
			threadId !== null &&
			state.activeThread.status !== "success";

		if (threadIdChanged) {
			activeThreadIdRef.current = threadId;
			console.log(
				"messages",
				JSON.parse(JSON.stringify(state.topLevelMessages.data)),
			);
			const threadMessage =
				state.topLevelMessages.data.find(
					(message) => message.id === threadId,
				) ?? null;
			console.log("threadMessage", JSON.parse(JSON.stringify(threadMessage)));
			dispatch({ type: "SET_ACTIVE_THREAD", threadId, threadMessage });
		}

		// If we have a thread ID and an active connection, fetch thread messages
		// This runs when threadId changes OR when connection becomes ready with an existing threadId
		if (
			(threadIdChanged || connectionBecameReady) &&
			threadId &&
			state.connectionStatus === "ready"
		) {
			const wsMessage: WsMessageThreadInitRequest = {
				type: "thread-init-request",
				threadId,
			};
			sendWsMessage(wsMessage);
		}
	}, [
		threadId,
		sendWsMessage,
		state.connectionStatus,
		state.activeThread.status,
		state.topLevelMessages.data,
	]);

	const handleSubmit = useCallback(
		async ({
			value,
			threadId,
		}: { value: ChatInputValue; threadId: number | null }) => {
			if (!value.content.trim() || !roomId) {
				return;
			}

			if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
				console.error("WebSocket is not connected");
				return;
			}

			const newMessagePartial: ChatRoomMessagePartial = {
				id: Date.now() + Math.random() * 10000,
				content: value.content,
				mentions: value.mentions,
				createdAt: Date.now(),
				threadId,
			};

			const wsMessage: WsMessageSend = {
				type: "message-send",
				message: newMessagePartial,
			};

			sendWsMessage(wsMessage);

			const newMessage: ChatRoomMessage = {
				...newMessagePartial,
				user: {
					id: user.id,
					roomId: roomId,
					name: user.name,
					type: "user",
					role: "member",
					email: user.email,
					image: user.image,
				},
				metadata: {
					optimisticData: {
						createdAt: newMessagePartial.createdAt,
						id: newMessagePartial.id,
					},
				},
			};

			// Determine if this is a top-level message or thread message
			if (threadId === null) {
				dispatch({ type: "ADD_TOP_LEVEL_MESSAGE", message: newMessage });
			} else {
				dispatch({
					type: "ADD_THREAD_MESSAGE",
					message: newMessage,
				});
			}
		},
		[roomId, sendWsMessage, user],
	);

	return {
		topLevelMessages: state.topLevelMessages,
		activeThread: state.activeThread,
		members: state.members,
		room: state.room,
		connectionStatus: state.connectionStatus,
		handleSubmit,
	};
}
