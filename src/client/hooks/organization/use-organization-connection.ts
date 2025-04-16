import { useUserState } from "./use-user-state";
import { useWebSocket } from "../use-web-socket";

export interface UseOrganizationConnectionProps {
	organizationSlug: string;
}

export function useOrganizationConnection({
	organizationSlug,
}: UseOrganizationConnectionProps) {
	const { sendMessage, connectionStatus } = useWebSocket({
		organizationSlug,
		onMessage: (message) => {
			//console.log("[useChat] onMessage", JSON.parse(JSON.stringify(message)));
			userState.handleMessage(message);
		},
	});

	const userState = useUserState({
		sendMessage,
		connectionStatus,
	});

	return {
		connectionStatus,
		userState,
	};
}
