import { z } from "zod";

export const toneOptions = [
	"formal",
	"casual",
	"friendly",
	"professional",
] as const;
export type Tone = (typeof toneOptions)[number];

export const verbosityOptions = ["concise", "detailed", "adaptive"] as const;
export type Verbosity = (typeof verbosityOptions)[number];

export const emojiUsageOptions = ["none", "occasional", "frequent"] as const;
export type EmojiUsage = (typeof emojiUsageOptions)[number];

export const languageStyleOptions = [
	"simple",
	"technical",
	"industry-specific",
] as const;
export type LanguageStyle = (typeof languageStyleOptions)[number];

export interface Agent {
	id: string;
	// Identity
	name: string;
	image: string;
	description: string;
	// Personality
	tone: Tone;
	verbosity: Verbosity;
	emojiUsage: EmojiUsage;
	languageStyle: LanguageStyle;
	// Metadata
	organizationId: string;
	createdAt: number;
}

export const createAgentSchema = z.object({
	// Identity
	name: z.string().min(1, "Name is required"),
	image: z.string(),
	description: z.string().min(1, "Description is required"),

	// Personality
	tone: z.enum(toneOptions),
	verbosity: z.enum(verbosityOptions),
	emojiUsage: z.enum(emojiUsageOptions),
	languageStyle: z.enum(languageStyleOptions),
});

export type AgentFormValues = z.infer<typeof createAgentSchema>;

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
