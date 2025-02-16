/// <reference types="@cloudflare/workers-types" />
/// <reference types="../../../worker-configuration" />

import { DurableObject } from "cloudflare:workers";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import type { ChatRoomMessage } from "@/cs-shared";
import { nanoid } from "nanoid";
import migrations from "./db/migrations/migrations";
import {
	drizzle,
	type DrizzleSqliteDODatabase,
} from "drizzle-orm/durable-sqlite";
import { migrate } from "drizzle-orm/durable-sqlite/migrator";
import { agentConfig } from "./db/schema";
import { eq } from "drizzle-orm";
export class AgentDurableObject extends DurableObject<Env> {
	storage: DurableObjectStorage;
	db: DrizzleSqliteDODatabase;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.storage = ctx.storage;
		this.db = drizzle(this.storage, { logger: false });
	}

	async migrate() {
		migrate(this.db, migrations);
	}

	async upsertAgentConfig(
		agentConfigData: Omit<typeof agentConfig.$inferSelect, "id" | "createdAt">,
	) {
		const doId = this.ctx.id.toString();
		await this.db
			.insert(agentConfig)
			.values({
				...agentConfigData,
				id: doId,
			})
			.onConflictDoUpdate({
				target: [agentConfig.id],
				set: {
					image: agentConfigData.image,
					name: agentConfigData.name,
					systemPrompt: agentConfigData.systemPrompt,
				},
			});
	}

	async getAgentConfig() {
		const config = await this.db
			.select()
			.from(agentConfig)
			.where(eq(agentConfig.id, this.ctx.id.toString()))
			.get();

		if (!config) {
			throw new Error("Agent config not found");
		}

		return config;
	}

	async generateResponse(message: string) {
		const { systemPrompt } = await this.getAgentConfig();

		const openaiClient = createOpenAI({
			baseURL: this.env.AI_GATEWAY_OPENAI_URL,
			apiKey: this.env.OPENAI_API_KEY,
		});

		const result = await generateText({
			model: openaiClient("gpt-4o-mini"),
			system: systemPrompt,
			prompt: message,
		});

		return result.text;
	}

	async createChatRoomMessage(message: string): Promise<ChatRoomMessage> {
		const result = await this.generateResponse(message);

		const agentConfig = await this.getAgentConfig();

		if (!agentConfig) {
			throw new Error("Agent config not found");
		}

		return {
			id: nanoid(),
			content: result,
			createdAt: Date.now(),
			user: {
				id: agentConfig.id,
				role: "member",
				type: "agent",
				name: agentConfig.name,
				email: "agent@chatsemble.com",
				image: agentConfig.image,
			},
		};
	}
}
