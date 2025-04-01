import { env } from "cloudflare:workers";
import type { AgentToolAnnotation, ToolSource } from "@shared/types";
import { type DataStreamWriter, generateObject, tool } from "ai";
import FirecrawlApp, {
	type FirecrawlDocumentMetadata,
} from "@mendable/firecrawl-js";
import { nanoid } from "nanoid";
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

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
	url: z.string().describe("The exact URL to scrape."),
});

const crawlTaskSchema = baseTaskSchema.extend({
	taskType: z.literal("crawl"),
	startUrl: z.string().describe("The starting URL for the crawl operation."),
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
		.array(z.string())
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

const synthesizedResultSchema = z.object({
	title: z.string().describe("A concise title for the synthesized answer."),
	explanation: z
		.string()
		.describe(
			"A detailed explanation answering the original query, based *only* on the provided context (the JSON results object).",
		),
	keyFindings: z
		.array(z.string())
		.describe(
			"Bulleted list of the most important points or findings relevant to the query, extracted from the successful tasks in the results object.",
		),
	interestingPoints: z
		.array(z.string())
		.optional()
		.describe(
			"Optional: Additional interesting details or related information found in the successful tasks within the results object.",
		),
	limitations: z
		.string()
		.describe(
			"A brief statement acknowledging that the answer is based solely on the provided JSON results object and might not be exhaustive (mention if some tasks failed or yielded no data).",
		),
});

type SynthesizedResult = z.infer<typeof synthesizedResultSchema>;

// Helper function to trim markdown content (used for ToolSource preview)
function trimMarkdown(markdown: string | undefined, maxLength = 300): string {
	if (!markdown) {
		return "No content retrieved.";
	}
	if (markdown.length <= maxLength) {
		return markdown;
	}
	let trimmed = markdown.substring(0, maxLength);
	const lastSpace = trimmed.lastIndexOf(" ");
	if (lastSpace > 0) {
		trimmed = trimmed.substring(0, lastSpace);
	}
	return `${trimmed}...`;
}

export const webCrawlerTool = (dataStream: DataStreamWriter) =>
	tool({
		description: `Performs web scraping or crawling based on a query and potential sources. Use when detailed, up-to-date information from specific websites is needed. Generates a plan, executes it, synthesizes the results (passed as a raw JSON object) into a structured answer using an AI, and returns the structured answer with citation sources.
			- NEVER call this tool multiple times in a row, this is highly important.
			`,
		parameters: z.object({
			query: z
				.string()
				.describe("The specific query requiring web information."),
			relevantSources: z
				.array(
					z.object({
						url: z.string().describe("The URL of a potential source."),
						title: z.string().describe("The title of the source."),
						description: z
							.string()
							.optional()
							.describe(
								"Description of the source on how it is relevant to the query.",
							),
						approach: z
							.enum(["scrape", "crawl"])
							.optional()
							.default("scrape")
							.describe(
								"The approach to use for the source: 'scrape' (default) or 'crawl'.",
							),
					}),
				)
				.min(1)
				.describe("A list of potential web sources relevant to the query."),
		}),
		execute: async (
			{ query, relevantSources },
			{ toolCallId },
		): Promise<{
			synthesizedAnswer?: SynthesizedResult;
			sources: ToolSource[];
			error?: string;
		}> => {
			console.log(
				`[webCrawlerTool] Starting web crawl/scrape for query: "${query}"`,
			);
			const overallStartTime = Date.now();
			const results: Record<string, TaskResult> = {};
			let errorMessage: string | undefined = undefined;

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
							}) (approach: ${s.approach})`,
					)
					.join("\n");

				const systemPrompt = `You are an expert planning agent for web scraping and crawling. Your goal is to create a concise plan to gather information relevant to the user's query using the provided sources.
Available task types:
- scrape: Fetches content from a single, specific URL. Use this for targeted information retrieval from one page.
- crawl: Starts at a URL and follows links to a specified depth. Use this to explore a section of a website or gather broader context. Max depth should generally be 1 or 2 unless necessary. Max pages default to 10.
Instructions:
1. Analyze the query: "${query}".
2. Review the potential sources:\n${sourceList}\n
3. Decide which sources are most relevant and likely to contain the answer. Include these URLs in the 'relevant_task_sources' list.
4. For each chosen source, decide if a 'scrape' or 'crawl' task is more appropriate based on the source description and the 'approach' hint (defaulting to 'scrape' if unspecified).
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

				if (finishReason !== "stop" || !planObject) {
					throw new Error(
						`Plan generation failed or incomplete. Finish reason: ${finishReason}`,
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
				errorMessage = `Failed to generate web crawl/scrape plan: ${
					error instanceof Error ? error.message : "Unknown error"
				}`;
				const errorAnnotation = {
					toolCallId,
					id: nanoid(),
					type: "plan",
					message: errorMessage,
					status: "failed",
					timestamp: Date.now(),
				} satisfies AgentToolAnnotation;
				dataStream.writeMessageAnnotation(errorAnnotation);

				return { sources: [], error: errorMessage };
			}

			if (!generatedPlan || generatedPlan.tasks.length === 0) {
				errorMessage =
					"No relevant tasks identified in the plan. Cannot proceed.";
				const noPlanAnnotation = {
					toolCallId,
					id: nanoid(),
					type: "plan",
					message: errorMessage,
					status: "failed",
					timestamp: Date.now(),
				} satisfies AgentToolAnnotation;
				dataStream.writeMessageAnnotation(noPlanAnnotation);
				return { sources: [], error: errorMessage };
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
					let taskResult: TaskResult;
					if (task.taskType === "scrape") {
						console.log(
							`[webCrawlerTool] Executing scrape task ${task.taskId} for URL: ${task.url}`,
						);
						const scrapeResponse = await app.scrapeUrl(task.url, {
							formats: ["markdown"],
							onlyMainContent: true,
						});

						if (
							scrapeResponse.success &&
							scrapeResponse.markdown &&
							scrapeResponse.metadata
						) {
							taskResult = {
								type: "scrape",
								taskId: task.taskId,
								url: task.url,
								status: "completed",
								data: {
									// Scrape has single PageData
									markdown: scrapeResponse.markdown,
									metadata: scrapeResponse.metadata,
								},
							};
						} else {
							throw new Error(
								scrapeResponse.error ||
									"Scrape failed or missing essential data",
							);
						}
					} else {
						console.log(
							`[webCrawlerTool] Executing crawl task ${task.taskId} starting at: ${task.startUrl} with depth ${task.parameters.depth}`,
						);
						const crawlResponse = await app.crawlUrl(task.startUrl, {
							maxDepth: task.parameters.depth,
							limit: task.parameters.maxPages,
							scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
						});

						if (crawlResponse.success && crawlResponse.data) {
							const filteredPages = crawlResponse.data
								.map((d) => ({ markdown: d.markdown, metadata: d.metadata }))

								.filter(
									(d): d is PageData =>
										!!d.metadata?.sourceURL &&
										d.markdown !== undefined &&
										d.markdown !== null,
								);

							taskResult = {
								type: "crawl",
								taskId: task.taskId,
								startUrl: task.startUrl,
								status: "completed",
								data: filteredPages,
							};
						} else {
							throw new Error(
								"error" in crawlResponse ? crawlResponse.error : "Crawl failed",
							);
						}
					}
					results[task.taskId] = taskResult;

					const taskCompleteAnnotation = {
						toolCallId,
						id: nanoid(),
						type: task.taskType,
						message: `Completed task ${task.taskId} (${task.taskType}) in ${((Date.now() - taskStartTime) / 1000).toFixed(2)}s.`,
						status: "complete",
						data: {
							taskId: task.taskId,
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

					results[task.taskId] = {
						type: task.taskType,
						taskId: task.taskId,
						status: "failed",
						error: message,
						...(task.taskType === "scrape" && { url: task.url }),
						...(task.taskType === "crawl" && { startUrl: task.startUrl }),
					} as TaskResult;

					const taskErrorAnnotation = {
						toolCallId,
						id: nanoid(),
						type: task.taskType,
						message: `Failed task ${task.taskId} (${task.taskType}): ${message}`,
						status: "failed",
						timestamp: Date.now(),
					} satisfies AgentToolAnnotation;
					dataStream.writeMessageAnnotation(taskErrorAnnotation);
				}
			}

			// --- 4. Construct Final Sources (for citation) ---
			const finalSources: ToolSource[] = [];
			const processedUrls = new Set<string>();

			for (const result of Object.values(results)) {
				if (result.status !== "completed") {
					continue;
				}

				if (result.type === "scrape" && result.data) {
					const url = result.url;
					if (!processedUrls.has(url)) {
						const metadata = result.data.metadata;
						const title = metadata?.ogTitle || metadata?.title || url;
						const description =
							metadata?.ogDescription || metadata?.description || "";

						const previewContent = description
							? description
							: trimMarkdown(result.data.markdown, 250);

						finalSources.push({
							type: "url",
							url,
							title,
							icon: metadata?.ogImage,
							content: previewContent,
						});
						processedUrls.add(url);
					}
				} else if (result.type === "crawl" && result.data) {
					for (const pageData of result.data) {
						const url = pageData.metadata?.sourceURL;
						if (url && !processedUrls.has(url)) {
							const metadata = pageData.metadata;
							const title = metadata?.ogTitle || metadata?.title || url;
							const description =
								metadata?.ogDescription || metadata?.description || "";
							const previewContent = description
								? description
								: trimMarkdown(pageData.markdown, 250);

							finalSources.push({
								type: "url",
								url,
								title,
								icon: metadata?.ogImage,
								content: previewContent,
							});
							processedUrls.add(url);
						}
					}
				}
			}

			// --- 5. Synthesize Results with Gemini ---
			let synthesizedAnswer: SynthesizedResult | undefined = undefined;
			const synthesisStartTime = Date.now();

			const hasSuccessfulData = Object.values(results).some(
				(r) => r.status === "completed" && r.data,
			);

			if (!hasSuccessfulData) {
				errorMessage =
					"No content was successfully retrieved from any task to synthesize an answer.";
				console.log("[webCrawlerTool] Skipping synthesis:", errorMessage);
				dataStream.writeMessageAnnotation({
					toolCallId,
					id: nanoid(),
					type: "synthesis",
					message:
						"Skipping synthesis: No successful scrape/crawl results with data.",
					status: "failed",
					timestamp: Date.now(),
				} satisfies AgentToolAnnotation);
			} else {
				const synthesisStartAnnotation = {
					toolCallId,
					id: nanoid(),
					type: "synthesis",
					message: "Synthesizing content from raw results object...",
					status: "processing",
					timestamp: synthesisStartTime,
				} satisfies AgentToolAnnotation;
				dataStream.writeMessageAnnotation(synthesisStartAnnotation);

				try {
					const geminiClient = createGoogleGenerativeAI({
						//baseURL: env.AI_GATEWAY_GEMINI_URL,
						apiKey: env.GEMINI_API_KEY,
					});

					const resultsJsonString = JSON.stringify(results, null, 2);

					const resultTokenCount = resultsJsonString.length / 4;

					const MAX_CONTEXT_LENGTH = 400000;
					if (resultTokenCount > MAX_CONTEXT_LENGTH) {
						console.warn(
							`[webCrawlerTool] Results JSON string token count (${resultTokenCount}) exceeds limit (${MAX_CONTEXT_LENGTH}). Potential truncation or errors.`,
						);
						// Consider truncation strategy or erroring out if too large
						// For now, just warn and proceed
					}

					const synthesisSystemPrompt = `You are an AI assistant specialized in synthesizing information from a raw JSON object containing web scraping/crawling results.
Your goal is to answer the user's original query accurately and descriptively, using *only* the information contained within the provided JSON object. Do not add external knowledge or assumptions.

The user's query is: "${query}"

The input you will receive is a JSON object where keys are task IDs and values are objects representing the result of each task ('scrape' or 'crawl'). Each result object has a 'status' field ('completed' or 'failed').
For 'completed' tasks:
- Look inside the 'data' field.
- If the task 'type' is 'scrape', 'data' will be an object containing 'markdown' and 'metadata'.
- If the task 'type' is 'crawl', 'data' will be an array of objects, each containing 'markdown' and 'metadata'.
- Extract the relevant information *only* from the 'markdown' content of these successful tasks to answer the query.

You MUST structure your response according to the following JSON schema:
- title: A concise title for the synthesized answer.
- explanation: A detailed explanation answering the original query, based *only* on the markdown content found in the successful tasks within the input JSON.
- keyFindings: Bulleted list of the most important points relevant to the query found in the markdown content.
- interestingPoints: (Optional) Additional interesting details found.
- limitations: A brief statement acknowledging the answer is based *only* on the provided JSON. Mention if any tasks failed (check 'status: "failed"') or if relevant information might be missing.

Analyze the provided JSON object carefully. Ignore tasks with 'status: "failed"'. Extract information *only* from the 'markdown' fields of successful tasks.`;

					const synthesisPrompt = `Based on the user query "${query}", synthesize the information contained *only* within the following JSON results object. Structure your answer according to the required schema.\n\nJSON Results Object:\n\`\`\`json\n${resultsJsonString}\n\`\`\``;
					console.log(
						"[webCrawlerTool] Synthesizing results with Gemini...",
						synthesisPrompt,
					);
					const {
						object: synthesisObject,
						finishReason,
						usage,
					} = await generateObject({
						model: geminiClient("gemini-1.5-flash"),
						schema: synthesizedResultSchema,
						prompt: synthesisPrompt,
						system: synthesisSystemPrompt,
					});

					console.log(
						"[webCrawlerTool] Synthesis Finished. Reason:",
						finishReason,
						"Usage:",
						usage,
					);

					if (finishReason !== "stop" || !synthesisObject) {
						throw new Error(
							`Synthesis generation failed or incomplete. Finish reason: ${finishReason}`,
						);
					}

					synthesizedAnswer = synthesisObject;

					const synthesisCompleteAnnotation = {
						toolCallId,
						id: nanoid(),
						type: "synthesis",
						message: `Content synthesis completed in ${((Date.now() - synthesisStartTime) / 1000).toFixed(2)}s.`,
						status: "complete",
						data: { durationMs: Date.now() - synthesisStartTime },
						timestamp: Date.now(),
					} satisfies AgentToolAnnotation;
					dataStream.writeMessageAnnotation(synthesisCompleteAnnotation);
				} catch (error) {
					console.error("[webCrawlerTool] Error during synthesis:", error);
					errorMessage = `Failed to synthesize results: ${
						error instanceof Error ? error.message : "Unknown synthesis error"
					}`;

					const synthesisErrorAnnotation = {
						toolCallId,
						id: nanoid(),
						type: "synthesis",
						message: errorMessage,
						status: "failed",
						timestamp: Date.now(),
					} satisfies AgentToolAnnotation;
					dataStream.writeMessageAnnotation(synthesisErrorAnnotation);
				}
			}

			// --- 6. Final Annotation and Return ---
			const overallDuration = Date.now() - overallStartTime;
			const status = errorMessage ? "failed" : "complete";
			const finalMessage = `Web crawl/scrape finished in ${(overallDuration / 1000).toFixed(2)}s. ${
				errorMessage
					? `Error: ${errorMessage}`
					: `Synthesized answer successfully. Processed ${finalSources.length} sources.`
			}`;

			console.log(
				`[webCrawlerTool] ${status === "complete" ? "Completed" : "Finished with error"} in ${(overallDuration / 1000).toFixed(2)}s. Returning ${finalSources.length} sources.`,
			);

			const finalAnnotation = {
				toolCallId,
				id: nanoid(),
				type: "finish",
				message: finalMessage,
				status: status,
				data: { durationMs: overallDuration, sourceCount: finalSources.length },
				timestamp: Date.now(),
			} satisfies AgentToolAnnotation;
			dataStream.writeMessageAnnotation(finalAnnotation);

			return {
				synthesizedAnswer: synthesizedAnswer,
				sources: finalSources,
				error: errorMessage,
			};
		},
	});
