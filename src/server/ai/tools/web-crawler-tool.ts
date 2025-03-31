import { env } from "cloudflare:workers";
import type { AgentToolAnnotation, ToolSource } from "@shared/types";
import { type DataStreamWriter, generateObject, tool } from "ai";
import FirecrawlApp from "@mendable/firecrawl-js";
import { nanoid } from "nanoid";
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";

const baseTaskSchema = z.object({
	taskId: z.string().describe("Unique identifier for this specific task."),
	taskType: z
		.enum(["scrape", "crawl"])
		.describe(
			"The type of action: 'scrape' for a single URL, 'crawl' for a starting URL and its subpages.",
		),
	description: z
		.string()
		.optional()
		.describe("Brief description of why this task is needed for the query."),
});

const scrapeTaskSchema = baseTaskSchema.extend({
	taskType: z.literal("scrape"),
	url: z.string().url().describe("The exact URL to scrape."),
});

const crawlTaskSchema = baseTaskSchema.extend({
	taskType: z.literal("crawl"),
	startUrl: z
		.string()
		.url()
		.describe("The starting URL for the crawl operation."),
	parameters: z
		.object({
			depth: z
				.number()
				.int()
				.min(0)
				.max(3)
				.default(1)
				.describe(
					"Crawling depth (0=start_url only, 1=start_url + direct links, max 3).",
				),
			maxPages: z
				.number()
				.int()
				.positive()
				.optional()
				.describe(
					"Optional: Maximum number of pages to retrieve during the crawl.",
				),
		})
		.describe("Parameters specific to the crawl task."),
});

const taskSchema = z.discriminatedUnion("taskType", [
	scrapeTaskSchema,
	crawlTaskSchema,
]);

const webScrapePlanSchema = z.object({
	relevantTaskSources: z
		.array(z.string().url())
		.describe(
			"List of URLs from the initial sources that the AI decided are relevant and included in the tasks.",
		),
	tasks: z
		.array(taskSchema)
		.min(1)
		.describe(
			"The sequence of scrape or crawl tasks to execute to gather information for the query.",
		),
});

type WebScrapePlan = z.infer<typeof webScrapePlanSchema>;

interface CrawlResult {
	type: "crawl";
	taskId: string;
	status: "completed" | "failed";
	data?: string[];
	error?: string;
}
interface ScrapeResult {
	type: "scrape";
	taskId: string;
	status: "completed" | "failed";
	data?: string;
	error?: string;
}

type TaskResult = CrawlResult | ScrapeResult;

