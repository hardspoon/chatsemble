import type { ChatRoomMessage } from "@/cs-shared";
import type { AgentMessage } from "../../durable-objects/agent/types";

export function chatRoomMessagesToAgentMessages(
	messages: ChatRoomMessage[],
): AgentMessage[] {
	const aiMessages: AgentMessage[] = messages.map((msg) => {
		return {
			content: msg.content,
			member: {
				id: msg.member.id,
				name: msg.member.name,
				type: msg.member.type,
			},
		};
	});

	return aiMessages;
}
