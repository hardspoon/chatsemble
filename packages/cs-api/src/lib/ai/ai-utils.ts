import type { ChatRoomMessage } from "@/cs-shared";
import type { AgentMessage } from "../../durable-objects/agent/types";

export function chatRoomMessagesToAgentMessages(
	messages: ChatRoomMessage[],
): AgentMessage[] {
	const aiMessages: AgentMessage[] = messages.map((msg) => {
		return {
			content: msg.content,
			user: {
				id: msg.user.id,
				name: msg.user.name,
			},
		};
	});

	return aiMessages;
}
