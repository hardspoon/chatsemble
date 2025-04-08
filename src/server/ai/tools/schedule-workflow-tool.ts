import { workflowStepSchema } from "@shared/types";
import { tool } from "ai";
import { CronExpressionParser } from "cron-parser";
import { z } from "zod";
import type { AgentDurableObject } from "../../durable-objects/agent/agent-durable-object";

export const scheduleWorkflowTool = ({
	agentInstance,
	chatRoomId,
}: {
	agentInstance: AgentDurableObject;
	chatRoomId: string;
}) =>
	tool({
		description:
			"Schedules a multi-step workflow to be executed at a specified time or recurring interval.",
		parameters: z.object({
			scheduleExpression: z
				.string()
				.describe(
					"The schedule (e.g., Date string ending with 'Z' like '2025-04-06T12:00:00Z' for one-off, CRON string like '0 9 * * 1' for recurring).",
				),
			goal: z
				.string()
				.describe(
					"The goal of the workflow, In this goal DO NOT include information about schedule like 'every Monday at 9am'.",
				),
			steps: z
				.array(workflowStepSchema)
				.describe("The JSON object defining the steps of the workflow."),
		}),
		execute: async ({ scheduleExpression, goal, steps }) => {
			try {
				let nextExecutionTime: number;
				let isRecurring: boolean;

				try {
					const interval = CronExpressionParser.parse(scheduleExpression, {
						tz: "UTC",
					});

					nextExecutionTime = interval.next().getTime();
					isRecurring = true;
				} catch (_error) {
					const date = new Date(scheduleExpression);
					if (!Number.isNaN(date.getTime())) {
						nextExecutionTime = date.getTime();
						isRecurring = false;
						if (nextExecutionTime <= Date.now()) {
							throw new Error("Scheduled time must be in the future.");
						}
					} else {
						throw new Error(
							`Invalid scheduleExpression: ${scheduleExpression}`,
						);
					}
				}

				const workflow = await agentInstance.dbServices.createWorkflow({
					goal,
					steps: {
						version: 1,
						type: "workflowSteps",
						data: steps,
					},
					scheduleExpression,
					isRecurring,
					nextExecutionTime,
					chatRoomId,
				});
				console.log("[scheduleWorkflowTool] Workflow scheduled", workflow);
				await agentInstance.scheduleNextWorkflowAlarm();

				try {
					await agentInstance.broadcastWorkflowUpdate(chatRoomId);
				} catch (error) {
					console.error("Error broadcasting workflow update:", error);
				}

				return {
					success: true,
					workflowId: workflow.id,
					nextRun: new Date(nextExecutionTime).toISOString(),
				};
			} catch (error) {
				console.error("Error scheduling workflow:", error);
				return {
					success: false,
					error: error instanceof Error ? error.message : String(error),
				};
			}
		},
	});
