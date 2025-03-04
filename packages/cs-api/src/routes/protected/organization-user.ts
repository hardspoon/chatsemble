import { globalSchema } from "@/cs-shared";
import { zValidator } from "@hono/zod-validator";
import { and, eq, not } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import type { HonoContextWithAuth } from "../../types/hono";

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
				id: globalSchema.user.id,
				name: globalSchema.user.name,
				email: globalSchema.user.email,
				image: globalSchema.user.image,
			})
			.from(globalSchema.organizationMember)
			.innerJoin(
				globalSchema.user,
				eq(globalSchema.organizationMember.userId, globalSchema.user.id),
			)
			.where(
				and(
					eq(
						globalSchema.organizationMember.organizationId,
						activeOrganizationId,
					),
					!includeUser ? not(eq(globalSchema.user.id, user.id)) : undefined,
				),
			);

		return c.json(users);
	},
);

export default app;
