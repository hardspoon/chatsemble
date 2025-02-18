import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AgentSkeleton() {
	return (
		<div className="container mx-auto p-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<Skeleton className="h-8 w-32" />
					<Skeleton className="h-10 w-24" />
				</CardHeader>
				<CardContent>
					<div className="space-y-6">
						<div className="space-y-2">
							<Skeleton className="h-5 w-16" />
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-4 w-64" />
						</div>
						<div className="space-y-2">
							<Skeleton className="h-5 w-24" />
							<Skeleton className="h-32 w-full" />
							<Skeleton className="h-4 w-72" />
						</div>
						<div className="rounded-lg border p-4">
							<div className="space-y-2">
								<Skeleton className="h-5 w-32" />
								<div className="grid grid-cols-8 gap-1.5">
									{Array.from({ length: 10 }).map((_, i) => (
										// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
										<Skeleton key={i} className="aspect-square rounded-lg" />
									))}
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
