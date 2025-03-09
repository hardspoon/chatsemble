"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUpIcon } from "lucide-react";
import React, {
	createContext,
	forwardRef,
	useContext,
	useRef,
	useState,
} from "react";
import { Tiptap } from "@/components/ui/tiptap/tiptap";
import type { ChatInputValue, ChatRoomMember } from "@/cs-shared";

interface ChatInputContextValue {
	value?: ChatInputValue;
	setValue?: (value: ChatInputValue) => void;
	onSubmit?: (value: ChatInputValue) => void;
	loading?: boolean;
	onStop?: () => void;
	variant?: "default" | "unstyled";
	rows?: number;
	disabled?: boolean;
	chatMembers?: ChatRoomMember[];
}

const ChatInputContext = createContext<ChatInputContextValue>({});

interface ChatInputProps
	extends Omit<ChatInputContextValue, "variant" | "value" | "setValue"> {
	children: React.ReactNode;
	className?: string;
	variant?: "default" | "unstyled";
	rows?: number;
	chatMembers?: ChatRoomMember[];
	disabled?: boolean;
}

function ChatInput({
	children,
	className,
	variant = "default",
	onSubmit,
	loading,
	onStop,
	rows = 1,
	chatMembers = [],
	disabled,
}: ChatInputProps) {
	const [value, setValue] = useState<ChatInputValue>({
		content: "",
		mentions: [],
	});
	const editorRef = useRef<{ clear: () => void }>(null);

	const handleSubmitInternal = () => {
		if (onSubmit) {
			if (!value.content.trim() || disabled) {
				return;
			}
			onSubmit(value);
			editorRef.current?.clear(); // Clear the editor after submission
		}
	};
	const contextValue: ChatInputContextValue = {
		value,
		setValue,
		onSubmit: handleSubmitInternal,
		loading,
		onStop,
		variant,
		rows,
		chatMembers,
		disabled,
	};

	return (
		<ChatInputContext.Provider value={contextValue}>
			<div
				className={cn(
					variant === "default" &&
						"flex flex-col items-end w-full p-2 rounded-2xl border border-input bg-transparent focus-within:ring-1 focus-within:ring-ring focus-within:outline-none",
					variant === "unstyled" && "flex items-start gap-2 w-full",
					className,
				)}
			>
				{React.Children.map(children, (child) => {
					if (React.isValidElement(child)) {
						if (child.type === ChatInputTiptap) {
							return React.cloneElement(child, {
								ref: editorRef,
								...child.props,
							});
						}
						return child;
					}
					return child;
				})}
			</div>
		</ChatInputContext.Provider>
	);
}

ChatInput.displayName = "ChatInput";

interface ChatInputTiptapProps {
	members?: ChatRoomMember[];
	disabled?: boolean;
	setValue?: (output: ChatInputValue) => void;
	//onEnter?: () => void;
}

const ChatInputTiptap = forwardRef(
	(
		{
			members: membersProp,
			//disabled: disabledProp,
			//onEnter,
			setValue: setValueProp,
		}: ChatInputTiptapProps,
		ref,
	) => {
		const context = useContext(ChatInputContext);
		const members = membersProp ?? context.chatMembers ?? [];
		const setValue = setValueProp ?? context.setValue;
		//const disabled = disabledProp ?? context.disabled;

		return (
			<Tiptap
				ref={ref}
				members={members}
				onChange={setValue ?? (() => {})}
				//disabled={disabled}
				//onEnter={onEnter}
			/>
		);
	},
);

ChatInputTiptap.displayName = "ChatInputTiptap";

interface ChatInputSubmitProps extends React.ComponentProps<typeof Button> {
	onSubmit?: () => void;
	loading?: boolean;
	onStop?: () => void;
}

function ChatInputSubmit({
	onSubmit: onSubmitProp,
	loading: loadingProp,
	onStop: onStopProp,
	className,
	disabled: disabledProp,
	...props
}: ChatInputSubmitProps) {
	const context = useContext(ChatInputContext);
	const loading = loadingProp ?? context.loading;
	const onStop = onStopProp ?? context.onStop;
	const onSubmit = onSubmitProp ?? context.onSubmit;
	const disabled = disabledProp ?? context.disabled;
	const value = context.value;

	if (loading && onStop) {
		return (
			<Button
				onClick={onStop}
				className={cn(
					"shrink-0 rounded-full p-1.5 h-fit border dark:border-zinc-600",
					className,
				)}
				{...props}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="currentColor"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-label="Stop"
				>
					<title>Stop</title>
					<rect x="6" y="6" width="12" height="12" />
				</svg>
			</Button>
		);
	}

	// For Tiptap, we check if there's content in the tiptapValue
	const isDisabled =
		disabled || !value || !value.content || value.content.trim().length === 0;

	return (
		<Button
			className={cn(
				"shrink-0 rounded-full p-1.5 h-fit border dark:border-zinc-600",
				className,
			)}
			disabled={isDisabled}
			onClick={(event) => {
				event.preventDefault();
				if (!isDisabled) {
					onSubmit?.(value);
				}
			}}
			{...props}
		>
			<ArrowUpIcon />
		</Button>
	);
}

ChatInputSubmit.displayName = "ChatInputSubmit";

export { ChatInput, ChatInputTiptap, ChatInputSubmit };
