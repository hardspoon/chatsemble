"use client";

import { useChatParams } from "@/components/chat/providers/chat-params-provider";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";

export function ChatRoomThreadHeader() {
	const { clearThreadId } = useChatParams();

	return (
		<header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
			<div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => {
						clearThreadId();
					}}
					title="Close thread"
					className="-ml-1"
				>
					<X className="h-4 w-4" />
				</Button>
				<Separator
					orientation="vertical"
					className="mx-2 data-[orientation=vertical]:h-4"
				/>
				<span className="text-base font-medium">Thread</span>
			</div>
		</header>
	);
}
