import { env } from "cloudflare:workers";
import type {
	AgentToolAnnotation,
	ChatRoomMessage,
	ChatRoomMessagePartial,
	ToolSource,
} from "@shared/types";
import { type DataStreamWriter, tool } from "ai";
import FirecrawlApp from "firecrawl";
import { customAlphabet, nanoid } from "nanoid";
import { z } from "zod";

export const searchInformationTool = (dataStream: DataStreamWriter) =>
	tool({
		description:
			"Use this tool when the user asks you to search for any kind of information or requires more information about a topic",
		parameters: z.object({
			query: z.string().describe("The search query"),
		}),
		execute: async ({ query }, { toolCallId }: { toolCallId: string }) => {
			// Step 1: Send "starting search" annotation
			const startAnnotation = {
				toolCallId,
				id: nanoid(),
				type: "search_started",
				message: `Starting search for: ${query}`,
				data: {},
				status: "processing",
				timestamp: Date.now(),
			} satisfies AgentToolAnnotation;
			dataStream.writeMessageAnnotation(startAnnotation);

			// Step 2: Perform the search
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

			const data = (await response.json()) as {
				web: {
					results: {
						title: string;
						url: string;
						description: string;
						extra_snippets: string[];
					}[];
				};
			};
			const results = data.web?.results || [];

			// Step 3: Process results into structured format
			const processedResults: ToolSource[] = results.map(
				(r: {
					title: string;
					url: string;
					description: string;
					extra_snippets: string[];
				}) => {
					const content = [r.description, ...(r.extra_snippets || [])].join(
						"\n",
					);
					return {
						type: "url",
						url: r.url,
						title: r.title,
						content,
					};
				},
			);

			// Step 4: Send "finalized search" annotation
			const endAnnotation = {
				toolCallId,
				id: nanoid(),
				type: "search_finalized",
				message: `Search completed, found ${results.length} results`,
				data: { totalResults: results.length },
				status: "complete",
				timestamp: Date.now(),
			} satisfies AgentToolAnnotation;

			dataStream.writeMessageAnnotation(endAnnotation);

			// Step 5: Return the structured results
			return { sources: processedResults };
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

			const result = await firecrawl.deepResearch(
				query,
				{
					maxDepth: 1, // Number of research iterations
					timeLimit: 40, // Time limit in seconds
					maxUrls: 2, // Maximum URLs to analyze
				},
				({ type, message, depth, status, timestamp }) => {
					const annotation = {
						toolCallId,
						id: nanoid(),
						type: type,
						message: message,
						status: status as "processing" | "complete" | "failed",
						data: {
							depth,
							status,
							timestamp,
						},
						timestamp: Date.now(),
					} satisfies AgentToolAnnotation;
					dataStream.writeMessageAnnotation(annotation);
				},
			);

			if (result.success) {
				const { finalAnalysis, sources } = result.data;
				const processedSources: ToolSource[] = sources.map(
					(s: {
						url: string;
						title: string;
						description: string;
						icon?: string;
					}) => ({
						type: "url",
						url: s.url,
						title: s.title,
						content: s.description,
						icon: s.icon && s.icon.trim().length > 0 ? s.icon : undefined,
					}),
				);
				console.log("[deepResearchTool] Finished deep research.");
				return {
					sources: processedSources,
					finalAnalysis,
				};
			}

			console.error("[deepResearchTool] Failed to perform deep research.");

			return { sources: [], finalAnalysis: "" };
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
