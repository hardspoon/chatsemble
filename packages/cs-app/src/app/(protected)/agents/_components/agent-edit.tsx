"use client";

import { useSearchParams } from "next/navigation";
import { AgentPlaceholderNoAgentSelected } from "@/app/(protected)/agents/_components/agent-placeholder";
import { AgentEditForm } from "./agent-edit-form";

export function AgentEdit() {
	const queryParams = useSearchParams();
	const agentId = queryParams.get("agentId");

	if (!agentId) {
		return <AgentPlaceholderNoAgentSelected />;
	}

	return <AgentEditForm agentId={agentId} />;
}
