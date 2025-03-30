import { hc } from "hono/client";
import type { AppType } from "../../server/routes";

const API_HOST = import.meta.env.VITE_APP_URL || "http://localhost:5173";

export const honoClient = hc<AppType>(API_HOST);
