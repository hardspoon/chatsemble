"use client";

import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
} from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import "./style.css";
import type { ChatInputValue, ChatRoomMember } from "@/cs-shared";
import { getMentionSuggestion } from "./mention-config";
import { MentioPlugin } from "./metion-plugin";
import type { Transaction } from "@tiptap/pm/state";
import type { Editor, JSONContent } from "@tiptap/react";

export interface TiptapMentionItem {
	id: string;
	label: string;
}

export const Tiptap = forwardRef(
	(
		{
			members,
			onChange,
			disabled = false,
			//onEnter, // New prop for Enter key submission
		}: {
			members: ChatRoomMember[];
			onChange: (output: ChatInputValue) => void;
			disabled?: boolean;
			onEnter?: () => void; // Callback for Enter keypress
		},
		ref,
	) => {
		const membersRef = useRef(members);

		// Update the ref whenever the members prop changes
		useEffect(() => {
			membersRef.current = members;
		}, [members]);

		const onUpdate = useCallback(
			(props: { editor: Editor; transaction: Transaction }) => {
				const markdown = props.editor.storage.markdown.getMarkdown();
				const json = props.editor.getJSON();

				const extractMentions = (
					content: JSONContent[],
				): ChatInputValue["mentions"] => {
					let mentions: ChatInputValue["mentions"] = [];
					for (const item of content) {
						if (item.type === "mention") {
							mentions.push({
								id: item.attrs?.id,
								name: item.attrs?.label,
							});
						}
						if (item.content) {
							mentions = mentions.concat(extractMentions(item.content));
						}
					}
					return mentions;
				};

				if (!json.content) {
					return;
				}

				const mentions = extractMentions(json.content);
				onChange({ content: markdown, mentions });
			},
			[onChange],
		);

		const editor = useEditor({
			extensions: [
				StarterKit,
				Markdown.configure({ html: true }),
				MentioPlugin.configure({
					HTMLAttributes: { class: "mention" },
					suggestion: getMentionSuggestion(membersRef),
				}),
				// Custom extension for Enter and Shift + Enter handling (added for Goal 3)
				/* Extension.create({
					addKeyboardShortcuts() {
						return {
							Enter: () => {
								if (onEnter) {
									onEnter();
									return true; // Prevent default Enter behavior
								}
								return false;
							},
							"Shift-Enter": () => {
								this.editor.commands.enter(); // Insert a new line
								return true;
							},
						};
					},
				}), */
			],
			onUpdate,
			editable: !disabled,
			immediatelyRender: false,
		});

		// Expose the clear method via the ref
		useImperativeHandle(ref, () => ({
			clear: () => {
				editor?.commands.clearContent();
			},
		}));

		return <EditorContent editor={editor} className="w-full h-full" />;
	},
);

Tiptap.displayName = "Tiptap";
