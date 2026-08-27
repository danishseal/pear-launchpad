import { SEED_URL } from "./config";

/**
 * Registry metadata that is not on chain: the human name, the category, and
 * whether the number is a price or a bare measurement. The last one matters
 * for honesty - a scalar pairable has no dollars-per-unit, so rendering one
 * with a $ in front would be inventing a claim the registry does not make.
 *
 * Ported from the Vite app's `App.tsx`, which loaded the same file. It lives
 * in its own module here because `api.ts` is the only consumer and a data
 * layer should not be reading a JSON fixture out of a component.
 */
export interface Meta {
  name: string;
  category: string;
  valuation: "price" | "scalar" | "rate";
  source: string;
  /** Token-2022 powers the asset's issuer retains over holders. */
  issuerPowers?: string[];
  assetSymbol?: string;
  assetMint?: string;
  /**
   * Grade decides which of the two paths a launch on this pairable is.
   *
   * This is the file's INTENT. The chain carries its own, the program enforces
   * the chain's, and three entries disagree today. See `grade.ts`; never
   * substitute one for the other.
   */
  grade?: "hard" | "soft" | "index";
  unitLabel?: string;
  /**
   * What a live quote actually filled, and at what size.
   *
   * Deliberately a different fact from `assetLiquidityUsdAsOf`, which is a
   * pool balance read off an aggregator. A mint reporting $44,055 of liquidity
   * that moves 89.64% on a $25,000 order does not have $44,055 of liquidity,
   * and conflating the two is exactly what got SLV listed as hard grade.
   */
  executableDepth?: { usd: number; impactPct: number; date: string };
  assetLiquidityUsdAsOf?: { value: number; date: string };
}

/**
 * NOTE for whoever re-copies `public/data/seed.json` from ~/pricedin.
 *
 * The served copy has its `$comment` block REMOVED on purpose. That block is
 * the registry's internal design notes and it leads with the framing the owner
 * rejected outright ("pair with literally anything"). This file is public: it
 * is fetched by the browser from `/data/seed.json`, so anything in it is
 * shipped copy whether or not any component renders it. Nothing here reads
 * `$comment`; strip it again after any re-copy.
 *
 * `usdMint` in that file names mainnet Circle USDC and is NOT what devnet
 * uses. It is left in place and ignored: the collateral mint is read off the
 * `pricedin` and `contango` Global accounts at runtime.
 */
interface SeedEntry {
  id: string;
  name?: string;
  category?: string;
  valuation?: Meta["valuation"];
  source?: string;
  issuerPowers?: string[];
  assetSymbol?: string;
  assetMint?: string;
  grade?: Meta["grade"];
  unitLabel?: string;
  executableDepth?: Meta["executableDepth"];
  assetLiquidityUsdAsOf?: Meta["assetLiquidityUsdAsOf"];
}

let cache: Record<string, Meta> | null = null;
let inFlight: Promise<Record<string, Meta>> | null = null;

/**
 * Names for the registry, or an empty map.
 *
 * A missing fixture is not an error: every id renders as itself, which is
 * ugly and true. Inventing a name for a pairable nobody described would be
 * the other thing.
 */
export async function loadMeta(): Promise<Record<string, Meta>> {
  if (cache) return cache;
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const out: Record<string, Meta> = {};
    try {
      const res = await fetch(SEED_URL);
      if (res.ok) {
        const d = (await res.json()) as { pairables?: SeedEntry[] };
        for (const e of d.pairables ?? []) {
          out[e.id] = {
            name: e.name ?? e.id,
            category: e.category ?? "",
            valuation: e.valuation ?? "price",
            source: e.source ?? "",
            issuerPowers: e.issuerPowers,
            assetSymbol: e.assetSymbol,
            assetMint: e.assetMint,
            grade: e.grade,
            unitLabel: e.unitLabel,
            executableDepth: e.executableDepth,
            assetLiquidityUsdAsOf: e.assetLiquidityUsdAsOf,
          };
        }
      }
    } catch {
      /* served statically; absence is normal */
    }
    cache = out;
    inFlight = null;
    return out;
  })();
  return inFlight;
}
