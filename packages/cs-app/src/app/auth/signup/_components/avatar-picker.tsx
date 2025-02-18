import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import type { Control } from "react-hook-form";
import type z from "zod";
import type { signupFormSchema } from "./signup-form";

type FormSchema = z.infer<typeof signupFormSchema>;

interface AvatarPickerProps {
	control: Control<FormSchema>;
}

export function AvatarPicker({ control }: AvatarPickerProps) {
	return (
		<FormField
			control={control}
			name="image"
			render={({ field }) => (
				<FormItem>
					<FormLabel>Choose your avatar</FormLabel>
					<FormControl>
						<div className="grid grid-cols-5 gap-2">
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
