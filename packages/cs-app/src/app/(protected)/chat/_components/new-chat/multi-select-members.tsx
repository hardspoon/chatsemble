import type { UseFormReturn } from "react-hook-form";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormLabel } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import type { createChatRoomSchema } from "@/cs-shared";
import { client } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { z } from "zod";

function MultiSelectMembersSkeleton() {
	return (
		<div className="space-y-2">
			<Skeleton className="h-4 w-20" />
			<Skeleton className="h-10 w-full" />
		</div>
	);
}

type CreateChatRoomFormValues = z.infer<typeof createChatRoomSchema>;

type CreateChatRoomMember = z.infer<
	typeof createChatRoomSchema
>["members"][number];

function SelectMembers({
	form,
	limit,
}: {
	form: UseFormReturn<CreateChatRoomFormValues>;
	limit?: number;
}) {
	const { data: users, isLoading: isLoadingUsers } = useQuery({
		queryKey: ["organization-users"],
		queryFn: async () => {
			const response = await client.protected.organization.users.$get({
				query: {
					includeUser: "false",
				},
			});
			return response.json();
		},
	});

	const { data: agents, isLoading: isLoadingAgents } = useQuery({
		queryKey: ["agents"],
		queryFn: async () => {
			const response = await client.protected.agents.$get();
			return response.json();
		},
	});

	const isLoading = isLoadingUsers || isLoadingAgents;

	// Combine users and agents with type information
	const allMembers: (CreateChatRoomMember & { image: string })[] =
		useMemo(() => {
			const mappedUsers =
				users?.map((user) => ({
					id: user.id,
					name: user.name,
					type: "user" as const,
					role: "member" as const,
					image: user.image ?? "",
				})) || [];

			const mappedAgents =
				agents?.map((agent) => ({
					id: agent.id,
					name: agent.name,
					type: "agent" as const,
					role: "member" as const,
					image: agent.image ?? "",
				})) || [];

			return [...mappedUsers, ...mappedAgents];
		}, [users, agents]);

	const selectedMembers = form.watch("members");

	if (isLoading) {
		return <MultiSelectMembersSkeleton />;
	}

	const handleToggleMember = (
		chatRoomMember: CreateChatRoomMember,
		checked: boolean,
	) => {
		const currentMembers = [...selectedMembers];

		if (checked) {
			// If we've reached the limit, don't add more members
			if (limit && currentMembers.length >= limit) {
				return;
			}

			// Add member if not already in the list
			if (!currentMembers.some((member) => member.id === chatRoomMember.id)) {
				currentMembers.push(chatRoomMember);
			}
		} else {
			// Remove member if in the list
			const index = currentMembers.findIndex(
				(member) => member.id === chatRoomMember.id,
			);
			if (index !== -1) {
				currentMembers.splice(index, 1);
			}
		}

		form.setValue("members", currentMembers);
	};

	return (
		<div className="space-y-4">
			<FormLabel>Select Members</FormLabel>
			<div className="max-h-60 overflow-y-auto border rounded-md p-2">
				{allMembers.length > 0 ? (
					allMembers.map((item) => {
						const isSelected = selectedMembers.some(
							(member) => member.id === item.id && member.type === item.type,
						);

						// Disable selection if we've reached the limit
						const isDisabled =
							!!limit && selectedMembers.length >= limit && !isSelected;

						return (
							<div
								key={item.id}
								className={`flex items-center space-x-2 p-2 hover:bg-accent rounded-md ${isDisabled ? "opacity-50" : ""}`}
							>
								<Checkbox
									id={`member-${item.id}`}
									checked={isSelected}
									disabled={isDisabled}
									onCheckedChange={(checked) =>
										handleToggleMember(item, !!checked)
									}
								/>
								<label
									htmlFor={`member-${item.id}`}
									className={`flex items-center gap-2 flex-1 ${isDisabled ? "cursor-not-allowed" : "cursor-pointer"}`}
								>
									<Avatar className="h-6 w-6">
										<AvatarImage
											src={item.image ?? undefined}
											alt={item.name}
										/>
										<AvatarFallback>
											{item.name[0]?.toUpperCase() ?? "?"}
										</AvatarFallback>
									</Avatar>
									<span>{item.name}</span>
									<span
										className={`text-xs px-2 py-0.5 rounded-full ${item.type === "user" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"}`}
									>
										{item.type === "user" ? "User" : "Agent"}
									</span>
								</label>
							</div>
						);
					})
				) : (
					<div className="p-2 text-sm text-muted-foreground text-center">
						No members available
					</div>
				)}
			</div>
		</div>
	);
}

function DisplayMembers({
	form,
}: {
	form: UseFormReturn<CreateChatRoomFormValues>;
}) {
	const members = form.watch("members");

	return (
		<div className="mt-4">
			<h3 className="text-sm font-medium mb-2">
				Selected User ({members.length})
			</h3>
			{members.length > 0 ? (
				<div className="flex flex-wrap gap-2">
					{members.map((member, index) => (
						<div
							key={`${member.id}-${index}`}
							className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
								member.type === "user"
									? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
									: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
							}`}
						>
							{member.type === "user" ? "👤" : "🤖"}
							<span className="truncate max-w-[100px] ml-1">{member.name}</span>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-4 w-4 p-0 ml-1"
								onClick={() => {
									const currentMembers = [...form.watch("members")];
									currentMembers.splice(index, 1);
									form.setValue("members", currentMembers);
								}}
							>
								×
							</Button>
						</div>
					))}
				</div>
			) : (
				<p className="text-sm text-muted-foreground">No members selected</p>
			)}
		</div>
	);
}

export function MultiSelectMembers({
	form,
	limit,
}: {
	form: UseFormReturn<CreateChatRoomFormValues>;
	limit?: number;
}) {
	return (
		<div className="space-y-4">
			<SelectMembers form={form} limit={limit} />
			<DisplayMembers form={form} />
		</div>
	);
}
