/**
 * The upstreams, and which one is asked about what. SERVER ONLY.
 *
 * Never import this from a client component: these calls carry no `Origin`
 * header, which is the entire reason they work.
 *
 *   pump.fun   frontend-api-v3 is the authority on a pump.fun coin. It knows
 *              a mint before any indexer does, it says plainly whether the
 *              bonding curve has completed, and it 404s a mint that has not
 *              launched, which is how the pre-launch state is detected rather
 *              than inferred.
 *
 *   Jupiter    datapi covers every venue it routes, and it tags a Meteora
 *              Dynamic Bonding Curve launch `met-dbc`. That is the source for
 *              tokens launched through this app, which pump.fun has never
 *              heard of and never will.
 */

import {
  EMPTY_SNAPSHOT, looksLikePumpMint, RANGES,
  type Candle, type RangeKey, type TokenSnapshot, type Venue,
} from "./token-data";

const PUMP_COIN = "https://frontend-api-v3.pump.fun/coins";
const PUMP_CANDLES = "https://swap-api.pump.fun/v1/coins";
const JUP_POOLS = "https://datapi.jup.ag/v1/pools";
const JUP_CHARTS = "https://datapi.jup.ag/v2/charts";

/** A slow upstream must not hold a request open forever. */
async function get(url: string, ms = 8000): Promise<Response | null> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    return await fetch(url, { signal: ctl.signal, cache: "no-store" });
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/* --------------------------------------------------------------- pump.fun */

/**
 * The bonding curve starts holding 793.1M of the billion supply, the rest
 * being the 279.9M virtual offset. Confirmed against a live curve rather
 * than taken on faith: `virtual_token_reserves - real_token_reserves` came
 * back as exactly 279,900,000,000,000, so the initial real reserve is the
 * 1,073,000,000,000,000 virtual total less that offset.
 */
const CURVE_INITIAL_REAL = 793_100_000_000_000;

interface PumpCoin {
  mint?: string;
  name?: string;
  symbol?: string;
  image_uri?: string;
  complete?: boolean;
  created_timestamp?: number;
  usd_market_cap?: number;
  market_cap?: number;
  real_token_reserves?: number;
  bonding_curve?: string;
  pump_swap_pool?: string | null;
  total_supply?: number;
  base_decimals?: number;
  num_participants?: number;
}

export async function pumpSnapshot(mint: string): Promise<TokenSnapshot | null> {
  const res = await get(`${PUMP_COIN}/${mint}`);
  // 404 is the answer for a reserved-but-unlaunched vanity mint, and it is
  // the signal this whole tracker turns on. Not an error.
  if (!res || !res.ok) return null;
  const c: PumpCoin = await res.json().catch(() => ({}));
  if (!c?.mint) return null;

  const complete = Boolean(c.complete);
  const realTokens = num(c.real_token_reserves);
  const progress = complete
    ? 1
    : realTokens === null
      ? null
      : Math.min(1, Math.max(0, 1 - realTokens / CURVE_INITIAL_REAL));

  const cap = num(c.usd_market_cap);
  const supply = num(c.total_supply);
  const decimals = num(c.base_decimals) ?? 6;
  // pump.fun publishes a market cap and no price. Dividing by the supply is
  // the same arithmetic it does to get the cap, run backwards.
  const price = cap !== null && supply ? cap / (supply / 10 ** decimals) : null;

  return {
    ...EMPTY_SNAPSHOT(mint),
    phase: complete ? "live" : "curve",
    venue: "pump.fun",
    name: c.name ?? null,
    symbol: c.symbol ?? null,
    image: c.image_uri ?? null,
    priceUsd: price,
    marketCapUsd: cap,
    liquidityUsd: null,
    holders: num(c.num_participants),
    createdAt: c.created_timestamp ? Math.floor(c.created_timestamp / 1000) : null,
    poolAddress: c.pump_swap_pool ?? c.bonding_curve ?? null,
    curveProgress: progress,
    source: "pump.fun",
  };
}

/* ---------------------------------------------------------------- Jupiter */

interface JupPool {
  id?: string;
  dex?: string;
  type?: string;
  liquidity?: number;
  volume24h?: number;
  createdAt?: string;
  baseAsset?: {
    id?: string;
    name?: string;
    symbol?: string;
    icon?: string;
    launchpad?: string;
    usdPrice?: number;
    mcap?: number;
    fdv?: number;
    liquidity?: number;
    holderCount?: number;
    graduatedPool?: string;
    stats24h?: { priceChange?: number; numBuys?: number; numSells?: number; buyVolume?: number; sellVolume?: number };
  };
}

function venueOf(p: JupPool): Venue {
  const lp = (p.baseAsset?.launchpad ?? "").toLowerCase();
  const type = (p.type ?? "").toLowerCase();
  if (lp.includes("pump")) return "pump.fun";
  // `met-dbc` is Jupiter's tag for a Meteora Dynamic Bonding Curve launch,
  // which is what this app's own launch flow creates.
  if (lp.includes("met-dbc") || lp.includes("meteora") || type.startsWith("meteora")) return "meteora";
  return "other";
}

