"use client";

import { useState } from "react";
import type { Control } from "react-hook-form";
import type { FormValues } from "@/components/agents/agent-edit-form";
import {
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface AgentAvatarPickerProps {
	control: Control<FormValues>;
}

export function AgentAvatarPicker({ control }: AgentAvatarPickerProps) {
	const [dialogOpen, setDialogOpen] = useState(false);

	return (
		<FormField
			control={control}
			name="image"
			render={({ field }) => (
				<FormItem>
					<FormLabel>Agent Avatar</FormLabel>
					<div className="flex items-center gap-4">
						<div className="relative size-16 overflow-hidden rounded-lg border">
							<img
								src={field.value || "/notion-avatars/avatar-01.svg"}
								alt="Agent avatar"
								className="size-full object-cover"
							/>
						</div>
						<Button
							size="sm"
							variant="outline"
							onClick={() => setDialogOpen(true)}
						>
							Change Avatar
						</Button>
					</div>
					<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
						<DialogContent className="sm:max-w-[525px]">
							<DialogHeader>
								<DialogTitle>Select Avatar</DialogTitle>
							</DialogHeader>
							<div className="grid grid-cols-5 gap-3 p-4">
								{Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
									const avatarId = `/notion-avatars/avatar-${num.toString().padStart(2, "0")}.svg`;
									return (
										<button
											key={avatarId}
											type="button"
											className={`relative aspect-square rounded-lg border-2 p-2 transition-all hover:bg-accent ${
												field.value === avatarId
													? "border-primary bg-accent"
													: "border-transparent"
											}`}
											onClick={() => {
												field.onChange(avatarId);
												setDialogOpen(false);
											}}
										>
											<img
												src={avatarId}
												alt={`Avatar ${num}`}
												className="size-full"
											/>
										</button>
									);
								})}
							</div>
						</DialogContent>
					</Dialog>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
