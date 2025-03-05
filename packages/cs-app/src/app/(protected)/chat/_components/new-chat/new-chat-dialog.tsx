import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { type ChatRoomType, createChatRoomSchema } from "@/cs-shared";
import { client } from "@/lib/api-client";
import type { Dispatch, SetStateAction } from "react";
import { NewChatRoomGroupForm } from "./new-chat-room-group";
import { NewChatRoomOneToOneForm } from "./new-chat-room-one-to-one";

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

	const form = useForm<CreateChatRoomFormValues>({
		resolver: zodResolver(createChatRoomSchema),
		values: {
			name:
				dialogState.type === "oneToOne"
					? "New Direct Message"
					: "New Group Chat",
			type: dialogState.type,
			members: [],
		},
	});

	const formChatType = form.watch("type");

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

	const isGroupChat =
		formChatType === "publicGroup" || formChatType === "privateGroup";

	return (
		<>
			<DialogHeader>
				<DialogTitle>
					{formChatType === "oneToOne"
						? "Create Direct Message"
						: "Create New Chat Room"}
				</DialogTitle>
				<DialogDescription>
					{formChatType === "oneToOne"
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