export async function jupSnapshot(mint: string): Promise<TokenSnapshot | null> {
  const res = await get(`${JUP_POOLS}?assetIds=${mint}`);
  if (!res || !res.ok) return null;
  const body = await res.json().catch(() => null);
  const pools: JupPool[] = body?.pools ?? [];
  if (pools.length === 0) return null;

  // Deepest wins. A token trades in several pools at once and the shallow
  // ones quote prices nobody could fill.
  const p = pools.slice().sort((a, b) => (b.liquidity ?? 0) - (a.liquidity ?? 0))[0];
  const b = p.baseAsset ?? {};
  const s = b.stats24h ?? {};

  return {
    ...EMPTY_SNAPSHOT(mint),
    // Jupiter indexes a pool only once it exists, so anything it returns is
    // trading. `curve` versus `live` is a pump.fun distinction and it does
    // not carry the field, so a graduated pool is the only thing that can be
    // asserted here.
    phase: "live",
    venue: venueOf(p),
    name: b.name ?? null,
    symbol: b.symbol ?? null,
    image: b.icon ?? null,
    priceUsd: num(b.usdPrice),
    marketCapUsd: num(b.mcap) ?? num(b.fdv),
    liquidityUsd: num(b.liquidity) ?? num(p.liquidity),
    volume24hUsd: (num(s.buyVolume) ?? 0) + (num(s.sellVolume) ?? 0) || num(p.volume24h),
    change24hPct: num(s.priceChange),
    txns24h: s.numBuys !== undefined || s.numSells !== undefined
      ? { buys: s.numBuys ?? 0, sells: s.numSells ?? 0 }
      : null,
    holders: num(b.holderCount),
    createdAt: p.createdAt ? Math.floor(Date.parse(p.createdAt) / 1000) : null,
    poolAddress: p.id ?? b.graduatedPool ?? null,
    curveProgress: null,
    source: "jupiter",
  };
}

/* ------------------------------------------------------------- the merge */

/**
 * One token, from whichever upstream can actually answer.
 *
 * pump.fun is asked first for a pump mint because it is the authority on its
 * own coins and because it is the only source that exists in the first
 * seconds of a launch. It carries no liquidity or volume figures though, so
 * Jupiter is still consulted once the token is trading and the two are
 * merged rather than one replacing the other.
 */
export async function snapshot(mint: string): Promise<TokenSnapshot> {
  const [pump, jup] = await Promise.all([
    looksLikePumpMint(mint) ? pumpSnapshot(mint) : Promise.resolve(null),
    jupSnapshot(mint),
  ]);

  if (!pump) return jup ?? EMPTY_SNAPSHOT(mint);
  if (!jup) return pump;

  // Both answered. Each is authoritative for a different half, and the split
  // is not arbitrary:
  //
  //   pump.fun  identity, phase and the curve. It is the venue, so its name,
  //             symbol, image and creation time are the real ones, and only
  //             it can say whether the curve has completed.
  //
  //   Jupiter   liquidity, volume, holders and the 24h move. pump.fun's coin
  //             payload simply does not carry them, and a token on the curve
  //             still has a holder count worth showing.
  //
  // Price and cap come from pump.fun while the token is on its curve, where
  // it is the only source, and from Jupiter once there is a pool, where a
  // traded price beats one derived from reserves.
  const onCurve = pump.phase === "curve";
  return {
    ...jup,
    phase: pump.phase,
    venue: "pump.fun",
    name: pump.name ?? jup.name,
    symbol: pump.symbol ?? jup.symbol,
    image: pump.image ?? jup.image,
    createdAt: pump.createdAt ?? jup.createdAt,
    priceUsd: onCurve ? pump.priceUsd ?? jup.priceUsd : jup.priceUsd ?? pump.priceUsd,
    marketCapUsd: onCurve ? pump.marketCapUsd ?? jup.marketCapUsd : jup.marketCapUsd ?? pump.marketCapUsd,
    holders: jup.holders ?? pump.holders,
    curveProgress: pump.curveProgress,
    source: "pump.fun",
  };
}
/* -------------------------------------------------------------- candles */

export async function candles(mint: string, range: RangeKey): Promise<Candle[]> {
  const r = RANGES[range];

  if (looksLikePumpMint(mint)) {
    const res = await get(
      `${PUMP_CANDLES}/${mint}/candles?interval=${r.pump}&limit=${r.candles}&currency=USD`
    );
    if (res?.ok) {
      const rows = await res.json().catch(() => null);
      if (Array.isArray(rows) && rows.length > 0) {
        return rows
          .map((x) => ({
            // pump.fun stamps milliseconds and sends the prices as decimal
            // STRINGS, which is deliberate on their side: these numbers run
            // to 28 significant figures and a float would round them.
            t: Math.floor(Number(x.timestamp) / 1000),
            o: Number(x.open), h: Number(x.high), l: Number(x.low), c: Number(x.close),
            v: Number(x.volume),
          }))
          .filter((c) => Number.isFinite(c.c) && c.c > 0)
          .sort((a, b) => a.t - b.t);
      }
    }
    // Fall through to Jupiter rather than returning empty: a pump mint that
    // has graduated still charts, and pump.fun has no daily bucket at all.
  }

  const to = Date.now();
  const res = await get(`${JUP_CHARTS}/${mint}?interval=${r.jup}&to=${to}&candles=${r.candles}&quote=usd`);
  if (!res?.ok) return [];
  const body = await res.json().catch(() => null);
  const rows = body?.candles ?? [];
  if (!Array.isArray(rows)) return [];
  return rows
    .map((x: Record<string, unknown>) => ({
      t: Number(x.time), o: Number(x.open), h: Number(x.high),
      l: Number(x.low), c: Number(x.close), v: Number(x.volume),
    }))
    .filter((c: Candle) => Number.isFinite(c.c) && c.c > 0)
    .sort((a: Candle, b: Candle) => a.t - b.t);
}
