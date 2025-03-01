import { ChatMembersDialog } from "@/app/(protected)/chat/_components/chat-members/chat-members-dialog";
import { useChatWsContext } from "@/app/(protected)/chat/_components/chat-ws-provider";
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function ChatHeader() {
	const { connectionStatus, roomId } = useChatWsContext();

	return (
		<header className="sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-4">
			<SidebarTrigger className="-ml-1" />
			<Separator orientation="vertical" className="mr-2 h-4" />
			<DynamicBreadcrumb />
			<div className="ml-auto flex items-center gap-2">
				<ChatMembersDialog roomId={roomId} />
				{connectionStatus && (
					<Tooltip>
						<TooltipTrigger>
							<div
								className={cn("h-2 w-2 rounded-full transition-colors", {
									"bg-green-500": connectionStatus === "ready",
									"bg-yellow-500": connectionStatus === "connected",
									"bg-orange-500": connectionStatus === "connecting",
									"bg-gray-600": connectionStatus === "disconnected",
								})}
							/>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							<p className="capitalize">{connectionStatus}</p>
						</TooltipContent>
					</Tooltip>
				)}
			</div>
		</header>
	);
}
