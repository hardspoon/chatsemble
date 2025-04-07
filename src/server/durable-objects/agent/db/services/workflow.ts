import type { Workflow, WorkflowPartial, WorkflowSteps } from "@shared/types";
import { and, asc, eq, gte, lte } from "drizzle-orm";
import type { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { agentConfig, workflows } from "../schema";

export function createWorkflowService(db: DrizzleSqliteDODatabase) {
	return {
		async createWorkflow({
			goal,
			steps,
			scheduleExpression,
			isRecurring,
			nextExecutionTime,
			chatRoomId,
		}: {
			goal: string;
			steps: WorkflowSteps;
			scheduleExpression: string;
			isRecurring: boolean;
			nextExecutionTime: number;
			chatRoomId: string;
		}): Promise<Workflow> {
			const config = await db.select().from(agentConfig).get();
			if (!config) {
				throw new Error("Agent config not found");
			}
			const [newWorkflow] = await db
				.insert(workflows)
				.values({
					goal,
					steps,
					chatRoomId,
					isActive: true,
					isRecurring,
					scheduleExpression,
					nextExecutionTime,
					agentId: config.id,
				})
				.returning();

			if (!newWorkflow) {
				throw new Error("Failed to create workflow");
			}

			const workflow = await this.getWorkflow(newWorkflow.id);

			return workflow;
		},

		async getWorkflow(id: string): Promise<Workflow> {
			const workflow = await db
				.select()
				.from(workflows)
				.where(eq(workflows.id, id))
				.get();
			if (!workflow) {
				throw new Error("Workflow not found");
			}
			const config = await db.select().from(agentConfig).get();
			if (!config) {
				throw new Error("Agent config not found");
			}
			return {
				...workflow,
				agent: {
					id: config.id,
					name: config.name,
					email: config.email,
					image: config.image,
					role: "member",
					type: "agent",
					roomId: workflow.chatRoomId,
				},
			};
		},

		async getWorkflows(): Promise<Workflow[]> {
			const config = await db.select().from(agentConfig).get();
			if (!config) {
				throw new Error("Agent config not found");
			}
			const workflowsResult = await db.select().from(workflows);
			return workflowsResult.map((workflow) => ({
				...workflow,
				agent: {
					id: config.id,
					name: config.name,
					email: config.email,
					image: config.image,
					role: "member",
					type: "agent",
					organizationId: config.organizationId,
					roomId: workflow.chatRoomId,
				},
			}));
		},

		async getDueWorkflows(now: number): Promise<WorkflowPartial[]> {
			const workflowsResult = await db
				.select()
				.from(workflows)
				.where(
					and(
						eq(workflows.isActive, true),
						lte(workflows.nextExecutionTime, now),
					),
				);

			return workflowsResult;
		},

		async findNextWorkflowTime(now: number): Promise<number | null> {
			const nextWorkflow = await db
				.select()
				.from(workflows)
				.where(
					and(
						eq(workflows.isActive, true),
						gte(workflows.nextExecutionTime, now),
					),
				)
				.orderBy(asc(workflows.nextExecutionTime))
				.get();

			return nextWorkflow?.nextExecutionTime ?? null;
		},

		async updateWorkflow(
			id: string,
			data: Partial<WorkflowPartial>,
		): Promise<void> {
			await db.update(workflows).set(data).where(eq(workflows.id, id));
		},

		async deleteWorkflow(id: string): Promise<void> {
			await db.delete(workflows).where(eq(workflows.id, id));
		},
	};
}
