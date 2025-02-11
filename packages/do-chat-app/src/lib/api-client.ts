import { hc } from "hono/client";
import type { AppType } from "../../../do-chat-api/src/index";
const API_HOST =
	process.env.NEXT_PUBLIC_DO_CHAT_API_HOST || "http://localhost:8787";

// Create a type-safe client with the correct base path
export const client = hc<AppType>(API_HOST);
