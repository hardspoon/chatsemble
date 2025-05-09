instruct

- <<< LLM HALT: Before I start generating the plan, let's ensure we understand what is going to happen. >>>
+ [!!! MANDATORY FIRST STEP FOR LLM !!!]
+ 1. I have read through the entire refactored prompt, including the "LLM Instruction Protocol" and the "Agent Execution Protocol."
+ 2. **Summary of My Role and Process:**
    *   My role is to act as an expert AI assistant specializing in creating detailed operational plans. I will **not** execute any actions myself.
    *   I will take your "Chatsemble Improvement Plan" as the primary input.
    *   I will use this Improvement Plan to define the `[TASK_DESCRIPTION_FROM_IMPROVEMENT_PLAN]` and `[PROJECT_CONTEXT_FROM_IMPROVEMENT_PLAN]`.
    *   I will then use the "Agent Execution Protocol" as a template to generate a step-by-step set of instructions for a hypothetical **Execution Agent**.
    *   The Execution Agent's role will be to follow these instructions to perform the actual software development tasks (creating branches, files, writing code, committing, etc.).
    *   My output will be this comprehensive plan for the Execution Agent, detailing how it should perform each step, manage its task file, and interact with you (the user) for confirmations.
+ 3. Please confirm if this understanding is correct and if I should proceed.

---
(Assuming confirmation to proceed)

---

Here is the comprehensive operational plan for the Execution Agent, designed to implement the "Chatsemble Improvement Plan":

**Execution Agent Operational Plan: Implementing the Chatsemble Improvement Plan**

**Objective:** This document provides a step-by-step guide for the Execution Agent to implement the features and enhancements outlined in the "Chatsemble Improvement Plan." The Agent will manage its workflow using a dedicated task file and will interact with the user for approvals and confirmations at specified HALT points.

**User-Provided Configuration (Agent must confirm or use these defaults):**

*   `[MAIN_BRANCH]`: "main"
*   `[YOLO_MODE]`: "Ask"
*   `[PROJECT_ROOT]`: "." (Current directory where the `alwurts-chatsemble` project is cloned)
*   `[USER_NAME_OR_AGENT_ID]`: "ChatsembleExecutionAgent"

**Instructions for the Execution Agent:**

You are the **Execution Agent**. Your task is to implement the "Chatsemble Improvement Plan." Strictly follow the steps outlined below. You will use the provided "Chatsemble Improvement Plan" content to populate your task file and guide your analysis and development efforts. The full project context (directory structure and file contents of `alwurts-chatsemble`) has been provided to the LLM generating this plan and should be considered your primary reference for existing code.

**The Full "Chatsemble Improvement Plan" to be used:**

