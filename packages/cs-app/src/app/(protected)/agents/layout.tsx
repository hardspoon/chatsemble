import { AgentsSidebar } from "@/components/agents/agents-sidebar";
import { AppLayout } from "@/components/layout/app-layout";

export default function AgentsLayout({
	children,
}: { children: React.ReactNode }) {
	return <AppLayout sidebarChildren={<AgentsSidebar />}>{children}</AppLayout>;
}
