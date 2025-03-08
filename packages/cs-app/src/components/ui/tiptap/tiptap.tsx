"use client";

import { type Editor, EditorProvider } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import "./style.css";
import type { ChatRoomMember } from "@/cs-shared";
import { getMentionSuggestion } from "./mention-config";
import { MentioPlugin } from "./metion-plugin";
import type { Transaction } from "@tiptap/pm/state";
import { useCallback } from "react";
import type { JSONContent } from "@tiptap/react";

export interface MentionItem {
	id: string;
	label: string;
}

interface TipTapOutput {
	content: string;
	mentions: MentionItem[];
}

export function Tiptap({
	members,
	onChange,
}: {
	members: ChatRoomMember[];
	onChange: (output: TipTapOutput) => void;
}) {
	const onUpdate = useCallback(
		(props: {
			editor: Editor;
			transaction: Transaction;
		}) => {
			const markdown = props.editor.storage.markdown.getMarkdown();
			const json = props.editor.getJSON();

			// Function to extract mentions from JSON
			const extractMentions = (content: JSONContent[]): MentionItem[] => {
				let mentions: MentionItem[] = [];

				for (const item of content) {
					if (item.type === "mention") {
						mentions.push({
							id: item.attrs?.id,
							label: item.attrs?.label,
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
			console.log("RESULT:", {
				content: markdown,
				mentions,
			});
			onChange({
				content: markdown,
				mentions,
			});
		},
		[onChange],
	);

	return (
		<EditorProvider
			extensions={[
				StarterKit,
				Markdown.configure({
					html: true,
				}),
				MentioPlugin.configure({
					HTMLAttributes: {
						class: "mention",
					},
					suggestion: getMentionSuggestion(members),
				}),
			]}
			immediatelyRender={false}
			onUpdate={onUpdate}
		/>
	);
}
