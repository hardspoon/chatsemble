import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { idToReadableText } from "@/lib/id-parsing";

interface ToggleGroupProps<T extends string> {
	value: T | undefined;
	options: Readonly<string[]>;
	descriptions: Readonly<Record<string, string>>;
	iconMap: Readonly<
		Record<string, React.ComponentType<{ className?: string }>>
	>;
	onValueChange: (value: T) => void;
}

export function CardToggleGroup<T extends string>({
	value,
	onValueChange,
	options,
	descriptions,
	iconMap,
}: ToggleGroupProps<T>) {
	return (
		<ToggleGroup
			type="single"
			value={value}
			onValueChange={onValueChange}
			className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2"
		>
			{options.map((option) => {
				const Icon = iconMap[option] ?? (() => null);
				return (
					<ToggleGroupItem
						key={option}
						value={option}
						variant="outline"
						className="flex flex-col items-center gap-1 h-full py-3 px-4"
					>
						<Icon className="h-4 w-4" />
						<span>{idToReadableText(option, { capitalize: true })}</span>
						<span className="text-xs text-muted-foreground text-center break-words">
							{descriptions[option]}
						</span>
					</ToggleGroupItem>
				);
			})}
		</ToggleGroup>
	);
}
