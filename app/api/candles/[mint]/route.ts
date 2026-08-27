import { candles } from "@/lib/peard/upstream";
import { isRangeKey } from "@/lib/peard/token-data";

/** Price history, from pump.fun for a pump.fun coin and from Jupiter for a
 *  Meteora launch or anything else. Same shape either way. */

const MINT = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export async function GET(req: Request, ctx: RouteContext<"/api/candles/[mint]">) {
  const { mint } = await ctx.params;
  if (!MINT.test(mint)) {
    return Response.json({ error: "not a mint address" }, { status: 400 });
  }

  const raw = new URL(req.url).searchParams.get("range") ?? "1D";
  const range = isRangeKey(raw) ? raw : "1D";

  try {
    const rows = await candles(mint, range);
    return Response.json(
      { range, candles: rows },
      { headers: { "cache-control": "public, s-maxage=10, stale-while-revalidate=30" } }
    );
  } catch {
    // An empty series draws the "no trades yet" state, which is the right
    // thing to show when the history cannot be read.
    return Response.json({ range, candles: [] }, { status: 200 });
  }
}