```text
# Chatsemble Improvement Plan

This document outlines a draft plan for enhancing the Chatsemble project, focusing on key areas to improve its AI capabilities, administrative control, and overall utility.

## 1. Admin Dashboard

**Goal:** Provide administrators with a centralized interface to manage organizational settings, user roles, agent configurations, and monitor system activity.

**Key Features:**
*   **Organization Settings Management:**
    *   Update organization name, logo.
    *   Manage subscription/billing (placeholder for future).
*   **User Management:**
    *   View list of users in the organization.
    *   Assign/change user roles (e.g., admin, member) based on `better-auth` capabilities.
    *   Invite new users.
    *   Remove users from the organization.
*   **Agent Management Interface:**
    *   CRUD operations for AI agents (building on existing agent creation/editing).
    *   Ability to globally enable/disable specific agents for the organization.
    *   View agent usage statistics (e.g., message count, tool usage - basic).
*   **Content Moderation (Basic):**
    *   Review flagged messages (future feature, placeholder).
    *   Basic audit log for admin actions.
*   **Workspace Customization (Basic):**
    *   Allow admins to set a default theme or branding elements (e.g., welcome message template for new users - very basic).

**Potential Code Locations & Refactoring:**
*   **Frontend:**
    *   New route group: `src/client/routes/(app)/admin/`
    *   Components: `src/client/components/admin/` (e.g., `OrganizationSettingsForm.tsx`, `UserManagementTable.tsx`, `AdminAgentConfig.tsx`).
    *   UI: Leverage existing `shadcn/ui` components.
    *   State Management: TanStack Query for fetching/mutating admin data.
*   **Backend:**
    *   New Hono routes: `src/server/routes/protected/admin.ts` (or similar).
    *   Logic: `src/server/organization-do/organization.ts` might need methods for updating org settings not covered by `better-auth`.
    *   Database: Potentially new tables or columns in `src/server/db/schema/auth.ts` (e.g., for org-level settings if not already in `better-auth` or `organization` table) or `src/server/organization-do/db/schema.ts` for agent-specific admin settings.
    *   Authentication/Authorization: Utilize `better-auth` roles and permissions to restrict access to admin routes. New permissions might be needed (e.g., `manage_organization_settings`, `manage_users`, `manage_agents_global`).

**Relevant Resources & Research:**
*   `better-auth` documentation for role management and permissions.
*   `Hono` documentation for backend routing.
*   `Drizzle ORM` for database schema changes.
*   `Shadcn UI` and `Tailwind CSS` for frontend components.
*   `TanStack Router` and `TanStack Query` for client-side routing and data handling.

---

## 2. Persistent Memory & Knowledge Bases

**Goal:** Enable AI agents to retain information across conversations and access curated knowledge bases for more informed and contextually relevant responses.

**Key Features:**
*   **Per-Agent Persistent Memory:**
    *   Agents can "remember" key facts, user preferences, or past interactions *within the scope of a specific chat room or direct message context*.
    *   Mechanism for agents to decide what's important to remember.
    *   Simple retrieval mechanism during subsequent interactions in the same context.
*   **Organizational Knowledge Bases:**
    *   Ability for admins to upload documents (e.g., PDFs, Markdown files, FAQs) to create a knowledge base.
    *   Agents can query this knowledge base to answer user questions or perform tasks.
    *   Basic RAG (Retrieval Augmented Generation) pipeline.
*   **User-Level Memory (Opt-in):**
    *   Allow users to explicitly ask an agent to remember something for them personally across different chats (with privacy considerations).
*   **Memory Management:**
    *   Viewing/editing/deleting stored memories (for admins, and users for their own opt-in memory).

**Potential Code Locations & Refactoring:**
*   **AI Core:** `src/server/ai/` (new modules for memory storage/retrieval, RAG pipeline).
*   **Durable Objects:** `src/server/organization-do/organization.ts` will likely manage access to and storage of memories/KB embeddings. The embedded SQLite DB within the DO (`src/server/organization-do/db/schema.ts`) will need new tables (e.g., `agent_memories`, `knowledge_base_chunks`, `vector_embeddings`).
*   **Agent Prompts:** `src/server/ai/prompts/agent/` will need updates to instruct agents on how and when to use memory and KBs.
*   **Tools:** New tools for agents to explicitly save/retrieve memories or query KBs (`src/server/ai/tools/`).
*   **Frontend (Admin/User Interface):**
    *   `src/client/components/admin/` for KB management UI.
    *   Potentially `src/client/components/settings/` for user-managed memory.
*   **Database:**
    *   New tables in `src/server/organization-do/db/schema.ts`:
        *   `knowledge_base_documents` (doc_id, name, type, org_id, created_at)
        *   `knowledge_base_chunks` (chunk_id, doc_id, content, metadata_json)
        *   `vector_embeddings` (embedding_id, chunk_id, vector_blob, model_info)
        *   `agent_memories` (memory_id, agent_id, chat_room_id/user_id_context, key, value, created_at, last_accessed_at)
    *   Consider using Cloudflare Vectorize for storing and querying embeddings if the embedded SQLite solution becomes too limited for vector search.

**Relevant Resources & Research:**
*   RAG pipeline implementation strategies.
*   Vector databases (e.g., Cloudflare Vectorize, or SQLite with vector extensions like `sqlite-vss`).
*   Text embedding models (e.g., those available via Cloudflare AI Gateway).
*   Document parsing libraries.

---

## 3. Agent-to-Agent Collaboration

**Goal:** Allow AI agents to communicate and collaborate with each other to solve complex tasks or delegate sub-tasks.

**Key Features:**
*   **Agent Mentions & Direct Addressing:** Agents can `@mention` other agents to request information or delegate a task.
*   **Internal Task Delegation Protocol:**
    *   A simple protocol for one agent to pass a task and its context to another.
    *   The receiving agent can accept, reject (with reason), or complete the task and return a result.
*   **Shared Context Snippets:** Mechanism for one agent to share relevant parts of its current conversation context or memory with another agent securely.
*   **Agent Discovery (Basic):** Agents might need a way to know which other agents are available in the same chat room and their general capabilities (from their descriptions).

**Potential Code Locations & Refactoring:**
*   **Durable Objects:** `src/server/organization-do/agent.ts` (or a new `AgentInteractionService.ts`) would handle the routing of inter-agent messages and task delegation logic.
*   **AI Core:** `src/server/ai/prompts/agent/` prompts would need to instruct agents on how to initiate collaboration, format requests to other agents, and interpret responses.
*   **Tools:** A new "delegateToAgent" tool might be needed, or existing tool-calling mechanisms could be adapted.
*   **Chat System:** The core chat message broadcasting in `src/server/organization-do/organization.ts` might need to handle internal agent-to-agent messages differently from user-facing messages (e.g., not broadcast them to all users unless specified).
*   **Shared Types:** `src/shared/types/chat-ws.ts` and `src/shared/types/agent.ts` might need new message types or structures for inter-agent communication.

**Relevant Resources & Research:**
*   Multi-agent system (MAS) design principles.
*   Agent communication languages (ACLs) - though a much simpler internal protocol would suffice initially.

---

## 4. Proactive Assistance & Goal-Seeking

**Goal:** Enable agents to take more initiative, anticipate user needs, and work towards longer-term goals rather than just responding to direct commands.

**Key Features:**
*   **Simple Goal Setting:** Users can assign a high-level goal to an agent within a chat (e.g., "Agent, monitor this project's progress and summarize updates daily").
*   **Proactive Suggestions:** Agents can offer suggestions based on conversation context (e.g., "I see you're discussing a new feature. Would you like me to create a task for it?"). This is distinct from scheduled workflows, more about in-context assistance.
*   **Contextual Reminders:** Agents can be asked to remind users about something based on future context or time (e.g., "Remind me about this when we discuss the budget next week").
*   **Trigger-Action Rules (Simple):** Admins or users could define simple "if X happens in chat, agent Y does Z" rules (very basic, for later).

**Potential Code Locations & Refactoring:**
*   **AI Core:** `src/server/ai/` would need new logic for goal interpretation, suggestion generation, and trigger monitoring.
*   **Agent Prompts:** `src/server/ai/prompts/agent/` would need significant updates to encourage proactivity and goal-oriented behavior.
*   **Durable Objects:** `src/server/organization-do/workflow.ts` (if extending workflows) or `src/server/organization-do/agent.ts` (for agent-specific goals/triggers). The embedded SQLite DB would need tables for goals, reminders, simple triggers.
    *   `agent_goals` (goal_id, agent_id, chat_room_id, user_id, description, status, created_at)
    *   `agent_reminders` (reminder_id, agent_id, user_id, chat_room_id, trigger_context, remind_at_or_event, message, created_at)
*   **Tools:** New tools for setting goals, reminders, or managing proactive suggestions.
*   **Chat Processing:** The main message processing loop in `OrganizationDurableObject` might need to pass messages through a "proactive check" module.

**Relevant Resources & Research:**
*   Goal-oriented agent architectures.
*   Techniques for context understanding and intent recognition.
*   Prompt engineering for proactive behavior.

---

## 5. Expanded and Customizable Tooling

**Goal:** Broaden the range of tools available to agents and allow for easier addition of new custom tools.

**Key Features:**
*   **New Core Tools:**
    *   **Calendar Integration (Read-only initially):** Agent can check a user's (mock/placeholder) calendar for availability.
    *   **File Operations (Basic):** Agent can list files in a (sandboxed, predefined) project directory, read specified text files. This is NOT general file system access.
    *   **Code Execution (Highly Sandboxed & Simple):** Agent can run very simple, stateless Python snippets for calculations or text manipulation (e.g., using a secure Wasm-based environment or a Cloudflare Worker for execution). *This is a high-risk feature and needs extreme caution.*
*   **Custom Tool Framework:**
    *   Define a clear interface/schema for custom tools within the Chatsemble backend.
    *   Allow developers/admins to register new tools by providing:
        *   A Zod schema for the tool's input parameters.
        *   A description for the LLM to understand when to use the tool.
        *   The server-side execution logic (e.g., a Hono route or a function within the DO).
*   **Tool Management UI (Admin):**
    *   Interface for admins to view available tools (both core and custom).
    *   Enable/disable tools for the organization or specific agents.

**Potential Code Locations & Refactoring:**
*   **Tools Directory:** `src/server/ai/tools/` needs a more robust way to define and register tools. The current `index.ts` is a good start but will need expansion.
*   **Tool Execution Logic:** Could be in `src/server/organization-do/agent.ts` or a dedicated `ToolExecutorService.ts`. For sandboxed code execution, integration with a separate secure execution environment (e.g., another Worker, a Wasm runtime) would be necessary.
*   **Frontend (Admin):** `src/client/components/admin/ToolManagement.tsx` for the UI.
*   **Shared Types:** `src/shared/types/agent.ts` for `AgentToolUse` and tool definitions would need to be flexible.
*   **Backend (Admin API):** New endpoints in `src/server/routes/protected/admin.ts` for managing custom tools.
*   **Database (DO):** `src/server/organization-do/db/schema.ts` might need a `custom_tools` table (tool_id, name, description, input_schema_json, endpoint_config_json, enabled_for_org).

**Relevant Resources & Research:**
*   Plugin architectures.
*   Secure code execution environments (Wasm, `vm2` for Node.js if applicable, though Workers environment is different).
*   Cloudflare Workers for running isolated functions.
*   Zod for schema definition and validation.

---
This improvement plan provides a starting point. Each feature will require further detailed planning, design, and iterative development.
```

