import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
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
import { client } from "@/lib/api-client";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
	memberId: z.string().min(1, "Member is required"),
	type: z.enum(["user", "agent"]),
	role: z.enum(["admin", "member"]),
});

type FormValues = z.infer<typeof formSchema>;

interface AddMemberDialogProps {
	roomId: string;
}

export function AddMemberDialog({ roomId }: AddMemberDialogProps) {
	const [open, setOpen] = useState(false);
	const queryClient = useQueryClient();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			type: "user",
			role: "member",
		},
	});

	const { data: agents } = useQuery({
		queryKey: ["agents"],
		queryFn: async () => {
			const response = await client.protected.agent.$get();
			return response.json();
		},
	});

	const { data: users } = useQuery({
		queryKey: ["organization-users"],
		queryFn: async () => {
			const response = await client.protected["organization-user"].$get();
			return response.json();
		},
	});

	const addMemberMutation = useMutation({
		mutationFn: async (values: FormValues) => {
			const response = await client.protected["chat-room"].members.$post({
				json: {
					roomId,
					...values,
				},
			});
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["chat-room", roomId] });
			setOpen(false);
			form.reset();
		},
	});

	const onSubmit = (values: FormValues) => {
		addMemberMutation.mutate(values);
	};

	const selectedType = form.watch("type");

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					<Plus className="h-4 w-4 mr-2" />
					Add Member
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Add Member</DialogTitle>
					<DialogDescription>
						Add a new member to this chat room.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<FormField
							control={form.control}
							name="type"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Member Type</FormLabel>
									<FormControl>
										<RadioGroup
											onValueChange={field.onChange}
											defaultValue={field.value}
											className="flex flex-col space-y-1"
										>
											<div className="flex items-center space-x-2">
												<RadioGroupItem value="user" id="user" />
												<Label htmlFor="user">User</Label>
											</div>
											<div className="flex items-center space-x-2">
												<RadioGroupItem value="agent" id="agent" />
												<Label htmlFor="agent">Agent</Label>
											</div>
										</RadioGroup>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="memberId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{selectedType === "user" ? "User" : "Agent"}
									</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue
													placeholder={`Select ${
														selectedType === "user" ? "user" : "agent"
													}`}
												/>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{selectedType === "user"
												? users?.map((user) => (
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
												: agents?.map((agent) => (
														<SelectItem key={agent.id} value={agent.id}>
															<div className="flex items-center gap-2">
																<Avatar className="h-6 w-6">
																	<AvatarImage
																		src={agent.image}
																		alt={agent.name}
																	/>
																	<AvatarFallback>
																		{agent.name[0]?.toUpperCase() ?? "?"}
																	</AvatarFallback>
																</Avatar>
																<span>{agent.name}</span>
															</div>
														</SelectItem>
													))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="role"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Role</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select role" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="admin">Admin</SelectItem>
											<SelectItem value="member">Member</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button type="submit" disabled={addMemberMutation.isPending}>
								{addMemberMutation.isPending
									? "Adding member..."
									: "Add member"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
