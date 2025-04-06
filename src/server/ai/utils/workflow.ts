import type { Workflow } from "@shared/types/workflow";

export function workflowToPrompt(workflow: Workflow) {
	const steps = workflow.steps.data.map((step) => step.description).join("\n");
	return `Please follow the steps below to complete the task:
		Workflow: ${workflow.goal}
		Steps:
		${steps}
	`;
}
