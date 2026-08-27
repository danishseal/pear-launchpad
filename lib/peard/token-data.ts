/**
 * One shape for a launched token, whatever venue it launched on.
 *
 * Shared by the route handlers that fill it in and by the client that reads
 * it, so a venue added later changes one server file and nothing in the UI.
 *
 * WHY THERE IS A SERVER SIDE AT ALL. pump.fun's API is the authority on a
 * pump.fun coin and it answers `403` to any request carrying a browser
 * `Origin` header. The same URL returns `200` from a server. So the browser
 * cannot read it directly, and the choice is between a proxy and a worse
 * source. These handlers are that proxy, and having them also buys the
 * caching that keeps one popular token from becoming a thousand calls a
 * minute against somebody else's API.
 */

export type Venue = "pump.fun" | "meteora" | "other";

/**
 * `awaiting` is a real state, not an error.
 *
 * pump.fun reserves a vanity mint before anything is deployed, so peard's own
 * contract address is public and shareable while the account behind it does
 * not exist. pump.fun answers 404 for it and Jupiter answers with no pools,
 * which is exactly how this is detected.
 */
export type Phase = "awaiting" | "curve" | "live";

export interface TokenSnapshot {
  mint: string;
  phase: Phase;
  venue: Venue;
  name: string | null;
  symbol: string | null;
  image: string | null;
  priceUsd: number | null;
  marketCapUsd: number | null;
  liquidityUsd: number | null;
  volume24hUsd: number | null;
  change24hPct: number | null;
  txns24h: { buys: number; sells: number } | null;
  holders: number | null;
  /** Unix seconds. */
  createdAt: number | null;
  /** The AMM pool once it exists, or the bonding curve before that. */
  poolAddress: string | null;
  /**
   * How full the bonding curve is, 0 to 1. Null anywhere it is not a
   * meaningful question, which is every venue except a pre-graduation
   * pump.fun coin.
   */
  curveProgress: number | null;
  /** Which upstream actually answered, so the UI can say so. */
  source: "pump.fun" | "jupiter" | null;
}

export interface Candle {
  /** Unix seconds, the open of the bucket. */
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  /** Quote volume in USD. */
  v: number;
}

/**
 * The four ranges the chart offers, and what each upstream calls them.
 *
 * pump.fun has no daily bucket: `interval=1d` is a 400, and `4h` is the
 * coarsest it will serve. That is not a problem worth solving, because a
 * token whose history needs daily candles has been trading for months and
 * has long since graduated onto a pool Jupiter indexes.
 */
export const RANGES = {
  "1H": { label: "1H", pump: "1m", jup: "1_MINUTE", candles: 60 },
  "1D": { label: "1D", pump: "15m", jup: "15_MINUTE", candles: 96 },
  "1W": { label: "1W", pump: "1h", jup: "1_HOUR", candles: 168 },
  ALL: { label: "ALL", pump: "4h", jup: "1_DAY", candles: 180 },
} as const;

export type RangeKey = keyof typeof RANGES;

export function isRangeKey(v: string): v is RangeKey {
  return Object.prototype.hasOwnProperty.call(RANGES, v);
}

/**
 * pump.fun mints are vanity addresses ending in `pump`, which is what makes
 * a cheap venue guess possible before anything is known about the token.
 *
 * It is only ever a guess about WHICH UPSTREAM TO ASK FIRST. A miss costs one
 * extra request and nothing else, so nothing downstream depends on it being
 * right, and a token that ends in `pump` without being a pump.fun coin simply
 * falls through to Jupiter.
 */
export function looksLikePumpMint(mint: string): boolean {
  return mint.toLowerCase().endsWith("pump");
}

export const EMPTY_SNAPSHOT = (mint: string): TokenSnapshot => ({
  mint,
  phase: "awaiting",
  venue: looksLikePumpMint(mint) ? "pump.fun" : "other",
  name: null,
  symbol: null,
  image: null,
  priceUsd: null,
  marketCapUsd: null,
  liquidityUsd: null,
  volume24hUsd: null,
  change24hPct: null,
  txns24h: null,
  holders: null,
  createdAt: null,
  poolAddress: null,
  curveProgress: null,
  source: null,
});
