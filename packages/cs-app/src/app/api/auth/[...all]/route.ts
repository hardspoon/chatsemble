import { getAuth } from "@/lib/auth/auth-server";
import { toNextJsHandler } from "better-auth/next-js";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	const auth = getAuth();
	const { GET } = toNextJsHandler(auth);
	return GET(request);
}

export async function POST(request: NextRequest) {
	const auth = getAuth();
	const { POST } = toNextJsHandler(auth);
	return POST(request);
}

export const dynamic = "force-dynamic";
