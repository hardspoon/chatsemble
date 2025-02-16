import { Hono } from "hono";
import { z } from "zod";

import type { HonoVariables } from "../../types/hono";
import { schema as d1Schema } from "@/cs-shared";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";

const app = new Hono<HonoVariables>()
	.post(
		"/create",
		zValidator(
			"json",
			z.object({
				name: z.string().min(1),
				image: z.string().min(1),
				systemPrompt: z.string().min(1),
			}),
		),
		async (c) => {
			const { AGENT_DURABLE_OBJECT } = c.env;
			const db = c.get("db");
			const session = c.get("session");
			const { activeOrganizationId } = session;
			const { name, image, systemPrompt } = c.req.valid("json");

			if (!activeOrganizationId) {
				throw new Error("Organization not set");
			}

			// Create durable object
			const id = AGENT_DURABLE_OBJECT.newUniqueId();
			const agent = AGENT_DURABLE_OBJECT.get(id);

			await agent.upsertAgentConfig({
				name,
				image,
				systemPrompt,
				organizationId: activeOrganizationId,
			});

			await db.insert(d1Schema.agent).values({
				id: id.toString(),
				name,
				image,
				systemPrompt,
				organizationId: activeOrganizationId,
			});

			return c.json({ agentId: id.toString() });
		},
	)
	.put(
		"/:id",
		zValidator(
			"json",
			z.object({
				name: z.string().min(1),
				image: z.string().min(1),
				systemPrompt: z.string().min(1),
			}),
		),
		async (c) => {
			const db = c.get("db");
			const session = c.get("session");
			const { activeOrganizationId } = session;
			const { name, image, systemPrompt } = c.req.valid("json");
			const { id } = c.req.param();

			if (!activeOrganizationId) {
				throw new Error("Organization not set");
			}

			console.log("update agent", id, name, image, systemPrompt);

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
		},
	)
	.get("/", async (c) => {
		const db = c.get("db");
		const session = c.get("session");
		const { activeOrganizationId } = session;

		if (!activeOrganizationId) {
			throw new Error("Organization not set");
		}

		const agents = await db
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

		const agent = await db
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
