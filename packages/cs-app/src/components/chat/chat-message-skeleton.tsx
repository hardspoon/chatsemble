import { Skeleton } from "@/components/ui/skeleton";

export function ChatMessagesSkeleton() {
	return (
		<>
			{[1, 2, 3].map((i) => (
				<ChatMessageSkeleton key={i} />
			))}
		</>
	);
}

export function ChatMessageSkeleton() {
	return (
		<div className="flex space-x-3">
			<Skeleton className="h-10 w-10 rounded-full" />
			<div className="space-y-2 flex-1">
				<Skeleton className="h-4 w-[200px]" />
				<Skeleton className="h-4 w-[300px]" />
				<Skeleton className="h-4 w-[250px]" />
			</div>
		</div>
	);
}