export const webCrawlerTool = (dataStream: DataStreamWriter) =>
	tool({
		description:
			"Performs web scraping or crawling based on a query and potential sources. Use when detailed, up-to-date information from specific websites is needed. Generates a plan (scrape single pages or crawl starting URLs) and executes it.",
		parameters: z.object({
			query: z
				.string()
				.describe("The specific query requiring web information."),
			relevantSources: z
				.array(
					z.object({
						url: z.string().url().describe("The URL of a potential source."),
						title: z.string().describe("The title of the source."),
						description: z
							.string()
							.describe(
								"Description of the source on how it is relevant to the query.",
							),
					}),
				)
				.min(1) // Require at least one source to consider
				.describe(
					"A list of potential web sources (URLs with title/description) relevant to the query.",
				),
		}),
		execute: async (
			{ query, relevantSources },
			{ toolCallId },
		): Promise<{
			sources: ToolSource[];
			results: Record<string, TaskResult>;
		}> => {
			console.log(
				`[webCrawlerTool] Starting web crawl/scrape for query: "${query}"`,
			);
			const overallStartTime = Date.now();
			const results: Record<string, TaskResult> = {}; // Store results by task_id

			// --- 1. Send Annotation: Starting ---
			const startAnnotation = {
				toolCallId,
				id: nanoid(),
				type: "plan",
				message: `Planning web crawl/scrape for: ${query}`,
				status: "processing",
				timestamp: Date.now(),
			} satisfies AgentToolAnnotation;
			dataStream.writeMessageAnnotation(startAnnotation);

			// --- 2. Generate the Plan ---
			let generatedPlan: WebScrapePlan | null = null;
			try {
				const openAIClient = createOpenAI({
					baseURL: env.AI_GATEWAY_OPENAI_URL,
					apiKey: env.OPENAI_API_KEY,
				});

				const sourceList = relevantSources
					.map(
						(s) =>
							`- ${s.title}: ${s.url} (${s.description || "No description"})`,
					)
					.join("\n");

				const systemPrompt = `You are an expert planning agent for web scraping and crawling. Your goal is to create a concise plan to gather information relevant to the user's query using the provided sources.
Available task types:
- scrape: Fetches content from a single, specific URL. Use this for targeted information retrieval from one page.
- crawl: Starts at a URL and follows links to a specified depth. Use this to explore a section of a website or gather broader context. Max depth should generally be 1 or 2 unless necessary.

Instructions:
1. Analyze the query: "${query}".
2. Review the potential sources:\n${sourceList}\n
3. Decide which sources are most relevant and likely to contain the answer. Include these URLs in the 'relevant_task_sources' list.
4. For each chosen source, decide if a 'scrape' or 'crawl' task is more appropriate.
5. If crawling, specify a reasonable 'depth' (usually 0, 1, or 2) and optionally 'max_pages'.
6. Generate a plan conforming to the provided schema with at least one task. Assign a unique 'task_id' to each task (e.g., "task-001", "task-002").
7. Add a brief 'description' to each task explaining its purpose in relation to the query.`;

				const {
					object: planObject,
					finishReason,
					usage,
				} = await generateObject({
					model: openAIClient("gpt-4o"),
					schema: webScrapePlanSchema,
					prompt: `Create a web scraping/crawling plan to answer the query: "${query}" using the provided sources.`,
					system: systemPrompt,
				});

				console.log(
					"[webCrawlerTool] Plan Generation Finished. Reason:",
					finishReason,
					"Usage:",
					usage,
				);

				if (finishReason !== "stop" && finishReason !== "tool-calls") {
					throw new Error(
						`Plan generation failed or was incomplete. Finish reason: ${finishReason}`,
					);
				}

				generatedPlan = planObject;
				console.log(
					"[webCrawlerTool] Generated Plan:",
					JSON.stringify(generatedPlan, null, 2),
				);

				const planAnnotation = {
					toolCallId,
					id: nanoid(),
					type: "plan",
					message: `Plan generated with ${generatedPlan.tasks.length} tasks. Starting execution.`,
					status: "complete",
					data: { plan: generatedPlan },
					timestamp: Date.now(),
				} satisfies AgentToolAnnotation;
				dataStream.writeMessageAnnotation(planAnnotation);
			} catch (error) {
				console.error("[webCrawlerTool] Error generating plan:", error);
				if (error instanceof Error) {
					const errorAnnotation = {
						toolCallId,
						id: nanoid(),
						type: "plan",
						message: `Failed to generate web crawl/scrape plan: ${error.message}`,
						status: "failed",
						timestamp: Date.now(),
					} satisfies AgentToolAnnotation;

					dataStream.writeMessageAnnotation(errorAnnotation);
				}
				return { sources: [], results: {} };
			}

			if (!generatedPlan || generatedPlan.tasks.length === 0) {
				const noPlanAnnotation = {
					toolCallId,
					id: nanoid(),
					type: "plan",
					message: "No relevant tasks identified in the plan. Cannot proceed.",
					status: "failed", // Or complete if this is valid behavior
					timestamp: Date.now(),
				} satisfies AgentToolAnnotation;
				dataStream.writeMessageAnnotation(noPlanAnnotation);
				return { sources: [], results: {} };
			}

			// --- 3. Execute the Plan ---
			const app = new FirecrawlApp({ apiKey: env.FIRECRAWL_API_KEY });

			for (const task of generatedPlan.tasks) {
				const taskStartTime = Date.now();
				const taskStartAnnotation = {
					toolCallId,
					id: nanoid(),
					type: task.taskType,
					message: `Starting task ${task.taskId}: ${task.taskType} - ${task.description || (task.taskType === "scrape" ? task.url : task.startUrl)}`,
					status: "processing",

					timestamp: taskStartTime,
				} satisfies AgentToolAnnotation;
				dataStream.writeMessageAnnotation(taskStartAnnotation);

				try {
					if (task.taskType === "scrape") {
						console.log(
							`[webCrawlerTool] Executing scrape task ${task.taskId} for URL: ${task.url}`,
						);

						const scrapeResponse = await app.scrapeUrl(task.url, {
							formats: ["markdown"], // Always get markdown
							onlyMainContent: false, // Defaulting to main content
							// timeout: 30000 // Consider adding timeouts
						});

						if (scrapeResponse.success) {
							const scrapeResult: ScrapeResult = {
								type: "scrape",
								taskId: task.taskId,
								status: "completed",
								data: scrapeResponse.markdown,
							};
							results[task.taskId] = scrapeResult;
						} else {
							throw new Error(scrapeResponse.error || "Unknown scrape error");
						}
					} else if (task.taskType === "crawl") {
						console.log(
							`[webCrawlerTool] Executing crawl task ${task.taskId} starting at: ${task.startUrl} with depth ${task.parameters.depth}`,
						);

						// Using synchronous crawlUrl for simplicity (handles polling internally)
						// WARNING: This can block the Node.js event loop for long crawls.
						// For production, consider app.asyncCrawlUrl + external polling/queue.
						const crawlResponse = await app.crawlUrl(
							task.startUrl,
							{
								maxDepth: task.parameters.depth,
								limit: task.parameters.maxPages, // Pass limit if provided
								// includePaths: task.parameters.focus_paths, // focus_paths removed from schema for simplicity, could be added back
								scrapeOptions: {
									formats: ["markdown"], // Always get markdown and metadata per page
									onlyMainContent: false, // Defaulting to main content for crawled pages
								},
								// timeout: 180000 // Consider adding overall crawl timeout
							},
							//, poll_interval=5 // Optional: Adjust polling frequency if needed (default is usually fine)
						);

						if (crawlResponse.success) {
							const resultsParsed = crawlResponse.data
								.map((d) => d.markdown)
								.filter((d): d is string => d !== undefined);
							const crawlResult: CrawlResult = {
								type: "crawl",
								taskId: task.taskId,
								status: "completed",
								data: resultsParsed,
							};
							results[task.taskId] = crawlResult;
						} else {
							throw new Error(crawlResponse.error || "Unknown crawl error");
						}
					}

					const taskCompleteAnnotation = {
						toolCallId,
						id: nanoid(),
						type: task.taskType,
						message: `Completed task ${task.taskId} (${task.taskType}) in ${((Date.now() - taskStartTime) / 1000).toFixed(2)}s.`,
						status: "complete",
						data: {
							stage: "executing",
							taskId: task.taskId,
							taskType: task.taskType,
							durationMs: Date.now() - taskStartTime,
						},
						timestamp: Date.now(),
					} satisfies AgentToolAnnotation;
					dataStream.writeMessageAnnotation(taskCompleteAnnotation);
				} catch (error) {
					console.error(
						`[webCrawlerTool] Error executing task ${task.taskId} (${task.taskType}):`,
						error,
					);
					if (error instanceof Error) {
						const taskResult: TaskResult = {
							type: task.taskType,
							taskId: task.taskId,
							status: "failed",
							error: error.message,
						};
						results[task.taskId] = taskResult;
						const taskErrorAnnotation = {
							toolCallId,
							id: nanoid(),
							type: task.taskType,
							message: `Failed task ${task.taskId} (${task.taskType}): ${error.message}`,
							status: "failed",
							timestamp: Date.now(),
						} satisfies AgentToolAnnotation;
						dataStream.writeMessageAnnotation(taskErrorAnnotation);
					}
					// Decide whether to continue with other tasks or stop here
					// For now, we'll continue
				}
			}

			// --- 4. Final Result ---
			const overallDuration = Date.now() - overallStartTime;
			console.log(
				`[webCrawlerTool] Completed all tasks in ${(overallDuration / 1000).toFixed(2)}s.`,
			);

			const finalAnnotation = {
				toolCallId,
				id: nanoid(),
				type: "finish",
				message: `Web crawl/scrape finished in ${(overallDuration / 1000).toFixed(2)}s.`,
				status: "complete",
				data: {
					durationMs: overallDuration,
					resultsSummary: Object.values(results).map((r) => ({
						id: r.taskId,
						status: r.status,
					})),
				},
				timestamp: Date.now(),
			} satisfies AgentToolAnnotation;
			dataStream.writeMessageAnnotation(finalAnnotation);

			const finalSources: ToolSource[] = relevantSources.map((s) => ({
				type: "url",
				url: s.url,
				title: s.title,
				content: "",
				icon: s.icon, // Can we get icon
			}));

			// Return the collected raw data, keyed by task_id
			// The calling agent is responsible for synthesizing this
			return {
				sources: finalSources,
				results: results,
			};
		},
	});
