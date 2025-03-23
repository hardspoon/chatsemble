import { Hono } from "hono";

import { type Agent, createAgentSchema, globalSchema } from "@/cs-shared";
import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";
import type { HonoContextWithAuth } from "../../types/hono";

// TODO: Add permissions check to agents routes

const app = new Hono<HonoContextWithAuth>()
	.post("/", zValidator("json", createAgentSchema), async (c) => {
		const { AGENT_DURABLE_OBJECT } = c.env;
		const db = c.get("db");
		const session = c.get("session");
		const { activeOrganizationId } = session;
		const {
			name,
			image,
			description,
			tone,
			verbosity,
			emojiUsage,
			languageStyle,
		} = c.req.valid("json");

		if (!activeOrganizationId) {
			throw new Error("Organization not set");
		}

		// Create durable object
		const agentDoId = AGENT_DURABLE_OBJECT.newUniqueId();

		const agentDo = AGENT_DURABLE_OBJECT.get(agentDoId);

		const email = `${agentDoId.toString()}@chatsemble.com`;

		await agentDo.migrate();
		await agentDo.insertAgentConfig({
			email,
			name,
			image,
			description,
			tone,
			verbosity,
			emojiUsage,
			languageStyle,
			organizationId: activeOrganizationId,
		});

		await db.insert(globalSchema.agent).values({
			id: agentDoId.toString(),
			email,
			name,
			image,
			description,
			tone,
			verbosity,
			emojiUsage,
			languageStyle,
			organizationId: activeOrganizationId,
		});

		return c.json({ agentId: agentDoId.toString() });
	})
	.put("/:id", zValidator("json", createAgentSchema), async (c) => {
		const { AGENT_DURABLE_OBJECT } = c.env;
		const db = c.get("db");
		const session = c.get("session");
		const { activeOrganizationId } = session;
		const {
			name,
			image,
			description,
			tone,
			verbosity,
			emojiUsage,
			languageStyle,
		} = c.req.valid("json");
		const { id } = c.req.param();

		if (!activeOrganizationId) {
			throw new Error("Organization not set");
		}

		const agentId = AGENT_DURABLE_OBJECT.idFromString(id);
		const agent = AGENT_DURABLE_OBJECT.get(agentId);

		await agent.updateAgentConfig({
			name,
			image,
			description,
			tone,
			verbosity,
			emojiUsage,
			languageStyle,
		});

		// Update agent record in D1
		await db
			.update(globalSchema.agent)
			.set({
				name,
				image,
				description,
				tone,
				verbosity,
				emojiUsage,
				languageStyle,
			})
			.where(
				and(
					eq(globalSchema.agent.id, id),
					eq(globalSchema.agent.organizationId, activeOrganizationId),
				),
			);

		return c.json({ success: true });
	})
	.get("/", async (c) => {
		const db = c.get("db");
		const session = c.get("session");
		const { activeOrganizationId } = session;

		if (!activeOrganizationId) {
			throw new Error("Organization not set");
		}

		const agents: Agent[] = await db
			.select()
			.from(globalSchema.agent)
			.where(eq(globalSchema.agent.organizationId, activeOrganizationId));

		return c.json(agents);
	})
	.get("/:id", async (c) => {
		const db = c.get("db");
		const session = c.get("session");
		const { activeOrganizationId } = session;
		const { id } = c.req.param();

		console.log("[GET] /agent/:id", id);

		if (!activeOrganizationId) {
			throw new Error("Organization not set");
		}

		const agent: Agent | undefined = await db
			.select()
			.from(globalSchema.agent)
			.where(
				and(
					eq(globalSchema.agent.id, id),
					eq(globalSchema.agent.organizationId, activeOrganizationId),
				),
			)
			.get();

		console.log("[GET] /agent/:id result", agent);

		if (!agent) {
			throw new Error("Agent not found");
		}

		return c.json(agent);
	});

export default app;
