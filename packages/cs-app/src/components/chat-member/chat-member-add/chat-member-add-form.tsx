import { ChatMemberCombobox } from "@/components/chat-member/chat-member-combobox";
import { useChatWsContext } from "@/components/chat/providers/chat-ws-provider";
import { Button } from "@/components/ui/button";
import {
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
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
import { createChatRoomMemberSchema } from "@/cs-shared";
import { client } from "@/lib/api-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import type { z } from "zod";

export type FormValues = z.infer<typeof createChatRoomMemberSchema>;

interface ChatMemberAddFormProps {
	roomId: string;
	onSuccess: () => void;
}

export function ChatMemberAddForm({
	roomId,
	onSuccess,
}: ChatMemberAddFormProps) {
	const queryClient = useQueryClient();
	const { members } = useChatWsContext();

	const form = useForm<FormValues>({
		resolver: zodResolver(createChatRoomMemberSchema),
		defaultValues: {
			id: "",
			roomId,
			type: "user",
			role: "member",
		},
	});

	const addMemberMutation = useMutation({
		mutationFn: async (values: FormValues) => {
			const response = await client.protected.chat["chat-rooms"][
				":chatRoomId"
			].members.$post({
				param: { chatRoomId: values.roomId },
				json: values,
			});
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["chat-room", roomId] });
			form.reset();
			onSuccess();
		},
	});

	const onSubmit = (values: FormValues) => {
		addMemberMutation.mutate(values);
	};

	const selectedMember = {
		id: form.watch("id"),
		type: form.watch("type"),
	};

	return (
		<>
			<DialogHeader>
				<DialogTitle>Add Member</DialogTitle>
				<DialogDescription>Add a new member to the chat room</DialogDescription>
			</DialogHeader>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
					<FormItem className="flex flex-col">
						<FormLabel>Select Member</FormLabel>
						<ChatMemberCombobox
							selectedMember={selectedMember}
							setSelectedMember={(member) => {
								form.setValue("id", member?.id ?? "");
								form.setValue("type", member?.type ?? "user");
							}}
							currentMembers={members}
						/>
						<FormMessage />
					</FormItem>

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
							{addMemberMutation.isPending ? "Adding member..." : "Add member"}
						</Button>
					</DialogFooter>
				</form>
			</Form>
		</>
	);
}
