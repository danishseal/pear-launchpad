import { NextResponse } from "next/server";
import { loadLaunchRegistry } from "@/lib/peard/chain";

export const dynamic = "force-dynamic";

const FRESH_FOR_MS = 30_000;
const RESPONSE_HEADERS = {
  "cache-control": "public, s-maxage=30, stale-while-revalidate=300",
  "content-type": "application/json; charset=utf-8",
};

let cachedBody: string | null = null;
let cachedAt = 0;
let refresh: Promise<string> | null = null;

function readLaunches(): Promise<string> {
  if (refresh) return refresh;
  refresh = loadLaunchRegistry()
    .then((snap) => {
      const body = JSON.stringify({ snap });
      cachedBody = body;
      cachedAt = Date.now();
      return body;
    })
    .finally(() => { refresh = null; });
  return refresh;
}

export async function GET() {
  try {
    if (cachedBody) {
      if (Date.now() - cachedAt >= FRESH_FOR_MS) void readLaunches().catch(() => undefined);
      return new Response(cachedBody, { headers: RESPONSE_HEADERS });
    }

    return new Response(await readLaunches(), { headers: RESPONSE_HEADERS });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 502 },
    );
  }
}