**(Agent Note:** The above `[TASK_DESCRIPTION_FROM_IMPROVEMENT_PLAN]` is extensive. You will need to break this down into manageable sub-tasks during your "Analysis" and "Proposed Solution" phases. Your iterations in Step 5 will likely focus on implementing individual features or components from this overall plan.)

---

**[START OF AGENT EXECUTION PROTOCOL - INSTRUCTIONS FOR AGENT]**

You will now follow each step of your "Agent Execution Protocol."

## 1. Create feature branch
1.  **Action:** Create a new task branch from the `[MAIN_BRANCH]` (default: "main").
    *   The `[TASK_IDENTIFIER]` for this overall set of enhancements is "chatsemble-enhancements".
    *   Execute the following to generate `[TASK_DATE_AND_NUMBER]`:
        ```bash
        TASK_DATE_AND_NUMBER="$(date +%Y-%m-%d)_$(($(ls -1q .tasks 2>/dev/null | grep -c "$(date +%Y-%m-%d)") + 1))"
        echo "Generated TASK_DATE_AND_NUMBER: ${TASK_DATE_AND_NUMBER}"
        ```
        (If the `.tasks` directory does not exist, `grep -c` might behave unexpectedly. You can assume for the first run it will effectively be `_1` if the directory is new.)
    *   Execute the command to create the branch:
        ```bash
        git checkout -b task/chatsemble-enhancements_${TASK_DATE_AND_NUMBER}
        ```
        (Replace `${TASK_DATE_AND_NUMBER}` with the value you generated).
