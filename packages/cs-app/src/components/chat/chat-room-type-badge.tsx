import { Badge } from "@/components/ui/badge";
import type { ChatRoomType } from "@/cs-shared";
import { cn } from "@/lib/utils";

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
