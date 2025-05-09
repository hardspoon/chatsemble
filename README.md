# Chatsemble: Your Open-Source Collaborative AI Workspace

[![GitHub stars](https://img.shields.io/github/stars/alwurts/chatsemble?style=social)](https://github.com/Alwurts/Chatsemble)
[![GitHub license](https://img.shields.io/github/license/alwurts/chatsemble?label=license)](https://github.com/Alwurts/Chatsemble/blob/main/LICENSE)
[![Discord](https://img.shields.io/discord/1348769747709329540?label=discord&logo=discord&logoColor=white)](https://discord.gg/46tMZeVjzS)
[![X](https://img.shields.io/twitter/url?url=https%3A%2F%2Fx.com%2Fchatsemble&label=Chatsemble
)](https://x.com/chatsemble)
[![X](https://img.shields.io/twitter/url?url=https%3A%2F%2Fx.com%2FAlwurts&label=Alwurts
)](https://x.com/Alwurts)

![hero](/public/chatsemble-app.jpg)

Chatsemble is an **open-source**, real-time platform designed to revolutionize how teams work together with AI. It brings humans and intelligent AI agents into the same collaborative space, enabling seamless communication, task automation, and shared workflows – all powered by the robust and scalable Cloudflare ecosystem.

Think of it like your team's chat app, but supercharged with customizable AI assistants that participate just like human members, helping you research, automate tasks, and get more done, together.

> **This project is actively under development.** We're building in the open, and contributions are welcome!

## ✨ Why Chatsemble?

*   **Seamless Human-AI Collaboration:** Chat directly with AI agents alongside your team members in shared chat rooms. Agents understand context and participate intelligently.
*   **Real-time Multiplayer Experience:** Built with WebSockets, Chatsemble provides instant message delivery and updates, making collaboration feel fluid and immediate.
*   **Powerful AI Capabilities:** Equip agents with tools for web research, task automation, and more. Create custom workflows to automate routine processes.
*   **Open Source & Customizable:** As an open-source project under the GPL-3.0 license, Chatsemble encourages transparency, community contributions, and allows self-hosting.
*   **Built on Cloudflare:** Leverages Cloudflare Workers, Durable Objects, and D1 for a scalable, performant, and cost-effective serverless architecture.

## 🚀 Features

*   **Real-time Chat:**
    *   **Multi-user Channels:** Create chat rooms for teams or projects.
    *   **Threaded Conversations:** Keep discussions organized by replying in threads.
    *   **Mentions:** Easily tag users and agents using `@mentions` to direct messages or tasks.
*   **Intelligent AI Agents:**
    *   **Agents as Members:** Add AI agents to any chat room just like human members.
    *   **Customizable Personalities:** Define how agents behave – their tone (formal, casual), verbosity (concise, detailed), emoji usage, and language style.
    *   **Context-Aware Participation:** Agents can understand the conversation and respond only when relevant or explicitly mentioned.
*   **AI Tool Usage:**
    *   **Web Research:** Agents can perform web searches and deep research tasks directly within the chat.
    *   **Real-time Tool Feedback:** See updates as agents work on tasks like web crawls or research.
*   **Automated Workflows:**
    *   **Scheduled Tasks:** Define multi-step workflows for agents to execute automatically based on a schedule (e.g., daily reports, weekly summaries).
    *   **Goal-Oriented:** Specify the overall goal and individual steps for each workflow.
    *   **Dedicated Threads:** Workflows automatically create threads to post their progress and results, keeping main channels clean.
*   **Open Source & Self-Hostable:**
    *   **Transparency:** Understand exactly how Chatsemble works by exploring the code.
    *   **Control Your Data:** Host Chatsemble on your own Cloudflare account.
    *   **Extensibility:** Modify and extend the platform.

## 🏗️ Architecture Overview (Simplified)

Chatsemble leverages the power of the Cloudflare stack:

*   **Frontend:** A React application provides the user interface.
*   **Backend API:** Built with Hono, running on Cloudflare Workers, handling requests and business logic.
*   **Database:** Cloudflare D1 stores primary application data (users, organizations).
*   **Real-time & State:** Cloudflare Durable Objects are the core of the real-time system. **A single Durable Object per organization** manages WebSocket connections for all users in that org, handles message broadcasting, AI agent interactions, workflow scheduling, and maintains chat room state using an embedded SQLite database (managed via Drizzle ORM). This ensures data locality and efficient real-time communication within an organization.

## 💻 Technologies

*   **Frontend:**
    *   Vite with React
    *   React & TypeScript
    *   Tailwind CSS & Shadcn UI
    *   TanStack Router & Query
*   **Backend:**
    *   Hono.js with RPC functionality (on Cloudflare Workers)
    *   Cloudflare Durable Objects
*   **Database:**
    *   Cloudflare D1 (Main relational data)
    *   SQLite (within Durable Objects for real-time state)
    *   Drizzle ORM (for both D1 and DO SQLite)
*   **Real-time:**
    *   WebSockets (managed by Durable Objects)
*   **AI Integration:**
    *   AI SDK (Vercel AI SDK)
    *   Cloudflare AI Gateway
    *   LLM Providers (e.g., OpenAI, Google Gemini)
    *   External Tools (e.g., Firecrawl, Brave Search)
*   **Authentication:**
    *   Better Auth

## 📁 Project Structure

Chatsemble is a monorepo managed with pnpm workspaces, organized into key packages:

*   **`client` (Frontend):** The React application handling the UI and user interaction.
    *   Uses TanStack Router for routing and TanStack Query for data fetching.
    *   Communicates with the `server` API.
    *   Handles WebSocket connections with the `OrganizationDurableObject`.
*   **`server` (Backend):** The Hono API running on Cloudflare Workers.
    *   Defines API routes (`/api`).
    *   Includes the `OrganizationDurableObject` implementation which manages real-time logic, AI interactions, and state persistence within its embedded SQLite DB.
    *   Handles authentication via Better Auth.
    *   Interacts with Cloudflare D1 for global data.
*   **`shared` (Shared Code):** Contains types, schemas (Zod), and utility functions used by both frontend and backend.

## 🚀 Getting Started

This guide will walk you through setting up Chatsemble for development and deployment on Cloudflare.

### 1. Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js:** (LTS version recommended, e.g., v18 or v20). You can download it from [nodejs.org](https://nodejs.org/).
*   **pnpm:** Chatsemble uses pnpm for package management. Install it globally after Node.js:
    ```bash
    npm install -g pnpm
    ```
    *Self-correction: Changed to pnpm setup*
    ```bash
    pnpm setup
    ```
*   **Cloudflare Account:** You'll need a Cloudflare account. If you don't have one, sign up at [cloudflare.com](https://www.cloudflare.com/).
*   **Wrangler CLI:** The official CLI for Cloudflare Workers. Install it globally:
    ```bash
    pnpm add -g wrangler
    ```
    After installation, log in to your Cloudflare account:
    ```bash
    wrangler login
    ```

### 2. Clone and Install Dependencies

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/Alwurts/Chatsemble.git
    cd Chatsemble
    ```

2.  **Install Dependencies:**
    ```bash
    pnpm install
    ```

### 3. Configure Cloudflare Services

You'll need to configure several Cloudflare services. Most of this configuration will be managed through your `wrangler.jsonc` file (or `wrangler.toml` if you choose to migrate to it, but the project currently lists `wrangler.jsonc`).

**Create a `wrangler.jsonc` file if it doesn't exist, or update your existing one.**
A basic structure might look like this (you'll need to fill in specifics):

```jsonc
// wrangler.jsonc
{
    "name": "chatsemble-server", // Your worker name
    "main": "src/server/index.ts", // Entry point for your worker
    "compatibility_date": "YYYY-MM-DD", // Use a recent date
    "account_id": "YOUR_CLOUDFLARE_ACCOUNT_ID", // Find this in your Cloudflare dashboard
    "workers_dev": true,
    "d1_databases": [
        {
            "binding": "DB", // How you access it in your worker code (e.g., c.env.DB)
            "database_name": "chatsemble-main-db",
            "database_id": "YOUR_D1_DATABASE_ID_MAIN"
        }
    ],
    "durable_objects": {
        "bindings": [
            {
                "name": "ORGANIZATION_DO", // How you access it in your worker code
                "class_name": "OrganizationDurableObject" // The exported class name from your DO code
            }
        ]
    },
    "migrations": [ // For D1 global schema
        { "tag": "v1", "new_classes": ["OrganizationDurableObject"] }
    ],
    "vars": { // Environment variables
        "DATABASE_URL": "YOUR_D1_CONNECTION_STRING_FOR_DRIZZLE_LOCAL_GENERATION_ONLY", // Not directly used by worker in prod for D1
        "BETTER_AUTH_CLIENT_ID": "YOUR_BETTER_AUTH_CLIENT_ID",
        "BETTER_AUTH_CLIENT_SECRET": "YOUR_BETTER_AUTH_CLIENT_SECRET",
        "BETTER_AUTH_ISSUER": "YOUR_BETTER_AUTH_ISSUER_URL",
        "OPENAI_API_KEY": "YOUR_OPENAI_API_KEY", // Or other LLM keys
        "GEMINI_API_KEY": "YOUR_GOOGLE_GEMINI_API_KEY"
        // Add other necessary environment variables here (e.g., tool API keys)
    },
    "ai": { // For Cloudflare AI Gateway
        "binding": "AI" // How you access it in your worker (e.g., c.env.AI)
    }
    // Add other configurations like R2 bucket bindings, KV namespaces if needed.
}

```
**Note:** The `OrganizationDurableObject` also uses an internal SQLite database. Its Drizzle ORM migrations (`src/server/organization-do/db/migrations/`) are applied programmatically within the Durable Object's constructor or first access.

#### a. Cloudflare D1 (Main Database)

1.  **Create D1 Database:**
    Use the Wrangler CLI to create your main D1 database:
    ```bash
    wrangler d1 create chatsemble-main-db
    ```
    This command will output the `database_id`. Update this in your `wrangler.jsonc`.

2.  **Apply D1 Migrations:**
    The main D1 schema migrations are located in `src/server/db/migrations/`. To apply them:
    ```bash
    # Ensure your wrangler.jsonc is configured with the D1 database binding
    # Drizzle Kit generates migrations, Wrangler applies them for D1.
    # For local development with Drizzle Studio or generating migrations, you might need a .env file:
    # DATABASE_URL="wrangler-d1://YOUR_DATABASE_ID"
    # pnpm run db:generate # If you make schema changes in src/server/db/schema/
    pnpm run db:migrate # This usually involves wrangler d1 execute commands
    ```
    You might need to run `wrangler d1 execute chatsemble-main-db --file=src/server/db/seed.sql` to seed initial data if applicable, or adapt the `db:migrate` script in `package.json`.

#### b. Cloudflare Durable Objects (Real-time & State)

1.  **Define Binding:**
    Ensure your `wrangler.jsonc` has a `durable_objects` binding as shown in the example above. The `class_name` must match the exported class name of your Durable Object (`OrganizationDurableObject` in `src/server/organization-do/`).

2.  **Migrations for Durable Object SQLite:**
    Migrations for the SQLite database *within* each Durable Object instance are managed by Drizzle ORM and applied by the DO's code itself (likely upon first instantiation or a specific lifecycle event). You'll find these migrations under `src/server/organization-do/db/migrations/`. Ensure `drizzle.config.ts` and `drizzle.do.config.ts` are correctly set up for Drizzle Kit to generate migrations for both D1 and the DO's SQLite.

#### c. Cloudflare AI Gateway (Optional but Recommended)

If you plan to use multiple LLMs or want better observability:
1.  Go to your Cloudflare Dashboard -> AI -> AI Gateway.
2.  Create a new AI Gateway.
3.  Note the endpoint and add any LLM provider credentials.
4.  The `ai` binding in `wrangler.jsonc` will allow your Worker to use this gateway.

#### d. Environment Variables

Set the following environment variables in your Cloudflare Worker's settings (Dashboard -> Workers & Pages -> Your Worker -> Settings -> Variables) or via `wrangler secret put VAR_NAME` for secrets:

*   `DATABASE_URL`: While D1 bindings are preferred in Workers, Drizzle Kit might use this for local migration generation. For deployed workers, D1 bindings in `wrangler.jsonc` are used.
*   `BETTER_AUTH_CLIENT_ID`: Your Client ID from Better Auth.
*   `BETTER_AUTH_CLIENT_SECRET`: Your Client Secret from Better Auth. (Use `wrangler secret put`)
*   `BETTER_AUTH_ISSUER`: The issuer URL for your Better Auth instance.
*   `OPENAI_API_KEY`: Your OpenAI API key (if using OpenAI). (Use `wrangler secret put`)
*   `GEMINI_API_KEY`: Your Google Gemini API key (if using Gemini). (Use `wrangler secret put`)
*   Any other API keys for external tools (e.g., Firecrawl, Brave Search). (Use `wrangler secret put`)

For local development with `wrangler dev`, create a `.dev.vars` file in the root of your project and add your secrets/variables there (this file should be in `.gitignore`).
```
# .dev.vars
DATABASE_URL="YOUR_D1_LOCAL_CONNECTION_STRING_IF_NEEDED_BY_DRIZZLE_KIT"
BETTER_AUTH_CLIENT_ID="YOUR_BETTER_AUTH_CLIENT_ID"
BETTER_AUTH_CLIENT_SECRET="YOUR_BETTER_AUTH_CLIENT_SECRET"
BETTER_AUTH_ISSUER="YOUR_BETTER_AUTH_ISSUER_URL"
OPENAI_API_KEY="YOUR_OPENAI_API_KEY"
GEMINI_API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"
```

### 5. Building and Running the Application

The project is a monorepo. The `package.json` in the root likely contains scripts to manage both client and server.

#### a. Local Development

1.  **Start the Development Server (Worker and Client):**
    There's likely a command to run both the client (Vite dev server) and the server (Wrangler dev) concurrently. Check `package.json` for a script like `dev`. It might involve `pnpm --filter ./packages/client dev` and `pnpm --filter ./packages/server dev` or `wrangler dev src/server/index.ts --persist --local` (for the server) and `pnpm --filter client dev` (for the client) run in separate terminals or via a tool like `concurrently`.
    A common setup:
    *   Terminal 1 (Backend Worker):
        ```bash
        # From the root directory
        # This command will use .dev.vars for environment variables
        wrangler dev src/server/index.ts --local --persist-to .wrangler/state/d1 # Adjust path to your server entry
        ```
        `--local` runs the worker locally. `--persist-to` stores D1 and DO data locally.
    *   Terminal 2 (Frontend Client):
        ```bash
        # From the root directory
        pnpm --filter client dev
        ```
    The client application will typically be available at `http://localhost:5173` (Vite's default) and the worker at `http://localhost:8787` (Wrangler's default). The client will be configured to make requests to the worker.

#### b. Building for Production

Check `package.json` for a build script, often `pnpm build`. This should build both the client and server packages.
```bash
pnpm build
```
This might run `pnpm --filter client build` and `pnpm --filter server build`. The client build output (usually a `dist` folder) might need to be served by the Cloudflare Worker or deployed to Cloudflare Pages. If serving from the worker, ensure the worker code is set up to serve static assets.

#### c. Deployment to Cloudflare

1.  **Deploy the Worker (Server):**
    ```bash
    wrangler deploy src/server/index.ts # Adjust path to your server entry
    ```
    Make sure your `wrangler.jsonc` is correctly configured with your `account_id` and any production environment variables are set in the Cloudflare dashboard.

2.  **Deploy the Client (Frontend):**
    *   **If served by Cloudflare Pages:** Configure a new Pages project linked to your Git repository and set the build command (e.g., `pnpm build --filter client`) and output directory (e.g., `packages/client/dist`).
    *   **If served by the Worker:** The worker's build process should bundle or include the client's static assets, and the worker's code must have routes to serve these assets.

### 6. Important Files to Check/Configure

*   **`wrangler.jsonc`:** This is your primary Cloudflare deployment configuration file. Double-check all paths, names, IDs, and bindings.
*   **`package.json` (root and in `client`/`server` packages):** Review the scripts for development, building, and deployment.
*   **`vite.config.ts` (in `client` package):** Ensure the `server.proxy` or API request paths are correctly configured to point to your Cloudflare Worker URL during development and production.
*   **`drizzle.config.ts` and `drizzle.do.config.ts`:** Verify these for Drizzle ORM, especially the schema and out paths for migrations.
*   **`src/server/index.ts` (or your worker entry point):** Understand how environment variables are used and how services (D1, DO, AI) are accessed.
*   **`src/client/lib/api-client.ts` (or similar):** Check how the frontend makes API calls to the backend. The base URL should be configurable or correctly inferred for different environments.

You should now have a clearer path to getting Chatsemble up and running! Remember that this is a complex application, so take your time with each step.

## 🤝 Contributing

We welcome contributions! Check out the open issues on GitHub to find areas where you can help.

## 📄 License

Chatsemble is released under the [GNU General Public License v3.0](LICENSE).
