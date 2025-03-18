import { z } from "zod";

export interface Agent {
	id: string;
	name: string;
	image: string;
	systemPrompt: string;
	createdAt: number;
	organizationId: string;
}

export const createAgentSchema = z.object({
	name: z.string(),
	image: z.string(),
	systemPrompt: z.string(),
});

// AgentTool
export interface AgentToolPartial {
	toolCallId: string;
	toolName: string;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	args: Record<string, any>;
}

export interface AgentToolCall extends AgentToolPartial {
	type: "tool-call";
}

export interface AgentToolResult extends AgentToolPartial {
	type: "tool-result";
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	result: any;
}

export type AgentToolUse = AgentToolCall | AgentToolResult;