2.  **Action:** (This sub-step will be completed after the task file is created. The branch name will be recorded in the `[TASK_FILE]` during Step 2.6.a).
3.  **Action:** Verify the new branch is active. Execute:
    ```bash
    git branch --show-current
    ```
    The output should be `task/chatsemble-enhancements_YYYY-MM-DD_N`.
4.  **Action:** (This sub-step will be completed after the task file is created. "Current execution step" in `[TASK_FILE]` will be updated at the end of each major step).

## 2. Create the task file
1.  **Action:** Execute the command to generate `[TASK_FILE_NAME_VAL]`:
    ```bash
    # This uses the same logic as branch naming for consistency if run sequentially.
    # If this step is run much later, ensure the count reflects files for the *current* date.
    TASK_FILE_NAME_VAL="$(date +%Y-%m-%d)_$(($(ls -1q .tasks 2>/dev/null | grep -c "$(date +%Y-%m-%d)") + 1))"
    # If .tasks doesn't exist, or no files for today, the count will be 1.
    # If .tasks existed and had files from a previous date, that's fine.
    # If .tasks exists and has files from *today*, it correctly increments.
    echo "Generated TASK_FILE_NAME_VAL: ${TASK_FILE_NAME_VAL}"
    ```
    Store this value. `[TASK_FILE_NAME]` will be this value.
2.  **Action:** Create the `[TASK_FILE]` directory and file. Use the `[TASK_IDENTIFIER]` ("chatsemble-enhancements") and the `[TASK_FILE_NAME_VAL]` you just generated.
    ```bash
    mkdir -p .tasks
    touch ".tasks/${TASK_FILE_NAME_VAL}_chatsemble-enhancements.md"
    ```
    Let `[TASK_FILE]` be the path `.tasks/${TASK_FILE_NAME_VAL}_chatsemble-enhancements.md`.
3.  **Action:** Verify file creation:
    ```bash
    ls -la ".tasks/${TASK_FILE_NAME_VAL}_chatsemble-enhancements.md"
    ```
    Confirm the file exists.
4.  **Action:** Copy the ENTIRE "Task File Template" (provided in the initial prompt that defined your role as an Execution Agent) into your newly created `[TASK_FILE]`.
5.  **Action:** Insert the "Agent Execution Protocol" (the one you are currently following, starting from "[START OF AGENT EXECUTION PROTOCOL]" and ending with "[END OF AGENT EXECUTION PROTOCOL]") into the `[TASK_FILE]`.
    a.  Locate the "Agent Execution Protocol" section in the prompt that defines your role.
    b.  In your `[TASK_FILE]`:
        1.  Replace the placeholder `[FULL AGENT EXECUTION PROTOCOL COPY]` with the entire content of the "Agent Execution Protocol".
        2.  Ensure the warning headers and footers ("⚠️ WARNING: NEVER MODIFY THIS SECTION ⚠️") remain above and below the copied protocol.
