import type { User } from "better-auth";
import { useMainChat } from "./use-main-chat";
import { useThreadChat } from "./use-thread-chat";
import { useWebSocket } from "./use-web-socket";

export interface UseChatProps {
	roomId: string | null;
	threadId: number | null;
	user: User;
}

export function useChat({ roomId, threadId, user }: UseChatProps) {
	const { sendMessage, connectionStatus } = useWebSocket({
		roomId,
		onMessage: (message) => {
			console.log("[useChat] onMessage", JSON.parse(JSON.stringify(message)));
			mainChat.handleMessage(message);
			threadChat.handleMessage(message);
		},
	});

	const mainChat = useMainChat({
		roomId,
		user,
		sendMessage,
		connectionStatus,
	});

	const threadChat = useThreadChat({
		roomId,
		threadId,
		user,
		topLevelMessages: mainChat.messages,
		sendMessage,
		connectionStatus,
	});

	return {
		connectionStatus,
		mainChat,
		threadChat,
	};
}
