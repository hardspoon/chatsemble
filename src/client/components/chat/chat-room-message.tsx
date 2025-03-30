import { Skeleton } from "@/components/ui/skeleton";
import {
	ChatMessage,
	ChatMessageAvatar,
	ChatMessageContent,
	ChatMessageContentArea,
	ChatMessageMetadata,
} from "../ui/chat-message";

import {
	ToolInvocationBody,
	ToolInvocationComponent,
	ToolInvocationData,
	ToolInvocationDataTrigger,
	ToolInvocationHeader,
	ToolNameComponent,
} from "@/components/ui/tool-invocation";
import type { ChatRoomMessage as ChatRoomMessageType } from "@/shared/types";

export function ChatRoomMessage({
	message,
	actionArea,
	threadArea,
}: {
	message: ChatRoomMessageType;
	actionArea?: React.ReactNode;
	threadArea?: (
		message: ChatRoomMessageType,
		threadMetadata: NonNullable<ChatRoomMessageType["threadMetadata"]>,
	) => React.ReactNode;
}) {
	const threadAreaComponent =
		threadArea && message.threadMetadata
			? threadArea(message, message.threadMetadata)
			: null;
	return (
		<ChatMessage key={String(message.id)} id={String(message.id)}>
			{actionArea}
			<ChatMessageAvatar imageSrc={message.member.image ?? undefined} />
			<ChatMessageContentArea>
				<ChatMessageMetadata
					username={message.member.name}
					createdAt={message.createdAt}
				/>
				<ChatMessageContent content={message.content}>
					{message.toolUses.map((toolUse) => (
						<ToolInvocationComponent
							key={toolUse.toolCallId}
							collapsible={true}
							defaultOpen={false}
						>
							<ToolInvocationHeader>
								<ToolNameComponent
									name={`Used ${toolUse.toolName}`}
									type={toolUse.type}
								/>
								<ToolInvocationDataTrigger />
							</ToolInvocationHeader>
							<ToolInvocationBody>
								<ToolInvocationData data={toolUse.args} />
								{toolUse.type === "tool-result" && (
									<ToolInvocationData data={toolUse.result} />
								)}
							</ToolInvocationBody>
						</ToolInvocationComponent>
					))}
					{threadAreaComponent}
				</ChatMessageContent>
			</ChatMessageContentArea>
		</ChatMessage>
	);
}

export function ChatMessagesSkeleton({ items = 3 }: { items?: number }) {
	return (
		<>
			{[...Array(items)].map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
				<ChatMessageSkeleton key={i} />
			))}
		</>
	);
}

export function ChatMessageSkeleton() {
	return (
		<div className="flex gap-4 w-full">
			<Skeleton className="h-8 w-8 rounded-full shrink-0" />
			<div className="flex-1 flex flex-col gap-4">
				<div className="flex gap-2">
					<Skeleton className="h-4 w-[100px]" />
					<Skeleton className="h-4 w-[60px]" />
				</div>
				<div className="space-y-2 flex-1">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-10/12" />
				</div>
			</div>
		</div>
	);
}
