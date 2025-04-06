import type { Workflow, WorkflowSteps } from "@shared/types";
import { eq, and, lte, asc, gte } from "drizzle-orm";
import type { DrizzleSqliteDODatabase } from "drizzle-orm/durable-sqlite";
import { workflows } from "../schema";

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
				})
				.returning();

			if (!newWorkflow) {
				throw new Error("Failed to create workflow");
			}

			return newWorkflow;
		},

		async getDueWorkflows(now: number): Promise<Workflow[]> {
			return db
				.select()
				.from(workflows)
				.where(
					and(
						eq(workflows.isActive, true),
						eq(workflows.isRecurring, true),
						lte(workflows.nextExecutionTime, now),
					),
				);
		},

		async findNextWorkflowTime(now: number): Promise<number | null> {
			const nextWorkflow = await db
				.select()
				.from(workflows)
				.where(
					and(
						eq(workflows.isActive, true),
						eq(workflows.isRecurring, true),
						gte(workflows.nextExecutionTime, now),
					),
				)
				.orderBy(asc(workflows.nextExecutionTime))
				.get();

			return nextWorkflow?.nextExecutionTime ?? null;
		},

		async updateWorkflow(id: string, data: Partial<Workflow>): Promise<void> {
			await db.update(workflows).set(data).where(eq(workflows.id, id));
		},

		async getWorkflowById(id: string): Promise<Workflow | undefined> {
			return db.select().from(workflows).where(eq(workflows.id, id)).get();
		},

		async deleteWorkflow(id: string): Promise<void> {
			await db.delete(workflows).where(eq(workflows.id, id));
		},

		async getAllWorkflows(): Promise<Workflow[]> {
			return db.select().from(workflows);
		},
	};
}
