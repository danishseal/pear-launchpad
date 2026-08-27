import { snapshot } from "@/lib/peard/upstream";
import { EMPTY_SNAPSHOT } from "@/lib/peard/token-data";

/**
 * One token's live numbers, normalised across venues.
 *
 * This exists because pump.fun's API refuses browser origins. It is also the
 * place to add caching, a second venue, or a real indexer later without any
 * client change: the shape is the contract.
 */

/** Base58 is not hex and not a slug. Reject anything else before it becomes
 *  part of an upstream URL. */
const MINT = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export async function GET(_req: Request, ctx: RouteContext<"/api/token/[mint]">) {
  const { mint } = await ctx.params;
  if (!MINT.test(mint)) {
    return Response.json({ error: "not a mint address" }, { status: 400 });
  }

  try {
    const snap = await snapshot(mint);
    return Response.json(snap, {
      // Ten seconds is short enough that a launch shows up promptly and long
      // enough that a hundred open tabs are ten calls a minute upstream, not
      // a thousand.
      headers: { "cache-control": "public, s-maxage=10, stale-while-revalidate=30" },
    });
  } catch {
    // An upstream being down is not the same as a token not existing, but
    // from here they are indistinguishable, and the pre-launch shape is the
    // safe thing to render.
    return Response.json(EMPTY_SNAPSHOT(mint), { status: 200 });
  }
}
