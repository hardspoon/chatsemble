import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { z } from "zod";

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
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { createChatRoomSchema } from "@/cs-shared";
import { client } from "@/lib/api-client";
import { Plus } from "lucide-react";
import { useState } from "react";

type FormValues = z.infer<typeof createChatRoomSchema>;

export function NewGroupChatDialog() {
	const [open, setOpen] = useState(false);
	const router = useRouter();
	const queryClient = useQueryClient();
	const form = useForm<FormValues>({
		resolver: zodResolver(createChatRoomSchema),
		defaultValues: {
			name: "",
			type: "publicGroup",
		},
	});

	const createChatMutation = useMutation({
		mutationFn: async (values: FormValues) => {
			const response = await client.protected.chat["chat-room"].create.$post({
				json: values,
			});
			const data = await response.json();
			return data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["chatRooms"] });
			router.push(`/chat?roomId=${data.roomId}`);
			setOpen(false);
		},
	});

	const onSubmit = (values: FormValues) => {
		createChatMutation.mutate(values);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					<Plus className="h-4 w-4" />
					New Chat
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Create New Chat Room</DialogTitle>
					<DialogDescription>
						Create a new chat room to start conversations with your team.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
						<DialogFooter>
							<Button type="submit" disabled={createChatMutation.isPending}>
								{createChatMutation.isPending
									? "Creating..."
									: "Create group chat"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
