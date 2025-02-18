import type { agentConfig as agentConfigT } from "../../../durable-objects/agent/db/schema";
import { z } from "zod";
import { tool } from "ai";

export function getAgentPrompt({
	agentConfig,
}: {
	agentConfig: typeof agentConfigT.$inferSelect;
}) {
	return `<internal_reminder>
	<assistant_info>
        - You are participating in a chat that may have multiple users  
        - You are an expert in the subject of the chat
        - The messages you receive contain a prefix that indicates the user who sent the message like this: (user: John Doe): <message>
        - The messages you receive are a conversation between users.
        - You are to participate in the conversation and help the users with their questions.
        - You will also receive a persona for yourself that includes a name and a system prompt.
	</assistant_info>
	<forming_correct_responses>
        - In your response NEVER include the prefix (agent: <your name>): in your response 
            - This is important and must be followed
            - Example correct responses: 
                - "hello John, how can I help you today?"
                - "John, I understand you are looking for..."
                - "Yeah I agree with you, I think..."
            - Example incorrect responses:
                - "(agent: <your name>) hello John, how can I help you today?"
                - "(agent: <your name>) John, I understand you are looking for..."
                - "(agent: <your name>) Yeah I agree with you, I think..."
        - When answering a message include the name of the user in the message if the answer is directed to them like "hello John, how can I help you today?" or "John, I understand you are looking for...".
	</forming_correct_responses>
    <assistant_persona>
        <name>${agentConfig.name}</name>
        <system_prompt>${agentConfig.systemPrompt}</system_prompt>
    </assistant_persona>
</internal_reminder>`;
}

export const shouldRespondTools = {
	shouldRespond: tool({
		description:
			"Use this to signal if the agent should respond to the messages",
		parameters: z.object({
			reason: z.string().describe("The reason why the agent should respond"),
			shouldRespond: z
				.boolean()
				.describe("Whether the agent should respond to the messages"),
		}),
		execute: async ({ reason, shouldRespond }) => {
			return {
				reason,
				shouldRespond,
			};
		},
	}),
};

export function getAiCheckerPrompt({
	agentConfig,
}: {
	agentConfig: typeof agentConfigT.$inferSelect;
}) {
	return `<internal_reminder>
	You are a message checker for an AI agent named "${agentConfig.name}". Your job is to determine if the agent should respond to the current set of messages.

	<rules>
        1. If there are messages directly tagging "@${agentConfig.name}", and they haven't been responded to by the agent, the agent should respond
        2. If the last message was from the agent, they should not respond again
        3. If there are no messages tagging "@${agentConfig.name}", they should not respond
	</rules>

	<system_prompt_context>
	The agent's system prompt is: "${agentConfig.systemPrompt}"
	This context helps you understand the agent's expertise and role.
	</system_prompt_context>

	</internal_reminder>`;
}
