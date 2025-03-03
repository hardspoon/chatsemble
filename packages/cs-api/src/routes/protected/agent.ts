import { Hono } from "hono";

import { type Agent, createAgentSchema, schema as d1Schema } from "@/cs-shared";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import type { HonoContextWithAuth } from "../../types/hono";

const app = new Hono<HonoContextWithAuth>()
	.post("/create", zValidator("json", createAgentSchema), async (c) => {
		const { AGENT_DURABLE_OBJECT } = c.env;
		const db = c.get("db");
		const session = c.get("session");
		const { activeOrganizationId } = session;
		const { name, image, systemPrompt } = c.req.valid("json");

		if (!activeOrganizationId) {
			throw new Error("Organization not set");
		}

		// Create durable object
		const agentDoId = AGENT_DURABLE_OBJECT.newUniqueId();

		const agentDo = AGENT_DURABLE_OBJECT.get(agentDoId);

		await agentDo.migrate();
		await agentDo.upsertAgentConfig({
			name,
			image,
			systemPrompt,
			organizationId: activeOrganizationId,
		});

		await db.insert(d1Schema.agent).values({
			id: agentDoId.toString(),
			name,
			image,
			systemPrompt,
			organizationId: activeOrganizationId,
		});

		return c.json({ agentId: agentDoId.toString() });
	})
	.put("/:id", zValidator("json", createAgentSchema), async (c) => {
		const { AGENT_DURABLE_OBJECT } = c.env;
		const db = c.get("db");
		const session = c.get("session");
		const { activeOrganizationId } = session;
		const { name, image, systemPrompt } = c.req.valid("json");
		const { id } = c.req.param();

		if (!activeOrganizationId) {
			throw new Error("Organization not set");
		}

		const agentId = AGENT_DURABLE_OBJECT.idFromString(id);
		const agent = AGENT_DURABLE_OBJECT.get(agentId);

		await agent.upsertAgentConfig({
			name,
			image,
			systemPrompt,
			organizationId: activeOrganizationId,
		});

		// Update agent record in D1
		await db
			.update(d1Schema.agent)
			.set({
				name,
				image,
				systemPrompt,
			})
			.where(
				eq(d1Schema.agent.id, id) &&
					eq(d1Schema.agent.organizationId, activeOrganizationId),
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
			.from(d1Schema.agent)
			.where(eq(d1Schema.agent.organizationId, activeOrganizationId));

		return c.json(agents);
	})
	.get("/:id", async (c) => {
		const db = c.get("db");
		const session = c.get("session");
		const { activeOrganizationId } = session;
		const { id } = c.req.param();

		if (!activeOrganizationId) {
			throw new Error("Organization not set");
		}

		const agent: Agent | undefined = await db
			.select()
			.from(d1Schema.agent)
			.where(
				eq(d1Schema.agent.id, id) &&
					eq(d1Schema.agent.organizationId, activeOrganizationId),
			)
			.get();

		if (!agent) {
			return c.json({ error: "Agent not found" }, 404);
		}

		return c.json(agent);
	});

export default app;
