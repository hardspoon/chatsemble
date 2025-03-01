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
