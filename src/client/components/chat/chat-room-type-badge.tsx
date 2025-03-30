import { Badge } from "@client/components/ui/badge";
import { cn } from "@client/lib/utils";
import type { ChatRoomType } from "@shared/types";

interface ChatRoomTypeBadgeProps {
	type: ChatRoomType;
	label?: string;
}

export function ChatRoomTypeBadge({ type, label }: ChatRoomTypeBadgeProps) {
	const labels: Record<ChatRoomType, string> = {
		publicGroup: "Public Group",
		privateGroup: "Private Group",
		oneToOne: "Direct Message",
	};
	return (
		<Badge
			className={cn(
				type === "publicGroup"
					? "bg-blue-500 dark:bg-blue-900 dark:text-foreground"
					: type === "privateGroup"
						? "bg-purple-500 dark:bg-purple-900 dark:text-foreground"
						: "bg-green-500 dark:bg-green-900 dark:text-foreground",
			)}
		>
			{label ?? labels[type]}
		</Badge>
	);
}
