import { env } from "cloudflare:workers";
import type { AgentToolAnnotation, ToolSource } from "@shared/types";
import { type DataStreamWriter, generateObject, tool } from "ai";
import FirecrawlApp, {
	type FirecrawlDocumentMetadata,
} from "@mendable/firecrawl-js"; // Import necessary types
import { nanoid } from "nanoid";
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from '@ai-sdk/google';

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
				.max(30)
				.optional()
				.default(10)
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

interface PageData {
	markdown: string;
	metadata: FirecrawlDocumentMetadata;
}

interface CrawlResult {
	type: "crawl";
	taskId: string;
	startUrl: string;
	status: "completed" | "failed";
	data?: PageData[];
	error?: string;
}
interface ScrapeResult {
	type: "scrape";
	taskId: string;
	url: string;
	status: "completed" | "failed";
	data?: PageData;
	error?: string;
}

type TaskResult = CrawlResult | ScrapeResult;

// Helper function to trim markdown content
function trimMarkdown(markdown: string | undefined, maxLength = 300): string {
	if (!markdown) {
		return "No content retrieved.";
	}
	if (markdown.length <= maxLength) {
		return markdown;
	}
	// Find the last space within the limit to avoid cutting words
	let trimmed = markdown.substring(0, maxLength);
	const lastSpace = trimmed.lastIndexOf(" ");
	if (lastSpace > 0) {
		trimmed = trimmed.substring(0, lastSpace);
	}
	return `${trimmed}...`;
}

