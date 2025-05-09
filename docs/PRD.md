# Product Requirements Document: Task Master AI

## 1. Overview

Task Master AI is a command-line interface (CLI) tool designed to streamline task management for software development, particularly in AI-driven workflows. It leverages AI models like Claude and Perplexity for tasks such as generating tasks from product requirement documents (PRDs), breaking down complex tasks, and providing research-backed suggestions. It integrates seamlessly with Cursor, a code editor with AI capabilities, via the Model Control Protocol (MCP). It also supports multiple LLMs including OpenAI, Google, Mistral, xAI, Azure OpenAI, and OpenRouter.

Task Master AI aims to enhance developer productivity by automating and assisting in the planning, decomposition, and management of development tasks, allowing developers to focus more on implementation and innovation.

## 2. Goals

*   To provide a powerful CLI tool for managing development tasks with AI assistance.
*   To streamline the process of translating PRDs into actionable development tasks.
*   To facilitate the breakdown of complex tasks into manageable subtasks.
*   To offer intelligent suggestions and research-backed information for task implementation.
*   To integrate seamlessly with developer tools like Cursor via MCP.
*   To provide flexibility through multi-LLM support and configurable model roles.
*   To simplify project initialization and setup for AI-driven development workflows, including integration with tools like Roo Code.

## 3. Target Audience

*   Software developers, particularly those working in AI-driven development environments.
*   Users of AI-powered code editors like Cursor.
*   Development teams looking to improve task management and planning efficiency.

## 4. Core Features

1.  **PRD Parsing:** Parses PRDs (various formats like .txt, .md) to generate structured tasks using AI. Handles large PRDs via chunking and can infer dependencies/priorities. Supports appending to or overwriting existing `tasks.json`.
2.  **Task Management:** Create, update, list, and manage tasks with attributes like ID, title, description, status (pending, in-progress, done, deferred, cancelled, blocked, review), dependencies, priority (high, medium, low), implementation details, and test strategy. Tasks are stored in `tasks.json`.
3.  **Subtask Management:** Break down tasks into smaller subtasks. Subtasks have their own ID, title, description, status, dependencies, acceptance criteria, and implementation details. Supports adding subtasks from prompts or converting existing tasks, removing subtasks (with optional conversion back to a task), and clearing subtasks.
4.  **AI Integration (Unified Service Layer):** Leverages AI for task generation, expansion, updates, and complexity analysis. Dynamically selects and calls the appropriate AI provider based on configuration (`.taskmasterconfig`), handles API key resolution, fallback mechanisms, and retries. Uses Vercel AI SDK.
5.  **Complexity Analysis:** Assesses task complexity using AI, suggests subtask breakdowns, generates expansion prompts, assigns scores, and produces a `task-complexity-report.json`. Merges new analysis with previous reports.
6.  **Dependency Management:** Handles and validates task and subtask dependencies, including circular dependency detection and resolution (manual or AI-assisted fixes).
7.  **Cursor Integration (MCP):** Exposes Taskmaster commands as MCP tools within Cursor. Manages context for AI calls, supports direct function imports for performance, and standardizes response structures. Uses FastMCP.
8.  **Multi-LLM Support:** Supports various AI providers (OpenAI, Anthropic (Claude), Google (Gemini), Perplexity, Mistral AI, Azure OpenAI, xAI, and OpenRouter).
9.  **Model Management:** Allows users to configure and switch between different AI models for different roles (main, research, fallback) via CLI or interactive setup. Stores configuration in `.taskmasterconfig`. Supports custom Ollama/OpenRouter models and validation against `supported-models.json`.
10. **Version Checking and Updates:** Checks for new versions of Task Master AI on npm and notifies users.
11. **Logging and Debugging:** Provides detailed, configurable logging (levels: debug, info, warn, error). Supports silent mode for automated operations and specific logger handling for MCP context. Debug logs can be written to `dev-debug.log`.
12. **Roo Integration:** Integrates with Roo Code by creating necessary configuration files (`.roomodes`, `.roo/rules`) during project initialization (`task-master init`).
13. **Project Initialization (`task-master init`):** Sets up a new project with necessary configurations, including `.taskmasterconfig` and Roo integration files.

