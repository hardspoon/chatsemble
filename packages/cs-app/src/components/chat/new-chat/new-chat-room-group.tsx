import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type ChatRoomType, createChatRoomSchema } from "@/cs-shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { Settings, UserPlus } from "lucide-react";
import { ChatMemberMultiSelect } from "../../chat-member/chat-member-multi-select";

type CreateChatRoomFormValues = z.infer<typeof createChatRoomSchema>;

export function NewChatRoomGroupForm({
	onSubmit,
	groupChatType,
	isPending,
}: {
	onSubmit: (values: CreateChatRoomFormValues) => void;
	groupChatType: Exclude<ChatRoomType, "oneToOne">;
	isPending: boolean;
}) {
	const form = useForm<CreateChatRoomFormValues>({
		resolver: zodResolver(createChatRoomSchema),
		defaultValues: {
			name: "",
			type: groupChatType,
			members: [],
		},
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<Tabs defaultValue="configuration" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger
							value="configuration"
							className="flex items-center gap-2"
						>
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
											This is the name that will be displayed for your chat
											room.
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
						<FormField
							control={form.control}
							name="members"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Select Members</FormLabel>
									<FormControl>
										<ChatMemberMultiSelect
											selectedMembers={field.value}
											setSelectedMembers={(members) => {
												console.log("members", members);
												field.onChange(members);
											}}
										/>
									</FormControl>
									<FormDescription>
										Select members ({field.value.length})
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
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
