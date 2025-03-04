export { globalSchema } from "./db/schema";

// TODO: Fix import and exports mess
// NOTES: Do not export * instead export each type/function/constant individually so that we can control what is exported and what is not


// TODO: Export all types from a /types/index.ts file?
export * from "./types/chat";
export * from "./types/chat-ws";
export * from "./types/agent";
export * from "./types/drizzle";
export * from "./auth";
export * from "./lib/db/services";
//export * from "./lib/db/db-helpers";
