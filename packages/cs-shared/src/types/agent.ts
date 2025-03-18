import { z } from "zod";

const agentSchema = z.object({
	id: z.string(),
	name: z.string(),
	image: z.string(),
	systemPrompt: z.string(),
	createdAt: z.number(),
	organizationId: z.string(),
});

export const createAgentSchema = agentSchema.omit({
	id: true,
	createdAt: true,
	organizationId: true,
});

export type Agent = z.infer<typeof agentSchema>;

// AgentTool

const agentToolPartialSchema = z.object({
	toolCallId: z.string(),
	toolName: z.string(),
	args: z.record(z.any()),
});

export type AgentToolPartial = z.infer<typeof agentToolPartialSchema>;

export const agentToolCallSchema = agentToolPartialSchema.extend({
	type: z.literal("tool-call"),
});

export type AgentToolCall = z.infer<typeof agentToolCallSchema>;

export const agentToolResultSchema = agentToolPartialSchema.extend({
	type: z.literal("tool-result"),
	result: z.any(),
});

export type AgentToolResult = z.infer<typeof agentToolResultSchema>;

export const agentToolUseSchema = z.union([
	agentToolCallSchema,
	agentToolResultSchema,
]);

export type AgentToolUse = z.infer<typeof agentToolUseSchema>;