export const webCrawlerTool = (dataStream: DataStreamWriter) =>
	tool({
		description: `Performs web scraping or crawling based on a query and potential sources. Use when detailed, up-to-date information from specific websites is needed. Generates a plan (scrape single pages or crawl starting URLs) and executes it.
			- NEVER call this tool multiple times in a row, this is highly important.
			`,
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
							.optional() // Make description optional as it might not always be there
							.describe(
								"Description of the source on how it is relevant to the query.",
							),
						approach: z
							.enum(["scrape", "crawl"])
							.optional()
							.describe(
								"The approach to use for the source. It can be 'scrape' or 'crawl'.",
							),
					}),
				)
				.min(1) // Require at least one source to consider
				.describe(
					"A list of potential web sources (URLs with title/description/icon) relevant to the query.",
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
							`- ${s.title || "Untitled"}: ${s.url} (${
								s.description || "No description"
							}) ${s.approach ? `(approach: ${s.approach})` : ""}`,
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

				if (finishReason !== "stop") {
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
				const message =
					error instanceof Error ? error.message : "Unknown error";
				const errorAnnotation = {
					toolCallId,
					id: nanoid(),
					type: "plan",
					message: `Failed to generate web crawl/scrape plan: ${message}`,
					status: "failed",
					timestamp: Date.now(),
				} satisfies AgentToolAnnotation;
				dataStream.writeMessageAnnotation(errorAnnotation);
				return { sources: [], results: {} }; // Stop execution if plan fails
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

						// Request both markdown and metadata
						const scrapeResponse = await app.scrapeUrl(task.url, {
							formats: ["markdown"], // <-- Request metadata
							onlyMainContent: true, // Keep as per original request
							// timeout: 30000 // Consider adding timeouts
						});

						if (scrapeResponse.success) {
							// Type assertion for clarity if needed, or check fields exist
							if (scrapeResponse.markdown && scrapeResponse.metadata) {
								const scrapeResult: ScrapeResult = {
									type: "scrape",
									taskId: task.taskId,
									url: task.url, // Store the URL
									status: "completed",
									data: {
										markdown: scrapeResponse.markdown,
										metadata: scrapeResponse.metadata, // Store metadata
									},
								};
								results[task.taskId] = scrapeResult;
							} else {
								console.error(
									`[webCrawlerTool] Scrape response missing required fields for task ${task.taskId}:`,
									scrapeResponse,
								);
							}
						} else {
							throw new Error(scrapeResponse.error || "Unknown scrape error");
						}
					} else if (task.taskType === "crawl") {
						console.log(
							`[webCrawlerTool] Executing crawl task ${task.taskId} starting at: ${task.startUrl} with depth ${task.parameters.depth}`,
						);

						// Request markdown and metadata for each crawled page
						const crawlResponse = await app.crawlUrl(
							task.startUrl,
							{
								maxDepth: task.parameters.depth,
								limit: task.parameters.maxPages,
								scrapeOptions: {
									formats: ["markdown"], // <-- Request metadata
									onlyMainContent: true, // Keep as per original request
								},
							},
							// poll_interval=5 // Optional
						);

						if (crawlResponse.success) {
							// Filter out pages that might have failed scraping during the crawl
							const crawledPages = crawlResponse.data.map((d) => ({
								markdown: d.markdown,
								metadata: d.metadata,
							}));

							const filteredCrawledPages = crawledPages.filter(
								(d): d is PageData => !!d.metadata?.sourceURL && !!d.markdown,
							);

							const crawlResult: CrawlResult = {
								type: "crawl",
								taskId: task.taskId,
								startUrl: task.startUrl, // Store start URL
								status: "completed",
								data: filteredCrawledPages, // Store the structured data
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
					const message =
						error instanceof Error ? error.message : "Unknown error";

					// @ts-expect-error
					const taskResult: TaskResult = {
						type: task.taskType,
						taskId: task.taskId,
						status: "failed",
						error: message,
						// Add URL/startUrl for context in failed results
						...(task.taskType === "scrape" && { url: task.url }),
						...(task.taskType === "crawl" && { startUrl: task.startUrl }),
					};
					results[task.taskId] = taskResult;

					const taskErrorAnnotation = {
						toolCallId,
						id: nanoid(),
						type: task.taskType,
						message: `Failed task ${task.taskId} (${task.taskType}): ${message}`,
						status: "failed",
						timestamp: Date.now(),
					} satisfies AgentToolAnnotation;
					dataStream.writeMessageAnnotation(taskErrorAnnotation);
					// Continue with other tasks even if one fails
				}
			}

			// --- 4. Process Results and Construct Final Sources ---
			const finalSources: ToolSource[] = [];
			const processedUrls = new Set<string>(); // To avoid duplicates

			for (const result of Object.values(results)) {
				if (result.status !== "completed") {
					continue;
				} // Skip failed tasks

				if (result.type === "scrape" && result.data) {
					const url = result.url;
					if (!processedUrls.has(url)) {
						const metadata = result.data.metadata;
						const description =
							metadata?.ogDescription || metadata?.description || "";
						const content = description
							? description
							: trimMarkdown(result.data.markdown);

						finalSources.push({
							type: "url",
							url: url,
							title: metadata?.ogTitle || metadata?.title || url,
							icon: metadata?.ogImage, // Use og:image if available
							content: content,
						});
						processedUrls.add(url);
					}
				} else if (result.type === "crawl" && result.data) {
					for (const pageData of result.data) {
						const url = pageData.metadata.sourceURL; // sourceURL must exist here
						if (url && !processedUrls.has(url)) {
							const metadata = pageData.metadata;
							const description =
								metadata?.ogDescription || metadata?.description || "";
							const content = description
								? description
								: trimMarkdown(pageData.markdown);

							finalSources.push({
								type: "url",
								url: url,
								title: metadata?.ogTitle || metadata?.title || url,
								icon: metadata?.ogImage, // Use og:image if available
								content: content,
							});
							processedUrls.add(url);
						}
					}
				}
			}

			const geminiClient = createGoogleGenerativeAI({
				baseURL: env.AI_GATEWAY_GEMINI_URL,
				apiKey: env.GEMINI_API_KEY,
			});

			const systemPrompt = "";

			const {
				object: synthetyzedResponse,
			} = await generateObject({
				model: geminiClient("gemini-1.5-flash"),
				schema: webScrapePlanSchema,
				prompt: "",
				system: systemPrompt,
			});

			// --- 5. Final Annotation ---
			const overallDuration = Date.now() - overallStartTime;
			console.log(
				`[webCrawlerTool] Completed all tasks in ${(overallDuration / 1000).toFixed(2)}s. Found ${finalSources.length} unique sources.`,
			);

			const finalAnnotation = {
				toolCallId,
				id: nanoid(),
				type: "finish",
				message: `Web crawl/scrape finished in ${(overallDuration / 1000).toFixed(2)}s. Processed ${finalSources.length} sources.`,
				status: "complete",
				data: {
					durationMs: overallDuration,
					sourceCount: finalSources.length,
				},
				timestamp: Date.now(),
			} satisfies AgentToolAnnotation;
			dataStream.writeMessageAnnotation(finalAnnotation);

			// Return the final sources and the detailed results
			return {
				sources: finalSources,
				results: results, // Return the raw, detailed results keyed by task_id
			};
		},
	});
