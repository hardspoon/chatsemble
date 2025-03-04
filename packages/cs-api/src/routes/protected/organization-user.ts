import { schema as d1Schema } from "@/cs-shared";
import { eq, and, not } from "drizzle-orm";
import { Hono } from "hono";
import type { HonoContextWithAuth } from "../../types/hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const app = new Hono<HonoContextWithAuth>().get(
	"/users",
	zValidator(
		"query",
		z.object({
			includeUser: z.enum(["true", "false"]).transform((v) => v === "true"),
		}),
	),
	async (c) => {
		const db = c.get("db");
		const session = c.get("session");
		const user = c.get("user");
		const { activeOrganizationId } = session;
		const { includeUser } = c.req.valid("query");
		if (!activeOrganizationId) {
			throw new Error("Organization not set");
		}

		const users = await db
			.select({
				id: d1Schema.user.id,
				name: d1Schema.user.name,
				email: d1Schema.user.email,
				image: d1Schema.user.image,
			})
			.from(d1Schema.organizationMember)
			.innerJoin(
				d1Schema.user,
				eq(d1Schema.organizationMember.userId, d1Schema.user.id),
			)
			.where(
				and(
					eq(d1Schema.organizationMember.organizationId, activeOrganizationId),
					!includeUser ? not(eq(d1Schema.user.id, user.id)) : undefined,
				),
			);

		return c.json(users);
	},
);

export default app;
