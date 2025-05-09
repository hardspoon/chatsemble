import { SidebarInset } from "@client/components/ui/sidebar";
import { Skeleton } from "@client/components/ui/skeleton";

function SkeletonSidebar() {
	return (
		<div
			className="bg-sidebar text-sidebar-foreground flex h-svh w-64 flex-col"
			data-slot="sidebar"
		>
			<div className="flex flex-col gap-2 p-4">
				<Skeleton className="h-8 w-32 mb-4" />
				<Skeleton className="h-8 w-24 mb-2" />
				<Skeleton className="h-8 w-24 mb-2" />
				<Skeleton className="h-8 w-24 mb-2" />
			</div>
			<div className="flex-1 flex flex-col gap-2 p-4">
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton
						key={`skeleton-item-${
							// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
							i
						}`}
						className="h-8 w-full mb-2"
					/>
				))}
			</div>
			<div className="p-4 border-t border-sidebar-border">
				<Skeleton className="h-8 w-20" />
			</div>
		</div>
	);
}

export function AppLayoutSkeleton() {
	return (
		<div className="flex h-svh w-full overflow-hidden bg-sidebar">
			<div data-variant="inset" className="group peer">
				<SkeletonSidebar />
			</div>
			<SidebarInset variant="inset">
				<div className="p-4 w-full h-full">
					<Skeleton className="h-full w-full" />
				</div>
			</SidebarInset>
		</div>
	);
}
