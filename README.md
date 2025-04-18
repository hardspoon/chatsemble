# Chatsemble

Chatsemble is a real-time, multi-user chat application with integrated AI agents, built on the Cloudflare stack.

> This is a work in progress.

## Features

* **Multi-user Chats:**
  * Supports multiple users in a single chat room.

* **AI Agents:**
  * AI agents can join chat rooms and perform tasks.
  * Agents intelligently filter messages.
  * Respond only when relevant.

* **Cloudflare Stack:**
  * Uses Cloudflare Workers for hosting:
    * Next.js frontend (App Router).
    * Hono.js API.
  * Uses D1 for the main database.
  * Uses Durable Objects for real-time:
    * Chat room management.
    * Agent management.

* **Durable Objects:**
  * Each chat room and AI agent is a Durable Object.
  * Provides isolated, persistent storage:
    * Embedded SQLite database.
    * Managed via Drizzle ORM.
  * Handles WebSocket connections.

* **Scalable Architecture:**
  * Demonstrates scalable real-time applications using:
    * Durable Objects.
    * Hono.
    * Drizzle ORM.

* **Two-stage AI Processing:**
  * Smaller model filters messages for relevance.
  * Larger model generates responses for tagged messages.

## Technologies

* **Frontend:**
  * Next.js (App Router) with OpenNext
  * Shadcn UI

* **Backend:**
  * Hono.js (running on Cloudflare Workers)

* **Database:**
  * Cloudflare D1 (main database)
  * Embedded SQLite within Durable Objects (managed by Drizzle ORM)

* **Real-time Communication:**
  * Cloudflare Durable Objects
  * WebSockets

* **ORM:**
  * Drizzle ORM

* **AI:**
  * Vercel AI SDK (for agent functionality)

## Project Structure

Chatsemble is organized into three main packages:

* **`cs-app` (Frontend):**  This is the Next.js (App Router) frontend application. It's responsible for the user interface and user interactions. It communicates with the `cs-api` backend.
  * Technology: Next.js, React, Shadcn UI, Tailwind CSS.
  * Deployment:  Uses OpenNext for serverless deployment on Cloudflare.
  * Structure:

      ```txt
      cs-app/
      ├── src/
      │   ├── app/
      │   │   ├── layout.tsx  # Main layout for the application
      │   │   └── ...
      │   ├── components/
      │   │   └── ...
      │   └── lib/
      │       └── ...
      └── package.json      # Frontend dependencies and scripts
      ```

* **`cs-api` (Backend):** This is the Hono.js API server, running on Cloudflare Workers. It handles backend logic, including user authentication, chat room management, and AI agent interactions.  It uses Durable Objects for real-time functionality and state management.
  * Technology: Hono.js, Cloudflare Workers, Durable Objects, Drizzle ORM.
  * Structure:

      ```txt
      cs-api/
      ├── src/
      │   ├── index.ts      # Main entry point for the API
      │   ├── routes/
      │   │   └── ...
      │   ├── durable-objects/
      │   │   └── ...
      │   └── lib/
      │       └── ...
      └── package.json      # Backend dependencies and scripts
      ```

* **`cs-shared` (Shared Resources):** This package contains shared code and configurations used by both the frontend and backend.  Most importantly, it houses the database schema used by Drizzle ORM for both the main D1 database and the embedded SQLite databases within Durable Objects.
  * Technology: Drizzle ORM, Zod (for validation).
  * Structure:

      ```txt
      cs-shared/
      ├── src/
      │   ├── db/
      │   │   ├── schema/
      │   │   │   └── index.ts  # Database schema definitions
      │   │   └── ...
      │   └── index.ts      # Main entry point for shared resources
      └── package.json      # Shared dependencies and scripts
      ```
