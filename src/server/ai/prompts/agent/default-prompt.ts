import type { agentConfig as agentConfigT } from "@server/durable-objects/agent/db/schema";
import {
	getAssistantPersonaPrompt,
	getChatRoomContextPrompt,
	getCoreAssistantInstructionsPrompt,
	getResponseFormattingRulesPrompt,
	getStandardToolUsageRulesPrompt,
} from "./prompt-parts";

export function getDefaultAgentSystemPrompt({
	agentConfig,
	chatRoomId,
	threadId,
}: {
	agentConfig: typeof agentConfigT.$inferSelect;
	chatRoomId: string;
	threadId: number | null;
}): string {
	const coreContext = getCoreAssistantInstructionsPrompt();
	const persona = getAssistantPersonaPrompt(agentConfig);
	const responseRules = getResponseFormattingRulesPrompt();
	const toolRules = getStandardToolUsageRulesPrompt();
	const dynamicContext = getChatRoomContextPrompt(chatRoomId, threadId);

	return `
${coreContext}

${persona}

${responseRules}

${toolRules}

${dynamicContext}
`.trim();
}
