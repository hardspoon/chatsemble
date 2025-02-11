import { getNextAuth } from "@/auth";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	const { handlers } = getNextAuth();
	return handlers.GET(request);
}

export async function POST(request: NextRequest) {
	const { handlers } = getNextAuth();
	return handlers.POST(request);
}

export const dynamic = "force-dynamic";
