import type { createMessageThreadTool } from "./create-thread-tool";
import type { deepResearchTool } from "./deep-search-tool";
import type { webCrawlerTool } from "./web-crawler-tool";
import type { webSearchTool } from "./web-search-tool";

export type AgentToolSet = {
	webSearch: ReturnType<typeof webSearchTool>;
	deepResearch: ReturnType<typeof deepResearchTool>;
	webCrawl: ReturnType<typeof webCrawlerTool>;
	createMessageThread: ReturnType<typeof createMessageThreadTool>;
};
