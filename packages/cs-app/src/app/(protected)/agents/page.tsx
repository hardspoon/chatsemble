"use client";
import { useSearchParams } from "next/navigation";

import { AgentEdit } from "@/components/agents/agent-edit";
import { AgentNotSelected } from "@/components/agents/agent-placeholder";
import { AppHeader, AppHeaderIcon } from "@/components/layout/app-header";
import { Bot } from "lucide-react";

export default function AgentsPage() {
	const queryParams = useSearchParams();
	const agentId = queryParams.get("agentId");

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
