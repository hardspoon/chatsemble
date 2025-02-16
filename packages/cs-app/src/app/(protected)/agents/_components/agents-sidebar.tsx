import { useQuery } from "@tanstack/react-query";
import {
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarInput,
} from "@/components/ui/sidebar";
import { client } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { NewAgentDialog } from "./new-agent-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AgentsSidebar() {
	const { data: agentsData, isLoading } = useQuery({
		queryKey: ["agents"],
		queryFn: async () => {
			const response = await client.protected.agent.$get();
			const data = await response.json();
			return data;
		},
	});

	const router = useRouter();

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
							<ChatRoomSkeleton />
						) : agentsData && agentsData.length > 0 ? (
							agentsData.map((agent) => (
								<button
									type="button"
									onClick={() => {
										router.push(`/agents?agentId=${agent.id}`);
									}}
									key={agent.id}
									className="flex w-full items-center justify-between border-b px-4 py-3 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
								>
									<span className="font-medium">{agent.name}</span>
									<Avatar>
										<AvatarImage src={agent.image} />
										<AvatarFallback>{agent.name.charAt(0)}</AvatarFallback>
									</Avatar>
								</button>
							))
						) : (
							<div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
								No agents found
							</div>
						)}
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</>
	);
}

function ChatRoomSkeleton() {
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
