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
	internalValue: ChatInputValue;
	setInternalValue: (value: ChatInputValue) => void;
	onSubmitInternal: () => void;
	disabled?: boolean;
	chatMembers: ChatRoomMember[];
}

const ChatInputContext = createContext<ChatInputContextValue>({
	internalValue: { content: "", mentions: [] },
	setInternalValue: () => {},
	onSubmitInternal: () => {},
	chatMembers: [],
});

interface ChatInputProps {
	children: React.ReactNode;
	className?: string;
	onSubmit: (value: ChatInputValue) => void;
	disabled?: boolean;
	chatMembers: ChatRoomMember[];
}

function ChatInput({
	children,
	className,
	onSubmit,
	chatMembers = [],
	disabled,
}: ChatInputProps) {
	const [internalValue, setInternalValue] = useState<ChatInputValue>({
		content: "",
		mentions: [],
	});
	const editorRef = useRef<{
		clear: () => void;
		getValue: () => ChatInputValue;
	}>(null);

	const handleSubmitInternal = () => {
		if (editorRef.current) {
			const currentValue = editorRef.current.getValue();
			if (!currentValue.content.trim()) {
				return;
			}
			onSubmit(currentValue);
			editorRef.current.clear();
		}
	};
	const contextValue: ChatInputContextValue = {
		internalValue,
		setInternalValue,
		onSubmitInternal: handleSubmitInternal,
		chatMembers,
		disabled,
	};

	return (
		<ChatInputContext.Provider value={contextValue}>
			<div
				className={cn(
					"flex flex-col items-end w-full p-2 rounded-2xl border border-input bg-transparent focus-within:ring-1 focus-within:ring-ring focus-within:outline-none",
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

const ChatInputTiptap = forwardRef((_, ref) => {
	const context = useContext(ChatInputContext);
	const members = context.chatMembers ?? [];
	const setInternalValue = context.setInternalValue;
	const onSubmitInternal = context.onSubmitInternal;
	//const disabled = disabledProp ?? context.disabled;

	return (
		<Tiptap
			ref={ref}
			members={members}
			onChange={setInternalValue}
			//disabled={disabled}
			onEnter={onSubmitInternal}
		/>
	);
});

ChatInputTiptap.displayName = "ChatInputTiptap";

function ChatInputSubmit({
	className,
	...props
}: React.ComponentProps<typeof Button>) {
	const context = useContext(ChatInputContext);
	const onSubmitInternal = context.onSubmitInternal;
	const disabled = context.disabled;
	const internalValue = context.internalValue;

	const isDisabled = disabled || !internalValue;
	internalValue?.content.trim().length === 0;

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
					onSubmitInternal();
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
