# **App Name**: DocuMind

## Core Features:

- Contextual Snippet Display: Display relevant documentation snippets within the IDE based on the current cursor position and code context.
- AI-Powered Suggestion Tool: Automatically generate suggestions for documentation improvements or updates based on code changes using a tool.
- Task Management: Provide a task list within the IDE or web console, displaying documentation-related tasks such as writing documentation for undocumented APIs.
- Doc Review & Refinement: Scheduled AI-driven audits that flag unclear sections, broken links, missing examples, and automatically suggest backlinks.
- Autonomous Updates: Git hook or webhook-triggered diff analysis that drafts updated doc snippets or PRs when function signatures or APIs change.

## Style Guidelines:

- Primary color: Soft gray (#F0F0F0) for a clean and professional look.
- Secondary color: Dark blue (#34495E) for headers and important elements.
- Accent: Teal (#008080) to highlight interactive elements and CTAs.
- Use a consistent grid system for a structured layout.
- Use a set of minimalistic icons to represent different documentation types and actions.
- Subtle animations for transitions and loading states to enhance user experience.

## Original User Request:
# AI‑Driven Documentation Monitoring System — Comprehensive Design & Implementation Guide (v2025‑04‑26)

## Table	of	Contents

1. Executive	Summary
2. End‑to‑End Architecture Overview
3. Component Responsibilities & Data	Flow
4. Technology Evaluation Matrix
5. API Contracts (OpenAPI	3.1)
6. Knowledge‑Base & Context Provisioning
7. Task Orchestration & Planner Design
8. IDE / MCP Integrations
9. Implementation Roadmap & Milestones
10. Proof‑of‑Concept (PoC) Tasks
11. References & Further	Reading

---

## 1. Executive	Summary

This guide specifies a **local‑first yet cloud‑ready** system that continuously ingests project documentation, detects inconsistencies, and provides AI‑assisted fixes—all surfaced inside the developer’s IDE or a web console. Core features align with industry best practice: Retrieval‑Augmented Generation (RAG), goal‑driven task planners, semantic memory (Qdrant MCP), and CI‑driven quality gates.

---

## 2. End‑to‑End Architecture Overview

```
┌────────────┐    Git Webhook    ┌──────────────────┐
│  Git Repo  │ ───────────────▶ │  API Gateway     │
└────────────┘                  │  (FastAPI)       │
     ▲  ▲          REST / SSE   └─────────▲────────┘
     │  │                              Queue
     │  └──── IDE Hook / MCP                │
     │                                     ▼
┌────┴─────┐      Tasks        ┌──────────────────┐
│  Celery  │ ───────────────▶ │  Worker Pool     │
│  /RQ     │      ► ingest    │  (PocketFlow     │
└──────────┘      ► analyse   │   Agents)        │
                   ► update   └─────────▲────────┘
                                        │Semantic R/W
                                        ▼
                               ┌──────────────────┐
                               │ Qdrant + MCP     │
                               │  Vector Store    │
                               └──────────────────┘
```

*IDE plugin* calls **/context** and **/tasks** to fetch snippets & to‑do lists; MCP guarantees low‑latency semantic retrieval. Workers run PocketFlow agents that invoke `qdrant-store` / `qdrant-find`, LLMs, and style‑lint tools (Vale).

---

## 3. Component Responsibilities & Data	Flow

| Stage                                      | Functionality                                                                    | Key Tools                                         | Output                                       |
| ------------------------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------- |
| **Ingestion**                              | Convert Markdown, URL, and code/text                                             | Pandoc, LangChain loaders, FastEmbed              | Vectors + metadata into Qdrant `docs-memory` |
| **Context Provisioning**                   | For active cursor file, fetch top‑K relevant doc / PRD / RFC excerpts            | `qdrant-find` via MCP                             | JSON snippets with scores & backlinks        |
| **Dashboard with Doc Review & Refinement** | Manually triggered and Nightly agent audits clarity, style, gaps, adds backlinks | PocketFlow agent + Vale + regex checkers          | Findings table + GitHub issues               |
| **Autonomous Updates**                     | On commit, diff code↔docs, draft updates, open PR                                | GitPython, LlamaIndex `DiffReader`, OpenAI GPT‑4o | Draft markdown patch or PR comment           |
| **Task Orchestration**                     | YAML Goal DSL ➜ tasks (effort, priority, owner)                                  | Celery + Temporal optional                        | `/tasks` API & IDE panel                     |

---

## 4. Technology Evaluation Matrix

| Layer                  | Option           | Pros                                           | Cons                          |
| ---------------------- | ---------------- | ---------------------------------------------- | ----------------------------- |
| **Vector	DB**          | SQLite	+	FAISS   | zero‑deps, fast dev                            | single‑node, no hybrid search |
|                        | Qdrant           | Rust performance, HNSW, hybrid BM25, MCP ready | external service              |
|                        | SingleStore      | SQL + vectors, HA, joins                       | heavier, licence tiers        |
| **RAG	Framework**      | LangChain        | large ecosystem, many loaders                  | breaking changes, heavier     |
|                        | LlamaIndex       | composite graphs, auto‑refresh                 | smaller community             |
| **Backend	Lang**       | Python	(FastAPI) | async, uvicorn, rich typing                    | GIL unless workers multiproc  |
|                        | Node.js	(Nest)   | dev familiarity JS                             | less mature ML libs           |
| **Queue**              | Celery/Redis     | mature, ETA/retry                              | config verbose                |
|                        | RQ/Redis         | lightweight                                    | no priority queues            |
| **Task	Orchestration** | Temporal         | durable, replayable                            | extra infra                   |
|                        | Celery	Beat      | simple                                         | limited DAG                   |

**Recommendation**: **Python + FastAPI + Celery + Qdrant + LlamaIndex** for balanced OSS activity and quickest path to PoC.

---

## 5. Sample API	(OpenAPI	3.1 excerpt)

```yaml
paths:
  /context:
    post:
      summary: Retrieve context snippets for active cursor
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ContextRequest'
      responses:
        '200':
          description: Top‑K snippets
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ContextResponse'
  /tasks:
    get:
      summary: List active documentation tasks
      responses:
        '200':
          content:
            application/json:
              schema:
                type: array
                items: { $ref: '#/components/schemas/Task' }
components:
  schemas:
    ContextRequest:
      type: object
      properties:
        filepath: { type: string }
        cursorLine: { type: integer, nullable: true }
    Snippet:
      type: object
      properties:
        text: { type: string }
        score: { type: number }
        sourcePath: { type: string }
    ContextResponse:
      type: object
      properties:
        snippets:
          type: array
          items: { $ref: '#/components/schemas/Snippet' }
    Task:
      type: object
      properties:
        id: { type: string }
        description: { type: string }
        effort: { type: integer }
        priority: { type: string, enum: [low, med, high] }
        status: { type: string, enum: [pending, in_progress, done] }
```

---

## 6. Knowledge‑Base Criteria Example

```yaml
collection: docs-memory
chunk_size_tokens: 400
embeddings: all-MiniLM-L6-v2
metadata_fields:
  - repo
  - file_path
  - section
hierarchy:
  PRD  ➜  Feature Spec ➜  API Guide ➜  Code Samples
backlink_rules:
  - if: section contains "authentication"
    link_to: /security/auth-overview.md
quality_thresholds:
  readability: 70
  max_passive_percent: 20
```

---

## 7. Task Planner YAML DSL (Goal	→	Tasks)

```yaml
goal: api_docs_currency
metric: undocumented_public_apis
threshold: 0
generate:
  query: |
    SELECT name FROM api_symbols s
    LEFT JOIN docs d ON d.symbol = s.name
    WHERE d.symbol IS NULL;
  task_template:
    description: "Add documentation for {{ symbol }} API"
    effort: 2
    priority: high
```

---

## 8. IDE / MCP Integration Quick	Steps

1. **VSCode Extension**: use WebView to display panels; call `/context` on cursor move; render snippets + citations; allow "Accept suggestion" → opens PR patch.
2. **MCP Tools**: Agentscope or PocketFlow agents invoke `qdrant-find` & `qdrant-store` via SSE for ultra‑low latency memory.

---

## 9. Implementation Roadmap

| Sprint | Milestone         | Deliverables                                                          |
| ------ | ----------------- | --------------------------------------------------------------------- |
| 0      | Environment       | Docker‑Compose (Qdrant, Redis, FastAPI, MCP) running                  |
| 1      | Ingestion POC     | CLI `ingest ./docs` ➜ vectors stored; `/context` returns snippets     |
| 2      | Git Webhook       | Push event auto‑ingests changed MD; Celery task queued                |
| 3      | IDE Panel         | VSCode webview shows docs snippets + task list                        |
| 4      | QA Agent          | Nightly Celery Beat runs style‑lint & gap finder; opens GitHub issues |
| 5      | Autonomous Update | Diff‑aware agent drafts PR with doc changes                           |
| 6      | Goal Planner      | YAML DSL parsed; tasks auto‑generated; metrics dashboard              |

---

## 10. Proof‑of‑Concept CLI Snippets

```bash
# ingest local markdown
python -m tools.ingest --path docs/ --repo myorg/myrepo

# query context for a file
curl -X POST http://localhost:8000/context \
     -H 'Content-Type: application/json' \
     -d '{"filepath":"src/auth.py","cursorLine":42}'

# create goal
curl -X POST http://localhost:8000/goals -d @goal.yaml
```

---

## 11. References & Inspiration

- **Qdrant MCP Server** – semantic memory layer (GitHub	qdrant/mcp-server-qdrant)
- **PocketFlow Template	Python** – 100‑line agentic framework
- DocAider (Microsoft) – multi‑agent docs automation (arXiv	2024)
- “What’s wrong with AI‑generated docs?” – passo.uno (2025)
- “Technical Writing Predictions	2025” – passo.uno (2024)
- LlamaIndex composable graphs & diff readers – blog.llamaindex.ai

---

## 12. Next	Steps

1. **Spin‑up PoC** (`docker compose up -d`) and ingest sample docs.
2. Wire **GitHub webhook** and verify Celery tasks execute.
3. Install **VSCode extension** and confirm inline snippet fetch.
4. Run **nightly QA agent**, check generated issues.
5. Evaluate SingleStore or Weaviate if multi‑repo scaling is required.
6. Collect writer feedback to refine style prompts & embedding model choice.

> **Outcome**: A full‑stack, agent‑driven documentation platform that continuously aligns docs with code, surfaces actionable tasks, and embeds context directly into the developer workflow.

1.	Goals
	1.	Ensure documentation remains accurate, complete, and in sync with evolving code.
	2.	Provide developers with on-demand, context-aware doc snippets directly inside their IDE.
	3.	Automate detection and remediation of gaps, inconsistencies, and outdated references.
	4.	Maintain a transparent, traceable to-do list of documentation tasks driven by high-level project goals.
	5.	Preserve a local-first, privacy-respecting architecture with optional scale-out to managed services.
2.	Most Important Features
	•	Context Provisioning: RAG-powered retrieval of the top K relevant doc chunks (PRDs, RFCs, code comments) based on the file path and cursor location.
	•	Doc Ingestion Pipeline: Multi-format ingestion (Markdown, Confluence, Word, spreadsheets) → chunk splitting → embedding → vector store (Qdrant/FAISS).
	•	Doc Review & Refinement: Scheduled AI-driven audits that flag unclear sections, broken links, missing examples, and automatically suggest backlinks.
	•	Autonomous Updates: Git hook or webhook-triggered diff analysis that drafts updated doc snippets or PRs when function signatures or APIs change.
	•	Task Orchestration: Goal-DSL → query metrics (e.g. “undocumented public APIs”) → auto-generate tasks with effort estimates and priorities → surface in IDE and web UI.
3.	Problems
	•	Documentation Drift: Code evolves faster than docs, leading to stale or incorrect references.
	•	Discovery Friction: Developers waste time searching for the right section across multiple repos or Confluence spaces.
	•	AI Hallucination: LLMs generate plausible but incorrect docs without grounding in actual project content.
	•	Manual Overhead: Writing examples, back-links, and style enforcement is tedious and error-prone.
	•	Lack of Accountability: No systematic way to track what needs updating, who’s responsible, or the priority of doc tasks.
4.	Solutions
	•	Vector-Powered RAG (via Qdrant MCP or FAISS+SQLite) to ground LLM prompts in real project docs and code comments.
	•	Git Integration (webhooks & local hooks) to trigger incremental re-ingestion and diff-aware doc drafting on every commit.
	•	PocketFlow-Style Agents orchestrating ingestion, analysis, and update steps, with human-in-the-loop checkpoints for any AI-generated change.
	•	Style-Guide Enforcement using linters (Vale) and custom regex/DSL checks within CI/CD to maintain clarity and consistency.
	•	Goal-Driven Planner (YAML DSL + Celery/Temporal) that auto-generates, prioritizes, and tracks doc tasks, visible in both IDE panels and a web dashboard.
	•	Feedback Loop: Capture developer actions (accepted, edited, or rejected suggestions) to refine prompts, embedding models, and audit rules over time.

⸻

Recommendation:
Adopt the Python + FastAPI + Celery + Qdrant/MCP + PocketFlow agent stack for rapid PoC, then evolve toward SingleStore or managed vector services and a Temporal-backed workflow engine for enterprise scale. This approach balances immediate developer impact with a clear path to a future-proof, fully automated documentation platform.

  