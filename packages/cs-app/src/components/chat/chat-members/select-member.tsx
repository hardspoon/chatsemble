import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { client } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import type { UseFormReturn } from "react-hook-form";
import type { FormValues } from "./add-member-form";

interface SelectMemberProps {
	form: UseFormReturn<FormValues>;
}

function SelectSkeleton() {
	return (
		<div className="space-y-2">
			<Skeleton className="h-4 w-20" />
			<Skeleton className="h-10 w-full" />
		</div>
	);
}

function SelectUser({ form }: SelectMemberProps) {
	const { data: users, isLoading } = useQuery({
		queryKey: ["organization-users"],
		queryFn: async () => {
			const response = await client.protected["organization-user"].$get();
			return response.json();
		},
	});

	if (isLoading) {
		return <SelectSkeleton />;
	}

	return (
		<FormField
			control={form.control}
			name="memberId"
			render={({ field }) => (
				<FormItem>
					<FormLabel>User</FormLabel>
					<Select onValueChange={field.onChange} defaultValue={field.value}>
						<FormControl>
							<SelectTrigger>
								<SelectValue placeholder="Select user" />
							</SelectTrigger>
						</FormControl>
						<SelectContent>
							{users && users.length > 0 ? (
								users.map((user) => (
									<SelectItem key={user.id} value={user.id}>
										<div className="flex items-center gap-2">
											<Avatar className="h-6 w-6">
												<AvatarImage
													src={user.image ?? undefined}
													alt={user.name}
												/>
												<AvatarFallback>
													{user.name[0]?.toUpperCase() ?? "?"}
												</AvatarFallback>
											</Avatar>
											<span>{user.name}</span>
										</div>
									</SelectItem>
								))
							) : (
								<div className="p-2 text-sm text-muted-foreground text-center">
									No users available
								</div>
							)}
						</SelectContent>
					</Select>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}

function SelectAgent({ form }: SelectMemberProps) {
	const { data: agents, isLoading } = useQuery({
		queryKey: ["agents"],
		queryFn: async () => {
			const response = await client.protected.agent.$get();
			return response.json();
		},
	});

	if (isLoading) {
		return <SelectSkeleton />;
	}

	return (
		<FormField
			control={form.control}
			name="memberId"
			render={({ field }) => (
				<FormItem>
					<FormLabel>Agent</FormLabel>
					<Select onValueChange={field.onChange} defaultValue={field.value}>
						<FormControl>
							<SelectTrigger>
								<SelectValue placeholder="Select agent" />
							</SelectTrigger>
						</FormControl>
						<SelectContent>
							{agents && agents.length > 0 ? (
								agents.map((agent) => (
									<SelectItem key={agent.id} value={agent.id}>
										<div className="flex items-center gap-2">
											<Avatar className="h-6 w-6">
												<AvatarImage src={agent.image} alt={agent.name} />
												<AvatarFallback>
													{agent.name[0]?.toUpperCase() ?? "?"}
												</AvatarFallback>
											</Avatar>
											<span>{agent.name}</span>
										</div>
									</SelectItem>
								))
							) : (
								<div className="p-2 text-sm text-muted-foreground text-center">
									No agents available
								</div>
							)}
						</SelectContent>
					</Select>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}

export function SelectMember({ form }: SelectMemberProps) {
	const selectedType = form.watch("type");

	return selectedType === "user" ? (
		<SelectUser form={form} />
	) : (
		<SelectAgent form={form} />
	);
}
