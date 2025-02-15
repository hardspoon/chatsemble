import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { Badge } from "@/components/ui/badge";
import { useChatWsContext } from "@/components/chat/chat-ws-provider";

export function ChatHeader() {
	const { connectionStatus } = useChatWsContext();

	return (
		<header className="sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-4">
			<SidebarTrigger className="-ml-1" />
			<Separator orientation="vertical" className="mr-2 h-4" />
			<DynamicBreadcrumb />
			{connectionStatus && (
				<Badge
					variant={
						connectionStatus === "connected"
							? "success"
							: connectionStatus === "connecting"
								? "warning"
								: "destructive"
					}
					className="ml-auto"
				>
					{connectionStatus}
				</Badge>
			)}
		</header>
	);
}
