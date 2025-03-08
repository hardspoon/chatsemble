import type { ChatRoomMember } from "@/cs-shared";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatMemberBadge } from "@/components/chat-member/chat-member-badge";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { MentionItem } from "./tiptap";

interface MentionListProps {
	items: ChatRoomMember[];
	command: (item: MentionItem) => void;
}

interface MentionListRef {
	onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export default forwardRef<MentionListRef, MentionListProps>((props, ref) => {
	const [selectedIndex, setSelectedIndex] = useState(0);

	const selectItem = (index: number) => {
		const item = props.items[index];

		if (item) {
			props.command({
				id: item.id,
				label: item.name,
			});
		}
	};

	const upHandler = () => {
		setSelectedIndex(
			(selectedIndex + props.items.length - 1) % props.items.length,
		);
	};

	const downHandler = () => {
		setSelectedIndex((selectedIndex + 1) % props.items.length);
	};

	const enterHandler = () => {
		selectItem(selectedIndex);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => setSelectedIndex(0), [props.items]);

	useImperativeHandle(ref, () => ({
		onKeyDown: ({ event }: { event: KeyboardEvent }) => {
			if (event.key === "ArrowUp") {
				upHandler();
				return true;
			}

			if (event.key === "ArrowDown") {
				downHandler();
				return true;
			}

			if (event.key === "Enter") {
				enterHandler();
				return true;
			}

			return false;
		},
	}));

	return (
		<div className="bg-popover text-popover-foreground border border-border rounded-lg shadow-md flex flex-col gap-1 overflow-auto p-1 relative">
			{props.items.length ? (
				props.items.map((item, index) => (
					<Button
						key={item.id}
						variant="ghost"
						size="sm"
						className={cn(
							"flex flex-1 justify-between px-1 py-1",
							selectedIndex === index && "bg-gray-100",
						)}
						onClick={() => selectItem(index)}
					>
						<Avatar className="h-6 w-6">
							<AvatarImage src={item.image ?? undefined} alt={item.name} />
							<AvatarFallback>
								{item.name[0]?.toUpperCase() ?? "?"}
							</AvatarFallback>
						</Avatar>
						<span className="text-sm font-medium">{item.name}</span>
						<ChatMemberBadge type={item.type} />
					</Button>
				))
			) : (
				<div className="item">No result</div>
			)}
		</div>
	);
});
