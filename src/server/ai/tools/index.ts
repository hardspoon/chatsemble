import { env } from "cloudflare:workers";
import type {
	AgentToolAnnotation,
	ChatRoomMessage,
	ChatRoomMessagePartial,
} from "@/shared/types";
import { type DataStreamWriter, tool } from "ai";
import FirecrawlApp from "firecrawl";
import { customAlphabet, nanoid } from "nanoid";
import { z } from "zod";

export const searchInformationTool = () =>
	tool({
		description:
			"Use this tool when the user asks you to search for any kind of information or requires more information about a topic",
		parameters: z.object({
			query: z.string().describe("The search query"),
		}),
		execute: async ({ query }) => {
			const searchParams = new URLSearchParams({ q: query });
			const response = await fetch(
				`https://api.search.brave.com/res/v1/web/search?${searchParams}`,
				{
					headers: {
						Accept: "application/json",
						"Accept-Encoding": "gzip",
						"X-Subscription-Token": env.BRAVE_API_KEY,
					},
				},
			);

			if (!response.ok) {
				throw new Error(`Brave API error: ${response.statusText}`);
			}

			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const data = (await response.json()) as any;
			return {
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				result: data.web?.results?.slice(0, 5).map((r: any) => ({
					title: r.title,
					url: r.url,
					description: r.description,
					language: r.language,
					age: r.age,
					extraSnippets: r.extra_snippets,
				})),
			};
		},
	});

export const deepResearchTool = (dataStream: DataStreamWriter) =>
	tool({
		description:
			"Deeply research a topic when user asks for detailed information, opinions, comprehensive analysis, or when searchInformationTool is insufficient. Use specific queries.",
		parameters: z.object({
			query: z.string().describe("The specific query for deep research."),
		}),
		execute: async ({ query }, { toolCallId }: { toolCallId: string }) => {
			console.log("[deepResearchTool] Starting deep research for:", query);
			// @ts-ignore
			const firecrawl = new FirecrawlApp({ apiKey: env.FIRECRAWL_API_KEY });

			const results = await firecrawl.deepResearch(
				query,
				{
					maxDepth: 2, // Number of research iterations
					timeLimit: 30, // Time limit in seconds
					maxUrls: 5, // Maximum URLs to analyze
				},
				({ type, message, depth, status, timestamp }) => {
					console.log("[deepResearchTool] Activity:", {
						type,
						message,
						depth,
						status,
						timestamp,
					});
					const annotation: AgentToolAnnotation = {
						toolCallId,
						id: nanoid(),
						type: type,
						message: message,
						data: {
							depth,
							status,
							timestamp,
						},
						timestamp: Date.now(),
					};
					dataStream.writeMessageAnnotation(JSON.stringify(annotation));
				},
			);

			console.log("[deepResearchTool] Finished deep research.");
			return results;
		},
	});

export const createMessageThreadTool = ({
	onMessage,
	onNewThread,
}: {
	onMessage: ({
		newMessagePartial,
	}: {
		newMessagePartial: ChatRoomMessagePartial;
	}) => Promise<ChatRoomMessage>;
	onNewThread: (newThreadId: number) => void;
}) =>
	tool({
		description:
			"Use this tool to create a new message thread if we are not already responding in a thread (threadId is null)",
		parameters: z.object({
			message: z.string().describe("The message to include in the thread"),
		}),
		execute: async ({ message }) => {
			const { id: newThreadId } = await onMessage({
				newMessagePartial: {
					id: Number(customAlphabet("0123456789", 20)()),
					content: message,
					mentions: [],
					toolUses: [],
					createdAt: Date.now(),
					threadId: null,
				},
			});
			onNewThread(newThreadId);
			return {
				success: true,
				newThreadId,
			};
		},
	});

export type AgentToolSet = {
	searchInformation: ReturnType<typeof searchInformationTool>;
	deepResearch: ReturnType<typeof deepResearchTool>;
	createMessageThread: ReturnType<typeof createMessageThreadTool>;
};
