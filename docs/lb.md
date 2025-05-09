This is the Langbase SDK, a monorepo for building AI-powered LLM products based on the "Composable AI" philosophy, which involves combining modular **Pipes** (for AI tasks) and **Memory** (for RAG).

**Core Packages:**

1.  **`langbase` (SDK - `packages/langbase/`):** The primary library.
    *   **Main Class:** `Langbase` (in `src/langbase/langbase.ts`) is the entry point, initialized with an `apiKey`.
    *   **Pipes (`langbase.pipes`):**
        *   Execute AI tasks: `run()` method is central, supporting streaming (`stream: true`) and non-streaming (`stream: false`) modes. Handles messages, variables, thread management (`threadId`), tools, and LLM API keys (`llmKey`).
        *   Pipe management: `create()`, `list()`, `update()`.
        *   Features: Chat, tool usage (helper functions like `getToolsFromRunStream`, `getToolsFromRun`), structured outputs (via `json: true` and `response_format` with JSON schema, e.g., using Zod).
    *   **Memory (`langbase.memories`):**
        *   Manage RAG: `create()` (with embedding model, chunk size/overlap), `list()`, `delete()`.
        *   Retrieve data: `retrieve()` (supports `query`, `memory` sources, `topK`, and advanced filtering: `And`, `Or`, `Eq`, `In`, `NotEq`, `NotIn`).
        *   Document handling: `documents.upload()` (takes `Buffer`, `File`, `FormData`, `ReadableStream`), `documents.list()`, `documents.delete()`, and `documents.embeddings.retry()`.
    *   **Threads (`langbase.threads`):**
        *   Conversation management: `create()`, `update()`, `get()`, `delete()`.
        *   Message management: `messages.list()`, `append()`.
    *   **Tools (`langbase.tools`):**
        *   External service integrations: `webSearch()` (e.g., Exa), `crawl()` (e.g., spider.cloud), requiring specific API keys.
    *   **AI Primitives:**
        *   `langbase.chunker()` / `chunk()`: Content chunking with overlap and max length.
        *   `langbase.embed()`: Embedding generation for text chunks using specified models.
        *   `langbase.parser()` / `parse()`: Document parsing (e.g., PDF, MD to text).
    *   **Workflows (`langbase.Workflow` - `src/langbase/workflows.ts`):**
        *   Define and execute multi-step AI processes using `new Workflow({step})`. Each step has an `id` and a `run` function, supporting timeouts and retries.
    *   **React Hooks (`langbase/react` - `src/react/use-pipe.ts`):**
        *   `usePipe()`: Simplifies client-side integration in Next.js/React. Manages messages, input state, loading/error states, streaming via an API route, regeneration, and stopping requests.
    *   **Agent (`langbase.agent`):** (Less central than Pipes)
        *   `run()`: Direct LLM interaction specifying model, API key, and other LLM parameters.

2.  **`@langbase/cli` (CLI - `packages/cli/`):** Command-line tool aliased as `lb` or `langbase`.
    *   Authentication: `auth` command stores `LANGBASE_API_KEY` in a `.env` file.
    *   Agent Development: `build` and `deploy` commands bundle user-provided JavaScript/TypeScript files (e.g., for Cloudflare Workers-like environment) and deploy them to Langbase.
    *   IDE Integration: `docs-mcp-server` starts a Model Context Protocol server, allowing IDEs (Cursor, Windsurf, Claude Desktop) to query Langbase documentation. Uses relevance scoring (`get-score.ts`) to find relevant doc sections.

**Examples & Development:**

*   The repository is a `pnpm` monorepo managed with `turbo`.
*   **`examples/nodejs/`**: Contains comprehensive scripts for all SDK functionalities (pipes, memory, tools, threads, workflows, primitives). Each script typically initializes `Langbase` with `process.env.LANGBASE_API_KEY`.
*   **`examples/nextjs/`**: Demonstrates UI integration using `usePipe` hook for chat interfaces, and Next.js API route handlers (in `app/langbase/pipe/`) to proxy requests to the Langbase API.
*   Configuration is primarily through environment variables (e.g., `LANGBASE_API_KEY`, `EXA_API_KEY`, `CRAWL_KEY`).

**Key Files for Context:**

*   Root `README.md`: General introduction and basic Node.js examples.
*   `packages/langbase/src/langbase/langbase.ts`: Defines the main `Langbase` class, its methods, and associated types (e.g., `RunOptions`, `Message`, `ToolCall`).
*   `packages/langbase/src/common/request.ts` & `stream.ts`: Internal request handling and SSE stream processing.
*   `packages/cli/src/index.ts`: Main entry point for CLI commands.
*   `packages/cli/src/deploy/index.ts`, `src/build/index.ts`, `src/auth/index.ts`: Logic for core CLI functionalities.
*   `pnpm-workspace.yaml` and `turbo.json`: Monorepo and build system configuration.

