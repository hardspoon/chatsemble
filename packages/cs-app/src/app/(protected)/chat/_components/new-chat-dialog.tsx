import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm, type UseFormReturn } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
	type ChatRoomType,
	createChatRoomSchema,
	type ChatRoomMemberType,
	type ChatRoomMemberRole,
} from "@/cs-shared";
import { client } from "@/lib/api-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, Settings } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

type CreateChatRoomFormValues = z.infer<typeof createChatRoomSchema>;

export type DialogState = {
	type: ChatRoomType;
} | null;

type NewGroupChatDialogProps = {
	dialogState: DialogState;
	setDialogState: Dispatch<SetStateAction<DialogState>>;
};

export function NewChatRoomDialog({
	dialogState,
	setDialogState,
}: NewGroupChatDialogProps) {
	return (
		<Dialog
			open={!!dialogState}
			onOpenChange={(open) => {
				if (!open) {
					setDialogState(null);
				}
			}}
		>
			<DialogContent className="sm:max-w-[500px]">
				{dialogState && (
					<NewChatRoomDialogContent
						dialogState={dialogState}
						setDialogState={setDialogState}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

function NewChatRoomDialogContent({
	dialogState,
	setDialogState,
}: NewGroupChatDialogProps & {
	dialogState: NonNullable<DialogState>;
}) {
	const router = useRouter();
	const queryClient = useQueryClient();

	// If dialogState is null, we don't show the dialog
	const chatType = dialogState.type;

	const form = useForm<CreateChatRoomFormValues>({
		resolver: zodResolver(createChatRoomSchema),
		values: {
			name: "",
			type: chatType,
			members: [],
		},
	});

	const createChatMutation = useMutation({
		mutationFn: async (values: CreateChatRoomFormValues) => {
			const response = await client.protected.chat["chat-rooms"].$post({
				json: values,
			});
			const data = await response.json();
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
			router.push(`/chat?roomId=${data.roomId}`);
			setDialogState(null);
		},
	});

	const onSubmit = (values: CreateChatRoomFormValues) => {
		console.log("Submitting chat room with values:", {
			name: values.name,
			type: values.type,
			membersCount: values.members.length,
			members: values.members,
		});
		createChatMutation.mutate(values);
	};

	const isGroupChat = chatType === "publicGroup" || chatType === "privateGroup";

	return (
		<>
			<DialogHeader>
				<DialogTitle>
					{chatType === "oneToOne"
						? "Create Direct Message"
						: "Create New Chat Room"}
				</DialogTitle>
				<DialogDescription>
					{chatType === "oneToOne"
						? "Start a direct conversation with another user."
						: "Create a new chat room to start conversations with your team."}
				</DialogDescription>
			</DialogHeader>

			{isGroupChat ? (
				<NewChatRoomGroupForm
					form={form}
					onSubmit={onSubmit}
					isPending={createChatMutation.isPending}
				/>
			) : (
				<NewChatRoomOneToOneForm
					form={form}
					onSubmit={onSubmit}
					isPending={createChatMutation.isPending}
				/>
			)}
		</>
	);
}

function SelectMemberSkeleton() {
	return (
		<div className="space-y-2">
			<Skeleton className="h-4 w-20" />
			<Skeleton className="h-10 w-full" />
		</div>
	);
}

function MultiSelectMembers({
	form,
}: {
	form: UseFormReturn<CreateChatRoomFormValues>;
}) {
	const chatType = form.watch("type");
	const isOneToOne = chatType === "oneToOne";

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
	const allMembers = [
		...(users?.map((user) => ({
			...user,
			memberType: "user" as ChatRoomMemberType,
		})) || []),
		...(agents?.map((agent) => ({
			...agent,
			memberType: "agent" as ChatRoomMemberType,
		})) || []),
	];

	const members = form.watch("members") || [];

	if (isLoading) {
		return <SelectMemberSkeleton />;
	}

	const handleToggleMember = (
		id: string,
		memberType: ChatRoomMemberType,
		checked: boolean,
	) => {
		let currentMembers = [...members];

		if (checked) {
			// For oneToOne chats, only allow one member
			if (isOneToOne) {
				currentMembers = [];
			}
			
			// Add member if not already in the list
			if (!currentMembers.some((member) => member.id === id)) {
				currentMembers.push({
					id,
					type: memberType,
					role: "member" as ChatRoomMemberRole,
				});
			}
		} else {
			// Remove member if in the list
			const index = currentMembers.findIndex((member) => member.id === id);
			if (index !== -1) {
				currentMembers.splice(index, 1);
			}
		}

		form.setValue("members", currentMembers);
	};

	return (
		<div className="space-y-4">
			<FormLabel>
				{isOneToOne ? "Select User" : "Select Members"}
			</FormLabel>
			<div className="max-h-60 overflow-y-auto border rounded-md p-2">
				{allMembers.length > 0 ? (
					allMembers.map((item) => {
						const isSelected = members.some(
							(member) =>
								member.id === item.id && member.type === item.memberType,
						);
						
						// For oneToOne chats, disable selection if another member is already selected
						const isDisabled = isOneToOne && members.length > 0 && !isSelected;
						
						return (
							<div
								key={item.id}
								className={`flex items-center space-x-2 p-2 hover:bg-accent rounded-md ${isDisabled ? 'opacity-50' : ''}`}
							>
								<Checkbox
									id={`member-${item.id}`}
									checked={isSelected}
									disabled={isDisabled}
									onCheckedChange={(checked) =>
										handleToggleMember(item.id, item.memberType, !!checked)
									}
								/>
								<label
									htmlFor={`member-${item.id}`}
									className={`flex items-center gap-2 flex-1 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
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
										className={`text-xs px-2 py-0.5 rounded-full ${item.memberType === "user" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"}`}
									>
										{item.memberType === "user" ? "User" : "Agent"}
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

function NewChatRoomGroupForm({
	form,
	onSubmit,
	isPending,
}: {
	form: UseFormReturn<CreateChatRoomFormValues>;
	onSubmit: (values: CreateChatRoomFormValues) => void;
	isPending: boolean;
}) {
	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<Tabs defaultValue="configuration" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="configuration" className="flex items-center gap-2">
							<Settings className="h-4 w-4" />
							Configuration
						</TabsTrigger>
						<TabsTrigger value="members" className="flex items-center gap-2">
							<UserPlus className="h-4 w-4" />
							Members
						</TabsTrigger>
					</TabsList>
					<TabsContent value="configuration">
						<div className="space-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Name</FormLabel>
										<FormControl>
											<Input placeholder="Enter chat room name" {...field} />
										</FormControl>
										<FormDescription>
											This is the name that will be displayed for your chat room.
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="type"
								render={({ field }) => (
									<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
										<div className="space-y-0.5">
											<FormLabel className="text-base">Private Chat</FormLabel>
											<FormDescription>
												Make this chat room private to specific members.
											</FormDescription>
										</div>
										<FormControl>
											<Switch
												checked={field.value === "privateGroup"}
												onCheckedChange={(checked) => {
													field.onChange(
														checked ? "privateGroup" : "publicGroup",
													);
												}}
											/>
										</FormControl>
									</FormItem>
								)}
							/>
						</div>
					</TabsContent>
					<TabsContent value="members" className="space-y-6">
						<div className="space-y-4">
							<MultiSelectMembers form={form} />

							<div className="mt-4">
								<h3 className="text-sm font-medium mb-2">
									Selected Members ({form.watch("members").length})
								</h3>
								{form.watch("members").length > 0 ? (
									<div className="flex flex-wrap gap-2">
										{form.watch("members").map((member, index) => (
											<div
												key={`${member.id}-${index}`}
												className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
													member.type === "user"
														? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
														: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
												}`}
											>
												{member.type === "user" ? "👤" : "🤖"}{" "}
												{member.id.substring(0, 8)}
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
									<p className="text-sm text-muted-foreground">
										No members selected
									</p>
								)}
							</div>
						</div>
					</TabsContent>
				</Tabs>
				<DialogFooter>
					<Button type="submit" disabled={isPending}>
						{isPending ? "Creating..." : "Create group chat"}
					</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}

function NewChatRoomOneToOneForm({
	form,
	onSubmit,
	isPending,
}: {
	form: UseFormReturn<CreateChatRoomFormValues>;
	onSubmit: (values: CreateChatRoomFormValues) => void;
	isPending: boolean;
}) {
	return (
		<>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<input type="hidden" {...form.register("type")} value="oneToOne" />
					<input
						type="hidden"
						{...form.register("name")}
						value="Direct Message"
					/>
					
					<div className="space-y-4">
						<MultiSelectMembers form={form} />
						
						<div className="mt-4">
							<h3 className="text-sm font-medium mb-2">
								Selected User ({form.watch("members").length}/1)
							</h3>
							{form.watch("members").length > 0 ? (
								<div className="flex flex-wrap gap-2">
									{form.watch("members").map((member, index) => (
										<div
											key={`${member.id}-${index}`}
											className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
												member.type === "user"
													? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
													: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
											}`}
										>
											{member.type === "user" ? "👤" : "🤖"}{" "}
											{member.id.substring(0, 8)}
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
								<p className="text-sm text-muted-foreground">
									No user selected
								</p>
							)}
						</div>
					</div>

					<DialogFooter>
						<Button
							type="submit"
							disabled={isPending || form.watch("members").length === 0}
						>
							{isPending ? "Creating..." : "Create direct message"}
						</Button>
					</DialogFooter>
				</form>
			</Form>
		</>
	);
}
