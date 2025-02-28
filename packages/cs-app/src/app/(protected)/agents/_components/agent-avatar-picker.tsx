import type { FormValues } from "@/app/(protected)/agents/_components/new-agent-dialog";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import type { Control } from "react-hook-form";

interface AgentAvatarPickerProps {
	control: Control<FormValues>;
}

export function AgentAvatarPicker({ control }: AgentAvatarPickerProps) {
	return (
		<FormField
			control={control}
			name="image"
			render={({ field }) => (
				<FormItem>
					<FormLabel>Choose your agent avatar</FormLabel>
					<FormControl>
						<div className="grid grid-cols-8 gap-1.5">
							{Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
								const avatarId = `/notion-avatars/avatar-${num.toString().padStart(2, "0")}.svg`;
								return (
									<button
										key={avatarId}
										type="button"
										className={`relative aspect-square rounded-lg border-2 p-1 transition-all hover:bg-accent ${
											field.value === avatarId
												? "border-primary bg-accent"
												: "border-transparent"
										}`}
										onClick={() => field.onChange(avatarId)}
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
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