## 5. User Experience (UX)

*   **Interaction Model:** Primarily a CLI tool with clear command structure, arguments, and help text.
*   **Output:** Color-coded output for enhanced readability. Progress indicators for long-running operations (e.g., AI calls).
*   **Input:** Interactive prompts for confirmations, choices (e.g., model setup), and ambiguous inputs.
*   **Key User Flows:**
    *   Initialize a new project: `task-master init`
    *   Parse a PRD to generate tasks: `task-master parse-prd <prd_file_path>`
    *   List tasks: `task-master list [--status=<status>] [--include-subtasks]`
    *   View task details: `task-master show <task_id>`
    *   Update task status: `task-master set-status --id=<task_id> --status=<status>`
    *   Expand a task into subtasks using AI: `task-master expand --id=<task_id>`
    *   Add/remove task dependencies: `task-master add-dependency --id=<task_id> --depends-on=<dependency_id>`
    *   Analyze task complexity: `task-master analyze-complexity [--id=<task_id>]`
    *   Manage AI Models: `task-master models [--setup] [--list-available] [--set-main <model_id>]`
    *   MCP Tools: Access Taskmaster functionalities through Cursor's MCP interface.

## 6. Technical Architecture

### 6.1. System Components

1.  **CLI:** Built with Commander.js. Entry: `bin/task-master.js` -> `scripts/dev.js`.
2.  **Core Modules (`scripts/modules`):**
    *   `task-manager.js`: Core task logic (CRUD, PRD parsing, expansion).
    *   `dependency-manager.js`: Dependency handling.
    *   `ai-services-unified.js`: Unified interface to AI providers (via Vercel AI SDK).
    *   `config-manager.js`: Manages `.taskmasterconfig` and `supported-models.json`.
    *   `ui.js`: CLI output functions.
    *   `utils.js`: Utilities (logging, file I/O, API key resolution).
3.  **AI Provider Modules (`src/ai-providers`):** Provider-specific wrappers using Vercel AI SDK.
4.  **MCP Server (`mcp-server`):** FastMCP-based server for Cursor integration.
    *   `mcp-server/src/tools`: MCP tool definitions.
    *   `mcp-server/src/core/direct-functions`: Wrappers for core logic.
    *   `task-master-core.js`: Central export for direct functions.

### 6.2. Data Models

*   **Task Model (`tasks.json`):**
    ```json
    {
      "id": 1,
      "title": "Task Title",
      "description": "Task description",
      "status": "pending|in-progress|done|deferred|cancelled|blocked|review",
      "dependencies": [/* Task IDs */],
      "priority": "high|medium|low",
      "details": "Implementation details",
      "testStrategy": "Testing approach",
      "subtasks": [ /* Array of Subtask objects */ ]
    }
    ```
*   **Subtask Model (nested in Task):**
    ```json
    {
      "id": 1.1, // Or sequential integer if preferred
      "title": "Subtask Title",
      "description": "Subtask description",
      "status": "pending|in-progress|done|deferred|cancelled|blocked|review",
      "dependencies": [/* Task/Subtask IDs */],
      "acceptanceCriteria": "Acceptance criteria",
      "details": "Implementation details"
    }
    ```
*   **`tasks.json` (Top Level):**
    ```json
    {
      "meta": { /* Project metadata */ },
      "tasks": [ /* Array of Task objects */ ]
    }
    ```