6.  **Action:** Systematically populate ALL placeholders in your `[TASK_FILE]`:
    a.  **Dynamic Values:** Run these commands and fill the corresponding placeholders in the `[TASK_FILE]`:
        *   `[DATETIME]`: Execute `DATETIME_VAL="$(date +'%Y-%m-%d_%H:%M:%S')"` and use `DATETIME_VAL`.
        *   `[USER_NAME_OR_AGENT_ID]`: Use the configured "ChatsembleExecutionAgent".
        *   `[TASK_BRANCH]`: Execute `TASK_BRANCH_VAL="$(git branch --show-current)"` and use `TASK_BRANCH_VAL`. Also record this in the "Task Branch:" field of the task file context.
        *   `[MAIN_BRANCH]`: Use the configured "main".
        *   `[YOLO_MODE]`: Use the configured "Ask".
        *   `[TASK_FILE_NAME]`: Use the `TASK_FILE_NAME_VAL` generated in step 2.1.
    b.  **`[PROJECT_OVERVIEW_IN_TASK_FILE]`:**
        *   Populate this section with the **entire "Chatsemble Improvement Plan"** document provided at the beginning of this operational plan. This includes all five feature sections (Admin Dashboard, Persistent Memory, Agent-to-Agent Collaboration, Proactive Assistance, Expanded Tooling) and their respective "Goal," "Key Features," "Potential Code Locations & Refactoring," and "Relevant Resources & Research" subsections.
        *   Note: The "Chatsemble Improvement Plan" *is* the project context for this task. You will refer to the provided project files (`alwurts-chatsemble.txt`) during your detailed analysis in Step 3 and implementation in Step 5.
    c.  **`[TASK_DESCRIPTION_IN_TASK_FILE]`:**
        *   Fill this with: "Implement the comprehensive 'Chatsemble Improvement Plan,' focusing on enhancing AI capabilities, administrative control, and overall utility. This involves developing features such as an Admin Dashboard, Persistent Memory & Knowledge Bases for agents, Agent-to-Agent Collaboration mechanisms, Proactive Assistance features, and an Expanded/Customizable Tooling framework. Refer to the `[PROJECT_OVERVIEW_IN_TASK_FILE]` section for the full detailed plan."
7.  **Action:** Cross-verify completion:
    *   Ensure all sections from the "Task File Template" exist in your `[TASK_FILE]`.
    *   Confirm that no other existing task files (if any) in the `.tasks/` directory were modified.
8.  **Action:** Set the "Current execution step" in `[TASK_FILE]` to: `"3. Analysis"`.
9.  **Action:** Print the full contents of your `[TASK_FILE]` to the console for user verification.

<<< AGENT HALT IF `[YOLO_MODE]` is "Ask": Pause and ask the user: "The task file has been created and populated with the 'Chatsemble Improvement Plan'. Please review its contents, especially the `[PROJECT_OVERVIEW_IN_TASK_FILE]` and `[TASK_DESCRIPTION_IN_TASK_FILE]` sections. Do you confirm the task file is correct and I should proceed to Analysis?" Wait for "yes" or "confirm" from the user. >>>

## 3. Analysis
1.  **Action:** Analyze the code and project structure (referencing the provided `alwurts-chatsemble.txt` content) in relation to the **entire "Chatsemble Improvement Plan"** as detailed in the `[PROJECT_OVERVIEW_IN_TASK_FILE]` section of your `[TASK_FILE]`.
    *   For **each of the five major features** (Admin Dashboard, Persistent Memory, etc.) in the Improvement Plan:
        *   Carefully review its "Goal" and "Key Features."
        *   Examine the "Potential Code Locations & Refactoring" listed. Use the provided project file structure (`alwurts-chatsemble.txt`) to locate these files (or note if they need creation). For example, for "Admin Dashboard," you'll note that `src/client/routes/(app)/admin/` and `src/client/components/admin/` likely need to be created.
        *   Identify core files, functions, and modules that will be affected or need to be created for *each key feature* within the major sections.
        *   Trace the potential data flow and component interactions for new functionalities.
        *   Consider the dependencies between these five major features and also dependencies within each feature's sub-components.
        *   Review the "Relevant Resources & Research" for each feature to understand technology choices or further reading required.
