import type { ChatRoomMemberType } from "@/cs-shared";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MemberBadgeProps {
	type: ChatRoomMemberType;
}

/* export function MemberBadge({ type }: MemberBadgeProps) {
	return (
		<span
			className={`text-xs px-2 py-0.5 rounded-full ${
				type === "user"
					? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
					: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
			}`}
		>
			{type === "user" ? "User" : "Agent"}
		</span>
	);
} */

export function MemberBadge({ type }: MemberBadgeProps) {
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
