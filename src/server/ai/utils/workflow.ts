import type { WorkflowPartial } from "@shared/types/workflow";

export function workflowToPrompt(workflow: WorkflowPartial) {
	const steps = workflow.steps.data.map((step) => step.description).join("\n");
	return `Please follow the steps below to complete the task:
		Workflow: ${workflow.goal}
		Steps:
		${steps}
	`;
}
