import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@client/components/ui/button";
import { DialogFooter } from "@client/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@client/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createChatRoomSchema } from "@shared/types";
import { ChatMemberMultiSelect } from "../../chat-member/chat-member-multi-select";

type CreateChatRoomFormValues = z.infer<typeof createChatRoomSchema>;

export function NewChatRoomOneToOneForm({
	onSubmit,
	isPending,
}: {
	onSubmit: (values: CreateChatRoomFormValues) => void;
	isPending: boolean;
}) {
	const form = useForm<CreateChatRoomFormValues>({
		resolver: zodResolver(createChatRoomSchema),
		defaultValues: {
			name: "TEMP-TITLE",
			type: "oneToOne",
			members: [],
		},
	});

	return (
		<>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<FormField
						control={form.control}
						name="members"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Select who you want to chat with</FormLabel>
								<FormControl>
									<ChatMemberMultiSelect
										selectedMembers={field.value}
										setSelectedMembers={(members) => {
											console.log("members", members);
											field.onChange(members);
										}}
										limit={1}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

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
