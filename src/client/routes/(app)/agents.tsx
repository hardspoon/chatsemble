import { AgentEdit } from "@/components/agents/agent-edit";
import { AgentNotSelected } from "@/components/agents/agent-placeholder";
import { AgentsSidebar } from "@/components/agents/agents-sidebar";
import { AppHeader, AppHeaderIcon } from "@/components/layout/app-header";
import { AppLayout } from "@/components/layout/app-layout";
import { createFileRoute } from "@tanstack/react-router";
import { Bot } from "lucide-react";
import { z } from "zod";

const chatParamsSchema = z.object({
	agentId: z.string().optional(),
});

export const Route = createFileRoute("/(app)/agents")({
	validateSearch: (search) => chatParamsSchema.parse(search),
	component: Agents,
});

function Agents() {
	return (
		<AppLayout sidebarChildren={<AgentsSidebar />}>
			<AgentsContent />
		</AppLayout>
	);
}

function AgentsContent() {
	const { agentId } = Route.useSearch();

	if (!agentId) {
		return (
			<div className="flex-1 flex flex-col h-full">
				<AppHeader>
					<AppHeaderIcon>
						<Bot />
					</AppHeaderIcon>
				</AppHeader>
				<AgentNotSelected />
			</div>
		);
	}

	return <AgentEdit agentId={agentId} />;
}
