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
			const user = c.get("user");
			const { activeOrganizationId } = session;
			const { name, image, systemPrompt } = c.req.valid("json");

			console.log({
				reason: "Creating new agent",
				activeOrganizationId,
				agentName: name,
				agentImage: image,
				agentSystemPrompt: systemPrompt,
				userId: user.id,
				userEmail: user.email,
			});

			if (!activeOrganizationId) {
				throw new Error("Organization not set");
			}

			// Create durable object
			const id = AGENT_DURABLE_OBJECT.newUniqueId();
			console.log({
				reason: "Creating new agent durable object",
				agentId: id.toString(),
			});
			const agent = AGENT_DURABLE_OBJECT.get(id);
			console.log({
				reason: "Migrating agent",
				agentId: id.toString(),
			});

			await agent.migrate();
			await agent.upsertAgentConfig({
				name,
				image,
				systemPrompt,
				organizationId: activeOrganizationId,
			});

			console.log({
				reason: "Inserting agent into D1",
				agentId: id.toString(),
			});

			await db.insert(d1Schema.agent).values({
				id: id.toString(),
				name,
				image,
				systemPrompt,
				organizationId: activeOrganizationId,
			});

			console.log({
				reason: "Creating new agent response",
				agentId: id.toString(),
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
			const { AGENT_DURABLE_OBJECT } = c.env;
			const db = c.get("db");
			const session = c.get("session");
			const user = c.get("user");
			const { activeOrganizationId } = session;
			const { name, image, systemPrompt } = c.req.valid("json");
			const { id } = c.req.param();

			console.log({
				reason: "Updating agent",
				activeOrganizationId,
				agentId: id,
				agentName: name,
				agentImage: image,
				agentSystemPrompt: systemPrompt,
				userId: user.id,
				userEmail: user.email,
			});

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

			console.log({
				reason: "Updating agent response",
				success: true,
			});

			return c.json({ success: true });
		},
	)
	.get("/", async (c) => {
		const db = c.get("db");
		const session = c.get("session");
		const user = c.get("user");
		const { activeOrganizationId } = session;

		console.log({
			reason: "Listing all agents",
			activeOrganizationId,
			userId: user.id,
			userEmail: user.email,
		});

		if (!activeOrganizationId) {
			throw new Error("Organization not set");
		}

		console.log({
			reason: "About to query agents",
			activeOrganizationId,
		});

		const agents = await db
			.select()
			.from(d1Schema.agent)
			.where(eq(d1Schema.agent.organizationId, activeOrganizationId));

		console.log({
			reason: "Listing all agents response",
			agents,
		});

		return c.json(agents);
	})
	.get("/:id", async (c) => {
		const db = c.get("db");
		const session = c.get("session");
		const user = c.get("user");
		const { activeOrganizationId } = session;
		const { id } = c.req.param();

		console.log({
			reason: "Getting agent details",
			activeOrganizationId,
			agentId: id,
			userId: user.id,
			userEmail: user.email,
		});

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

		console.log({
			reason: "Getting agent details response",
			agent,
		});

		if (!agent) {
			return c.json({ error: "Agent not found" }, 404);
		}

		return c.json(agent);
	});

export default app;
