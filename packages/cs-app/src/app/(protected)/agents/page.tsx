import { AgentEdit } from "@/components/agents/agent-edit";
import { AppHeader } from "@/components/layout/app-header";

export default function AgentsPage() {
	return (
		<div className="flex-1 flex flex-col h-full">
			<AppHeader />
			<AgentEdit />
		</div>
	);
}
