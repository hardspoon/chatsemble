import type { ChatRoomMemberType } from "@/cs-shared";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChatMemberBadgeProps {
	type: ChatRoomMemberType;
}

export function ChatMemberBadge({ type }: ChatMemberBadgeProps) {
	return (
		<Badge
			className={cn(
				type === "user"
					? "bg-blue-500 dark:bg-blue-900 dark:text-foreground"
					: "bg-purple-500 dark:bg-purple-900 dark:text-foreground",
			)}
		>
			{type === "user" ? "User" : "Agent"}
		</Badge>
	);
}
