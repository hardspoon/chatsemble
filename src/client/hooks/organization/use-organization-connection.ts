import { useWebSocket } from "../use-web-socket";
import { useUserState } from "./use-user-state";

import type { User } from "better-auth";
import { useMainChatRoomState } from "./use-main-chat-room-state";
import { useThreadChatRoomState } from "./use-thread-chat-room-state";

export interface UseOrganizationConnectionProps {
	organizationId: string;
	roomId?: string;
	threadId?: number;
	user: User;
}

export function useOrganizationConnection({
	organizationId,
	roomId,
	threadId,
	user,
}: UseOrganizationConnectionProps) {
	const { sendMessage, connectionStatus } = useWebSocket({
		organizationId,
		onMessage: (message) => {
			userState.handleMessage(message);
			mainChatRoomState.handleMessage(message);
			chatRoomThreadState.handleMessage(message);
		},
	});

	const userState = useUserState({
		sendMessage,
		connectionStatus,
	});

	const mainChatRoomState = useMainChatRoomState({
		roomId,
		user,
		sendMessage,
		connectionStatus,
	});

	const chatRoomThreadState = useThreadChatRoomState({
		roomId,
		threadId,
		user,
		topLevelMessages: mainChatRoomState.messages,
		sendMessage,
		connectionStatus,
	});

	return {
		connectionStatus,
		userState,
		mainChatRoomState,
		chatRoomThreadState,
	};
}
