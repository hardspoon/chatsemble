import { Card } from "@client/components/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@client/components/ui/collapsible";
import { idToReadableText } from "@client/lib/id-parsing";
import { cn } from "@client/lib/utils";
import { CheckCircleIcon, ChevronDown } from "lucide-react";
import { AnimatedPyramidIcon } from "../icons/loading-pyramid";

export function ToolInvocation({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<Card className={cn("max-w-full py-3 gap-3", className)}>{children}</Card>
	);
}

export function ToolInvocationHeader({
	children,
	className,
}: { children: React.ReactNode; className?: string }) {
	return (
		<div className={cn("flex flex-col items-stretch gap-2 px-4", className)}>
			{children}
		</div>
	);
}

export function ToolInvocationContent({
	children,
	className,
}: { children: React.ReactNode; className?: string }) {
	return <div className={cn("px-6", className)}>{children}</div>;
}

export function ToolInvocationName({
	name,
	capitalize = true,
	type,
	className,
}: {
	name: string;
	capitalize?: boolean;
	type: "tool-call" | "tool-result";
	className?: string;
}) {
	return (
		<span className={cn("flex items-center gap-2 text-sm", className)}>
			{type === "tool-call" && (
				<AnimatedPyramidIcon
					className="size-4 text-muted-foreground"
					duration="2s"
				/>
			)}
			{type === "tool-result" && (
				<CheckCircleIcon className="size-4 text-muted-foreground" />
			)}
			<span className="font-medium">
				{idToReadableText(name, { capitalize })}
			</span>
		</span>
	);
}

export interface SourceType {
	url: string;
	title: string;
	description?: string;
	icon?: string;
}

export interface ToolInvocationSourceProps {
	source: SourceType;
}

export function ToolInvocationSource({ source }: ToolInvocationSourceProps) {
	return (
		<a
			href={source.url}
			target="_blank"
			rel="noopener noreferrer"
			className="flex items-start gap-2 py-1 hover:bg-muted/50 px-2 rounded-md transition-colors"
		>
			{source.icon && (
				<img src={source.icon} alt="" className="h-4 w-4 mt-1 shrink-0" />
			)}
			<div className="flex-1 overflow-hidden">
				<div className="text-sm font-medium truncate">{source.title}</div>
				{source.description && (
					<div className="text-xs text-muted-foreground truncate">
						{source.description}
					</div>
				)}
			</div>
		</a>
	);
}

export interface ToolInvocationSourcesListProps {
	sources: SourceType[];
	maxVisible?: number;
	maxHeight?: string;
}

export function ToolInvocationSourcesList({
	sources,
	maxVisible = 5,
	maxHeight = "10rem",
}: ToolInvocationSourcesListProps) {
	const hasMoreSources = sources.length > maxVisible;

	return (
		<div className="mt-2 border-t pt-2">
			<div className="text-sm font-medium mb-1">Sources ({sources.length})</div>
			<Collapsible className="w-full" defaultOpen={true}>
				<div
					className={cn(
						"pl-2 flex flex-col gap-1 overflow-y-auto",
						maxHeight && `max-h-[${maxHeight}]`,
					)}
				>
					{sources.slice(0, maxVisible).map((source, index) => (
						<ToolInvocationSource
							key={`source-${source.url}-${index}`}
							source={source}
						/>
					))}
				</div>

				{hasMoreSources && (
					<>
						<CollapsibleTrigger className="flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors ml-2 mt-1">
							<ChevronDown className="h-3 w-3 shrink-0 transition-transform duration-200 data-[state=open]:rotate-180" />
							<span className="ml-1">
								Show {sources.length - maxVisible} more sources
							</span>
						</CollapsibleTrigger>
						<CollapsibleContent>
							<div
								className={cn(
									"pl-2 flex flex-col gap-1 overflow-y-auto",
									maxHeight && `max-h-[${maxHeight}]`,
								)}
							>
								{sources.slice(maxVisible).map((source, index) => (
									<ToolInvocationSource
										key={`source-${source.url}-${maxVisible + index}`}
										source={source}
									/>
								))}
							</div>
						</CollapsibleContent>
					</>
				)}
			</Collapsible>
		</div>
	);
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function ToolInvocationResult({ result }: { result: any }) {
	return (
		<div className="pl-4 text-sm">
			<div className="font-medium mb-1">Result:</div>
			<pre className="whitespace-pre-wrap font-mono text-xs bg-muted p-2 rounded-md overflow-auto">
				{JSON.stringify(result, null, 2)}
			</pre>
		</div>
	);
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function ToolInvocationArgs({ args }: { args: any }) {
	return (
		<div className="pl-4 text-sm">
			<pre className="whitespace-pre-wrap font-mono text-xs bg-muted p-2 rounded-md overflow-auto">
				{JSON.stringify(args, null, 2)}
			</pre>
		</div>
	);
}
