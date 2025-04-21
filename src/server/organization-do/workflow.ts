import type { WorkflowPartial } from "@shared/types";
import CronExpressionParser from "cron-parser";
import type { OrganizationDurableObject } from "./organization";
import type { ChatRoomDbServices } from "./db/services";

export class Workflows {
	private organizationDO: OrganizationDurableObject;

	constructor(organizationDO: OrganizationDurableObject) {
		this.organizationDO = organizationDO;
	}

	async scheduleNextWorkflowAlarm() {
		const now = Date.now();
		const nextTime =
			await this.organizationDO.dbServices.findNextWorkflowTime(now);
		const currentAlarm = await this.organizationDO.storage.getAlarm();
		console.log("[scheduleNextWorkflowAlarm] nextTime", nextTime);
		console.log("[scheduleNextWorkflowAlarm] currentAlarm", currentAlarm);

		if (nextTime) {
			if (currentAlarm !== nextTime) {
				console.log(
					`[Setting next alarm for ${new Date(nextTime).toISOString()}`,
				);
				this.organizationDO.storage.setAlarm(nextTime);
			} else {
				console.log(
					`Alarm already set correctly for ${new Date(nextTime).toISOString()}`,
				);
			}
		} else {
			if (currentAlarm) {
				console.log("No active tasks, deleting alarm.");
				this.organizationDO.storage.deleteAlarm();
			} else {
				console.log("No active tasks, no alarm to delete.");
			}
		}
	}

	async handleWorkflowAlarm() {
		console.log(`Alarm triggered at ${new Date().toISOString()}`);
		const now = Date.now();
		const dueWorkflows =
			await this.organizationDO.dbServices.getDueWorkflows(now);

		console.log(`Found ${dueWorkflows.length} due workflows.`);

		await Promise.all(
			dueWorkflows.map(async (workflow) => {
				console.log(`Processing workflow ${workflow.id}`);
				await this.executeWorkflow(workflow);
			}),
		);

		const chatRoomIds = dueWorkflows.map((workflow) => workflow.chatRoomId);
		const uniqueChatRoomIds = [...new Set(chatRoomIds)];

		await Promise.all(
			uniqueChatRoomIds.map(async (chatRoomId) => {
				await this.broadcastWorkflowUpdate(chatRoomId);
			}),
		);
	}

	private async executeWorkflow(workflow: WorkflowPartial) {
		console.log(
			`Executing workflow ${workflow.id} for chatroom ${workflow.chatRoomId} and agent ${workflow.agentId}`,
		);
		try {
			await this.organizationDO.agents.processAndRespondWorkflow({ workflow });

			if (workflow.isRecurring) {
				try {
					const interval = CronExpressionParser.parse(
						workflow.scheduleExpression,
						{
							tz: "UTC",
							currentDate: new Date(workflow.nextExecutionTime),
						},
					);
					const nextExecutionTime = interval.next().getTime();
					console.log(
						`Rescheduling task ${workflow.id} for ${new Date(nextExecutionTime).toISOString()}`,
					);
					await this.organizationDO.dbServices.updateWorkflow(workflow.id, {
						nextExecutionTime,
						lastExecutionTime: Date.now(),
					});
				} catch (error) {
					console.error(
						`Failed to parse schedule for recurring workflow ${workflow.id}:`,
						error,
					);
					await this.organizationDO.dbServices.updateWorkflow(workflow.id, {
						lastExecutionTime: Date.now(),
					});
				}
			} else {
				await this.organizationDO.dbServices.updateWorkflow(workflow.id, {
					lastExecutionTime: Date.now(),
					isActive: false,
				});
				console.log(`Workflow ${workflow.id} completed.`);
			}
		} catch (error) {
			console.error(`Error executing workflow ${workflow.id}:`, error);
			await this.organizationDO.dbServices.updateWorkflow(workflow.id, {
				lastExecutionTime: Date.now(),
			});
		}
	}

	async broadcastWorkflowUpdate(chatRoomId: string) {
		const workflows =
			await this.organizationDO.dbServices.getChatRoomWorkflows(chatRoomId);

		// Use the organizationDO reference to call its broadcast method
		this.organizationDO.broadcastWebSocketMessageToRoom(
			{
				type: "chat-room-workflows-update",
				roomId: chatRoomId,
				workflows,
			},
			chatRoomId,
		);
	}

	async createWorkflow(
		params: Parameters<ChatRoomDbServices["createAgentWorkflow"]>[0],
	) {
		const workflow =
			await this.organizationDO.dbServices.createAgentWorkflow(params);
		await this.broadcastWorkflowUpdate(workflow.chatRoomId);
		return workflow;
	}

	async deleteWorkflow(workflowId: string) {
		const deletedWorkflow =
			await this.organizationDO.dbServices.deleteWorkflow(workflowId);
		await this.broadcastWorkflowUpdate(deletedWorkflow.chatRoomId);
		return deletedWorkflow;
	}
}