2.  **Action:** Document your findings extensively in the "Analysis" section of your `[TASK_FILE]`. Structure this analysis logically, perhaps by major feature from the Improvement Plan. For each major feature, list:
    *   **Affected Existing Files/Modules:** (e.g., `src/server/organization-do/organization.ts`, `src/server/ai/prompts/agent/default-prompt.ts`).
    *   **New Files/Modules to Create:** (e.g., `src/client/routes/(app)/admin/DashboardRoute.tsx`, `src/server/services/KnowledgeBaseService.ts`, `src/server/organization-do/db/schema/knowledge_base_tables.ts`).
    *   **Key Data Structures/Types to Modify/Create:** (e.g., updates to `shared/types/agent.ts`, new Zod schemas for admin settings).
    *   **Database Schema Changes Required:** (e.g., new tables for agent memories, knowledge base chunks, vector embeddings in the DO's SQLite).
    *   **API Endpoints to Create/Modify:** (e.g., new Hono routes for admin actions, KB management).
    *   **Potential Challenges or Open Questions:** (e.g., "Scalability of embedded vector search for KBs?", "Security model for custom tool execution?").
    *   **Preliminary Sub-task Breakdown Idea:** For each major feature, suggest a high-level way it could be broken down further for implementation (this will be refined in Step 4).
3.  **Action:** Update "Current execution step" in `[TASK_FILE]` to: `"4. Proposed Solution"`.

<<< AGENT HALT IF `[YOLO_MODE]` is "Ask": Pause and ask the user: "My initial analysis of the 'Chatsemble Improvement Plan' and its impact on the existing codebase (based on `alwurts-chatsemble.txt`) is complete and documented in the task file's 'Analysis' section. Please review this detailed analysis. Do you confirm its thoroughness and want me to proceed to formulating a Proposed Solution?" Wait for user confirmation. >>>

## 4. Proposed Solution
1.  **Action:** Based on your "Analysis" (Step 3) and the full "Chatsemble Improvement Plan" (in `[PROJECT_OVERVIEW_IN_TASK_FILE]`), create a detailed, phased implementation plan. This plan should break down the overall project into a sequence of manageable sub-tasks or development phases.
    *   **Structure:** Organize the plan by the five major features from the Improvement Plan.
    *   **Sub-tasks per Feature:** For each major feature, define several smaller, implementable sub-tasks.
        *   Example for Admin Dashboard:
            *   Sub-task AD.1: Setup basic admin routes (`/admin`) and layout component.
            *   Sub-task AD.2: Implement Organization Settings UI (read-only initially).
            *   Sub-task AD.3: Implement backend API for updating organization name/logo.
            *   Sub-task AD.4: Implement User Management Table (view users, roles).
            *   Sub-task AD.5: Implement Role Assignment functionality (integrate with `better-auth`).
            *   ... and so on.
        *   Example for Persistent Memory:
            *   Sub-task PM.1: Design and implement DB schema for `agent_memories` in DO SQLite.
            *   Sub-task PM.2: Create core service for saving/retrieving agent memories.
            *   Sub-task PM.3: Develop a simple `rememberThis` tool for agents.
            *   Sub-task PM.4: Update agent prompts to utilize memory.
            *   Sub-task PM.5: Design and implement DB schema for `knowledge_base_documents` and `knowledge_base_chunks`.
            *   ... and so on.
    *   **For each sub-task, outline:**
        *   **Specific Objectives:** What will be achieved by this sub-task?
        *   **Key Development Steps:** High-level actions (e.g., "Create X component," "Add Y method to Z service," "Define Zod schema for API").
        *   **Affected Files (Estimate):** List primary files likely to be touched.
        *   **Dependencies:** Any other sub-tasks (from this or other features) that need to be completed first.
    *   Consider the "Relevant Resources & Research" from the Improvement Plan when detailing steps, especially for new technologies or complex features like RAG or sandboxed code execution.
    *   Add this detailed, phased plan to the "Proposed Solution" section of your `[TASK_FILE]`. This will serve as your roadmap for the "Iterate on the task" step.
2.  **Action:** NO code changes are to be made at this step. This is purely a planning phase.
3.  **Action:** Update "Current execution step" in `[TASK_FILE]` to: `"5. Iterate on the task"`.

<<< AGENT HALT IF `[YOLO_MODE]` is "Ask": Pause and ask the user: "I have formulated a detailed Proposed Solution, breaking down the entire 'Chatsemble Improvement Plan' into specific, phased sub-tasks. This is documented in the task file. Please review the 'Proposed Solution' section. Do you approve this plan as the roadmap for implementation?" Wait for user approval. >>>

## 5. Iterate on the task
**(Agent Note:** This step will be repeated for each sub-task identified in your "Proposed Solution" until the entire "Chatsemble Improvement Plan" is implemented.)

1.  **Action:** Review the "Task Progress" history in `[TASK_FILE]` (it will be empty for the first iteration). Consult your "Proposed Solution" section in `[TASK_FILE]` to identify the *next logical sub-task* to implement. Announce to the user which sub-task you are starting (e.g., "Starting sub-task AD.1: Setup basic admin routes and layout component").
2.  **Action:** Plan the specific changes for the **current sub-task/iteration**. This involves:
    *   Identifying the exact files to create or modify based on your "Proposed Solution" and the existing project structure (`alwurts-chatsemble.txt`).
    *   Detailing the code changes: functions to add/modify, classes to create, UI component structure, API endpoint logic, database schema modifications (if any for this sub-task).
    *   For UI tasks, describe the components and their basic functionality.
    *   For backend tasks, describe API signatures and core logic.
    *   For DB tasks, specify Drizzle schema changes and any necessary migration SQL (though for DO SQLite, migrations are handled differently, note the schema changes).
3.  **Action:** Present this detailed change plan for the current iteration to the user for approval. The format should be:
    ```
    [PROPOSED CHANGE PLAN FOR CURRENT ITERATION: Sub-task ID - Sub-task Name]

    **Objective:** [Briefly restate the objective of this sub-task from your Proposed Solution]

    **Files to be Created/Modified:**
    *   `[path/to/file1.ts]` (Create/Modify)
    *   `[path/to/file2.tsx]` (Create/Modify)
    *   ...

    **Rationale & Detailed Changes:**
    *   **`[path/to/file1.ts]`:**
        *   Will add function `newAdminFunction()` to handle X.
        *   Will modify `existingFunction()` to include Y.
    *   **`[path/to/newComponent.tsx]`:**
        *   Will create a React component `AdminLayout` with a sidebar and content area.
        *   Will use `shadcn/ui` Tabs for navigation within admin sections.
    *   ... (provide enough detail for the user to understand the scope of work for *this iteration*)

    **Expected Outcome:** [Briefly describe what will be functional or testable after this iteration]
    ```
    Ask the user: "This is the detailed plan for the current iteration: '[Sub-task ID - Sub-task Name]'. Do you approve these specific changes?"
4.  **Action:** If the user approves the change plan for the current iteration:
    a.  **Implement Changes:** Carefully implement the approved code changes. Create new files, modify existing ones. Write unit tests if applicable and feasible for the scope of the sub-task. *Refer constantly to the provided project context (`alwurts-chatsemble.txt`) for existing patterns, utility functions, and component styles.*
    b.  **Append to "Task Progress" in `[TASK_FILE]`:**
        ```markdown
        ---
        **Iteration Start:** [DATETIME_OF_ITERATION_START] (Use `date +'%Y-%m-%d_%H:%M:%S'`)
        - **Iteration Focus:** [Sub-task ID - Sub-task Name]
        - **Files Affected:**
            - `[path/to/file1.ts]` (Created/Modified) - Summary: Added admin routes.
            - `[path/to/AdminLayout.tsx]` (Created) - Summary: Basic admin layout component.
        - **Detailed Changes Summary:** [Provide a concise summary of what was actually implemented. E.g., "Implemented a new Hono router for `/api/admin` with a placeholder GET endpoint. Created `AdminLayout.tsx` with basic `AppHeader` and `AppSidebar` placeholders. Added a new route `/admin/dashboard` in `src/client/routeTree.gen.ts` (manual update if TanStack Router plugin not run yet) pointing to a new `Dashboard.tsx` component."]
        - **Reason for Changes:** Aligned with approved iteration plan for [Sub-task ID].
        - **Blockers Encountered:** [List any blockers, e.g., "Clarification needed on `better-auth` permission integration for new admin roles." If none, state "None."]
        - **Testing Done (if any):** [Briefly describe, e.g., "Manually verified new /admin route loads basic layout." or "Unit tests added for X service."]
        - **Status:** UNCONFIRMED
        **Iteration End:** [DATETIME_OF_ITERATION_END] (Use `date +'%Y-%m-%d_%H:%M:%S'`)
        ```
5.  **Action:** After implementing and documenting, ask the user: "I have implemented the changes for iteration '[Sub-task ID - Sub-task Name]' and updated the Task Progress section in `[TASK_FILE]`. Based on my report and your ability to review the (uncommitted) code changes in the working directory, is the status of this iteration: SUCCESSFUL or UNSUCCESSFUL?"
6.  **Action:** If the user indicates UNSUCCESSFUL:
    *   Update the "Status" for the current entry in "Task Progress" in `[TASK_FILE]` to "UNSUCCESSFUL".
    *   Ask the user for specific feedback on why it was unsuccessful (e.g., "The new UI component doesn't render correctly," or "The API endpoint returns a 500 error," or "The logic in function X is flawed.").
    *   Document this feedback meticulously in the "Task Progress" entry for the current iteration, under a new "User Feedback for Unsuccessful Iteration:" sub-heading.
    *   Revert the changes made in this iteration if possible (e.g., `git stash` or `git checkout -- .` if no other uncommitted work exists that needs preserving; be careful).
    *   Repeat this "Iterate on the task" step from 5.1: Review "Task Progress," re-plan this specific sub-task (addressing the feedback), and seek approval for a revised plan for this sub-task.
7.  **Action:** If the user indicates SUCCESSFUL:
    a.  Update the "Status" for the current entry in "Task Progress" in `[TASK_FILE]` to "SUCCESSFUL".
    b.  **Commit Changes:** Ask the user: "Shall I commit the changes for this successful iteration: '[Sub-task ID - Sub-task Name]'?"
        *   If the user approves, formulate a concise and descriptive commit message based on the sub-task (e.g., "feat(admin): AD.1 - Setup basic admin routes and layout", "feat(memory): PM.1 - Implement DB schema for agent_memories").
        *   Execute: `git add [SPECIFIC_FILES_CREATED_OR_MODIFIED_IN_THIS_ITERATION]` (ensure you only add files relevant to *this* iteration).
        *   Execute: `git commit -m "[YOUR_CONCISE_COMMIT_MESSAGE]"`
    c.  **More Changes for Overall Plan?** Check your "Proposed Solution" in `[TASK_FILE]`. Ask the user: "Are there more sub-tasks remaining from the 'Proposed Solution' to implement the full 'Chatsemble Improvement Plan'?"
        *   If YES (more sub-tasks remain): Update "Current execution step" in `[TASK_FILE]` to: `"5. Iterate on the task (Ongoing - Next: [Next Sub-task ID])"`. Then, repeat this "Iterate on the task" step (from 5.1) for the next sub-task.
        *   If NO (all sub-tasks from "Proposed Solution" are complete and successful): Update "Current execution step" in `[TASK_FILE]` to: `"6. Task Completion"`. Proceed to Step 6 ("Task Completion").
8.  **Action:** (This sub-step is covered by 5.7.c).

## 6. Task Completion
**(Agent Note:** You only reach this step after all sub-tasks in your "Proposed Solution" have been iteratively implemented, confirmed as SUCCESSFUL, and committed.)

1.  **Action:** Stage all accumulated changes (this should primarily be just the task file itself if all iterations were committed, but run `git status` to be sure).
    ```bash
    git status # Agent reviews changes
    git add .tasks/* # Stage the task file(s)
    # If other non-code files were generated and meant to be part of the final commit, add them too.
    ```
2.  **Action:** Formulate a comprehensive `[FINAL_COMMIT_MESSAGE]`. This message should summarize the entire "Chatsemble Improvement Plan" implementation. For example: "feat: Implement Chatsemble enhancements (Admin Dashboard, Persistent Memory, Agent Collab, Proactive Assist, Tooling)".
    Execute:
    ```bash
    git commit -m "[FINAL_COMMIT_MESSAGE]" # Agent executes
    ```
    (This commit primarily finalizes the task file and any other meta-files. All feature code should already be in previous commits).
3.  **Action:** Update "Current execution step" in `[TASK_FILE]` to: `"7. Merge Task Branch"`.

<<< AGENT HALT IF `[YOLO_MODE]` is "Ask": Pause and ask the user: "All features from the 'Chatsemble Improvement Plan' have been implemented and committed to the task branch (`[TASK_BRANCH]`). The task file itself has also been committed with the final summary. Please review the final state of the task branch. Do you approve merging `[TASK_BRANCH]` into `[MAIN_BRANCH]`?" Wait for user confirmation. >>>

## 7. Merge Task Branch
1.  **Action:** Merge the task branch into `[MAIN_BRANCH]`.
    ```bash
    git checkout [MAIN_BRANCH] # (e.g., git checkout main)
    git pull origin [MAIN_BRANCH] # Ensure main branch is up-to-date
    git merge --no-ff [TASK_BRANCH]    # (e.g., git merge --no-ff task/chatsemble-enhancements_YYYY-MM-DD_N)
    ```
    (Using `--no-ff` is good practice for feature branches to preserve history, though not strictly required by the protocol).
2.  **Action:** Verify the merge.
    ```bash
    git diff [MAIN_BRANCH] [TASK_BRANCH]
    ```
    This command should output nothing if the branches are identical post-merge. Report success or any merge conflicts (which should be rare if `[MAIN_BRANCH]` was kept stable) to the user. If conflicts occur, ask the user for guidance on resolving them.
3.  **Action:** Update "Current execution step" in `[TASK_FILE]` to: `"8. Delete Task Branch"`.
4.  **Action (Push to remote):** Ask the user: "The merge to local `[MAIN_BRANCH]` is complete. Shall I push the `[MAIN_BRANCH]` to the remote repository (origin)?"
    * If YES:
        ```bash
        git push origin [MAIN_BRANCH]
        ```
        Report success or failure.

## 8. Delete Task Branch
1.  **Action:** Ask the user: "The merge to `[MAIN_BRANCH]` is complete (and potentially pushed). Shall I delete the local task branch `[TASK_BRANCH]`?"
2.  If approved by the user:
    ```bash
    git branch -d [TASK_BRANCH] # (e.g., git branch -d task/chatsemble-enhancements_YYYY-MM-DD_N)
    ```
    Inform the user if the local branch was deleted successfully.
3.  **Action (Optional Remote Branch Deletion):** Ask the user: "Would you also like to delete the remote branch `[TASK_BRANCH]` from origin?"
    * If YES:
        ```bash
        git push origin --delete [TASK_BRANCH]
        ```
        Report success or failure.
4.  **Action:** Update "Current execution step" in `[TASK_FILE]` to: `"9. Final Review"`.

## 9. Final Review
1.  **Action:** Ask the user: "All planned work for the 'Chatsemble Improvement Plan' has been implemented, merged into `[MAIN_BRANCH]`, and the task branch (`[TASK_BRANCH]`) has been handled (deleted locally/remotely as per your instructions). Please perform any final reviews or checks on the `[MAIN_BRANCH]`. Are you satisfied with the outcome of this entire operation?"
2.  **Action:** Once the user confirms satisfaction, complete the "Final Review" section in your `[TASK_FILE]`. Summarize what was accomplished, referencing the "Chatsemble Improvement Plan" and noting the successful integration of all features.
3.  **Action:** Set the "Current execution step" in `[TASK_FILE]` to: `"All done!"`.
4.  **Action:** Inform the user: "The Chatsemble Improvement Plan implementation is now complete. The task file (`[TASK_FILE]`) is finalized. My work on this task is finished."

**[END OF AGENT EXECUTION PROTOCOL - INSTRUCTIONS FOR AGENT]**

---

This concludes the operational plan for the Execution Agent. The agent should now have all necessary instructions to proceed with implementing the "Chatsemble Improvement Plan" in a structured, iterative, and verifiable manner, using the provided project context and interacting with the user for approvals.