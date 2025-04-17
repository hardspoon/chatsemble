import { useUserState } from "./use-user-state";
import { useWebSocket } from "../use-web-socket";

import { useMainChatRoomState } from "./use-main-chat-room-state";
import type { User } from "better-auth";

export interface UseOrganizationConnectionProps {
	organizationSlug: string;
	roomId?: string;
	threadId?: number;
	user: User;
}

export function useOrganizationConnection({
	organizationSlug,
	roomId,
	user,
}: UseOrganizationConnectionProps) {
	const { sendMessage, connectionStatus } = useWebSocket({
		organizationSlug,
		onMessage: (message) => {
			//console.log("[useChat] onMessage", JSON.parse(JSON.stringify(message)));
			userState.handleMessage(message);
			mainChatRoomState.handleMessage(message);
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

	return {
		connectionStatus,
		userState,
		mainChatRoomState,
	};
}