*   **`.taskmasterconfig` (Project Root):**
    ```json
    {
      "models": {
        "main": { "provider": "anthropic", "modelId": "claude-instant-100k", "maxTokens": 100000, "temperature": 0.2 },
        "research": { "provider": "perplexity", "modelId": "sonar-pro", "maxTokens": 8700, "temperature": 0.1 },
        "fallback": { "provider": "anthropic", "modelId": "claude-2", "maxTokens": 64000, "temperature": 0.2 }
      },
      "global": {
        "logLevel": "info",
        "defaultSubtasks": 5,
        "defaultPriority": "medium",
        "projectName": "Your Project Name",
        "ollamaBaseUrl": "http://localhost:11434/api",
        "azureOpenaiBaseUrl": "YOUR_AZURE_ENDPOINT_HERE"
      }
    }
    ```
*   **`supported-models.json` (`scripts/modules/`):** Defines properties of supported models (ID, name, SWE score, cost, allowed roles, max tokens).

### 6.3. APIs and Integrations

*   **AI Provider APIs:** Anthropic, OpenAI, Google, Perplexity, Mistral, Azure OpenAI, xAI, OpenRouter.
*   **Vercel AI SDK:** Abstracts AI API interactions.
*   **FastMCP API:** Framework for MCP server.
*   **Cursor AI Integration:** Via Model Control Protocol.

### 6.4. Infrastructure Requirements

*   Node.js (v14+ with ESM).
*   Package manager (npm/yarn/pnpm/bun).
*   Optional: Ollama for local LLMs.
*   Cursor Editor for MCP integration.
*   Configuration: `.env` (for CLI API keys) and `.cursor/mcp.json` (for MCP API keys).

## 7. Error Handling

*   Graceful handling of invalid inputs, API errors, file I/O issues, and empty AI responses.
*   User-friendly error messages for CLI.
*   Structured error responses (code, message) for MCP tools.
*   Fallback mechanisms for AI model failures.
*   Circular dependency detection and reporting.

## 8. Development Roadmap (Illustrative Phases)

*   **Phase 1:** Core Task Management (CLI, CRUD, `tasks.json` structure).
*   **Phase 2:** Basic AI Integration (PRD Parsing, Task Expansion).
*   **Phase 3:** Advanced AI & Dependency Management (Complexity Analysis, Dependency Validation & Fixing).
*   **Phase 4:** Cursor Integration (MCP Server, MCP Tools).
*   **Phase 5:** Multi-LLM Support & Model Management.
*   **Phase 6:** Enhanced Integrations (Roo Code), Logging, Versioning, and UX Refinements.

## 9. Risks and Mitigations

*   **AI Model API Changes:**
    *   *Risk:* Breaking changes in AI provider APIs.
    *   *Mitigation:* Use Vercel AI SDK for abstraction, implement robust error handling, maintain flexible prompt engineering, regularly test against model updates.
*   **Dependency Conflicts:**
    *   *Risk:* Issues from multiple AI SDKs or utility libraries.
    *   *Mitigation:* Use lockfiles, regular dependency audits, version pinning where appropriate.
*   **Performance Issues:**
    *   *Risk:* Slow AI calls impacting UX.
    *   *Mitigation:* Asynchronous operations, progress indicators, caching strategies, explore efficient/faster models for certain tasks.
*   **Usability Challenges:**
    *   *Risk:* Complexity of CLI + MCP + AI interactions.
    *   *Mitigation:* Clear documentation, comprehensive help text, interactive prompts, user feedback collection.

## 10. Future Considerations (Out of Scope for Initial Version)

*   GUI for task management.
*   Real-time collaboration features.
*   Deeper integration with project management platforms (Jira, Asana).
*   Advanced reporting and analytics on task completion and complexity.

## Appendix

*   Codebase to adhere to clean code principles, consistent formatting (e.g., Prettier), and JSDoc/TSDoc comments.
*   Comprehensive test suite (unit, integration, E2E) to ensure high coverage.
*   Detailed documentation: setup, CLI usage, MCP tool API, configuration, model management, troubleshooting.
