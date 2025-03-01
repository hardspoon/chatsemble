import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarInput,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import type { Agent } from "@/cs-shared";
import { client } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { NewAgentDialog } from "./new-agent-dialog";

export function AgentsSidebar() {
	const {
		data: agentsData,
		isLoading,
		error,
	} = useQuery({
		queryKey: ["agents"],
		queryFn: async () => {
			const response = await client.protected.agent.$get();

			const data = await response.json();
			return data;
		},
	});

	return (
		<>
			<SidebarHeader className="gap-3.5 border-b p-4">
				<div className="flex w-full items-center justify-between">
					<div className="text-base font-medium text-foreground">Agents</div>
					<NewAgentDialog />
				</div>
				<SidebarInput placeholder="Search chats..." />
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup className="px-0 py-0">
					<SidebarGroupContent>
						{isLoading ? (
							<AgentsSkeleton />
						) : error ? (
							<AgentsError />
						) : agentsData && agentsData.length > 0 ? (
							agentsData.map((agent) => (
								<AgentSidebarItem key={agent.id} agent={agent} />
							))
						) : (
							<AgentsEmpty />
						)}
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</>
	);
}

function AgentSidebarItem({ agent }: { agent: Agent }) {
	const router = useRouter();

	return (
		<button
			type="button"
			onClick={() => {
				router.push(`/agents?agentId=${agent.id}`);
			}}
			className="flex w-full items-center justify-between border-b px-4 py-3 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
		>
			<span className="font-medium">{agent.name}</span>
			<Avatar>
				<AvatarImage src={agent.image} />
				<AvatarFallback>{agent.name.charAt(0)}</AvatarFallback>
			</Avatar>
		</button>
	);
}

function AgentsEmpty() {
	return (
		<div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
			No agents found
		</div>
	);
}

function AgentsError() {
	return (
		<div className="flex items-center justify-center py-10 text-sm text-muted-foreground gap-2">
			<AlertCircle className="h-4 w-4" />
			Error fetching agents
		</div>
	);
}

function AgentsSkeleton() {
	return (
		<div>
			<div className="flex flex-col gap-1 border-b px-4 py-3">
				<div className="flex items-center justify-between">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-3 w-12" />
				</div>
				<Skeleton className="h-3 w-16" />
			</div>
			<div className="flex flex-col gap-1 border-b px-4 py-3">
				<div className="flex items-center justify-between">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-3 w-12" />
				</div>
				<Skeleton className="h-3 w-16" />
			</div>
			<div className="flex flex-col gap-1 border-b px-4 py-3">
				<div className="flex items-center justify-between">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-3 w-12" />
				</div>
				<Skeleton className="h-3 w-16" />
			</div>
		</div>
	);
}
