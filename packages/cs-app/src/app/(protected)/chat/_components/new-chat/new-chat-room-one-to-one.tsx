import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import type { createChatRoomSchema } from "@/cs-shared";
import { MultiSelectMembers } from "./multi-select-members";
type CreateChatRoomFormValues = z.infer<typeof createChatRoomSchema>;

export function NewChatRoomOneToOneForm({
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
					<MultiSelectMembers form={form} limit={1} />

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
