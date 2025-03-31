import { env } from "cloudflare:workers";
import type { AgentToolAnnotation } from "@shared/types";
import { type DataStreamWriter, generateObject, tool } from "ai";
import FirecrawlApp from "@mendable/firecrawl-js";
import { nanoid } from "nanoid";
import { z } from "zod";
import { createOpenAI } from "@ai-sdk/openai";

export const webCrawlerTool = (dataStream: DataStreamWriter) =>
	tool({
		description:
			"Crawl a website when user asks for detailed information, opinions, comprehensive analysis, or when webSearchTool is insufficient. Use specific queries.",
		parameters: z.object({
			query: z.string().describe("The specific query."),
			relevantSources: z
				.array(
					z.object({
						url: z.string().describe("The URL of the source."),
						title: z.string().describe("The title of the source."),
						description: z.string().describe("The description of the source."),
					}),
				)
				.describe("The relevant sources."),
		}),
		execute: async ({ query, relevantSources }, { toolCallId }) => {
			console.log("[webCrawlerTool] Starting web crawling for:", query);

			const openAIClient = createOpenAI({
				baseURL: env.AI_GATEWAY_OPENAI_URL,
				apiKey: env.OPENAI_API_KEY,
			});

			const { object: plan } = await generateObject({
				model: openAIClient("gpt-4o-mini"),
				system: "",
				schema: z.object({
					plan: z.string().describe("The plan for the web crawling."),
				}),
				prompt: "",
			});

			console.log("[webCrawlerTool] Plan:", plan);

			const annotation = {
				toolCallId,
				id: nanoid(),
				type: "crawl",
				message: `Starting web crawling for: ${query}`,
				status: "processing",
				data: {},
				timestamp: Date.now(),
			} satisfies AgentToolAnnotation;
			dataStream.writeMessageAnnotation(annotation);

			const app = new FirecrawlApp({ apiKey: env.FIRECRAWL_API_KEY });

			const crawlResponse = await app.crawlUrl("https://firecrawl.dev", {
				limit: 100,
				scrapeOptions: {
					formats: ["markdown", "html"],
				},
			});

			if (!crawlResponse.success) {
				throw new Error(`Failed to crawl: ${crawlResponse.error}`);
			}

			console.log(crawlResponse);

			return { sources: [], finalAnalysis: "" };
		},
	});
