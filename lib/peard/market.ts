"use client";

import { useEffect, useState } from "react";

/**
 * Live market data for a launched token, from DexScreener.
 *
 * Chosen because it is keyless and because it already indexes Meteora pools,
 * which matters: a token launched here is a DBC pool, and most price APIs
 * only see a token once it has graduated to a mainstream AMM. Birdeye wants
 * an API key and Jupiter's price route answers with a mid rather than a pair.
 *
 * WHAT THIS CANNOT DO, and the chart is built around the limit rather than
 * around it: the free endpoint returns a SNAPSHOT, not a series. Price now,
 * change over four windows, volume over four windows, and the trade counts.
 * There is no OHLC, so anything drawn as a continuous line here would be
 * drawn from numbers nobody published.
 */

const API = "https://api.dexscreener.com/latest/dex/tokens";

export interface MarketSnapshot {
  /** The pair the numbers came from. Also what the chart embed keys on. */
  pairAddress: string;
  dexId: string;
  priceUsd: number | null;
  marketCapUsd: number | null;
  fdvUsd: number | null;
  liquidityUsd: number | null;
  /** Percent, signed. Null where the pair is too young to have the window. */
  change: { m5: number | null; h1: number | null; h6: number | null; h24: number | null };
  volume: { m5: number | null; h1: number | null; h6: number | null; h24: number | null };
  txns24h: { buys: number; sells: number } | null;
  /** Unix ms. */
  pairCreatedAt: number | null;
  url: string;
}

const num = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export async function fetchMarket(mint: string): Promise<MarketSnapshot | null> {
  const res = await fetch(`${API}/${mint}`);
  if (!res.ok) throw new Error(`dexscreener ${res.status}`);
  const body = await res.json();
  const pairs: Array<Record<string, unknown>> = body?.pairs ?? [];
  if (pairs.length === 0) return null;

  // Deepest pair wins. A token can appear in several, and the shallow ones
  // quote prices nobody could actually trade at.
  const p = pairs
    .slice()
    .sort((a, b) => {
      const la = num((a.liquidity as Record<string, unknown>)?.usd) ?? 0;
      const lb = num((b.liquidity as Record<string, unknown>)?.usd) ?? 0;
      return lb - la;
    })[0];

  const change = (p.priceChange ?? {}) as Record<string, unknown>;
  const volume = (p.volume ?? {}) as Record<string, unknown>;
  const txns = (p.txns ?? {}) as Record<string, { buys?: number; sells?: number }>;

  return {
    pairAddress: String(p.pairAddress ?? ""),
    dexId: String(p.dexId ?? ""),
    priceUsd: num(p.priceUsd),
    marketCapUsd: num(p.marketCap),
    fdvUsd: num(p.fdv),
    liquidityUsd: num((p.liquidity as Record<string, unknown>)?.usd),
    change: { m5: num(change.m5), h1: num(change.h1), h6: num(change.h6), h24: num(change.h24) },
    volume: { m5: num(volume.m5), h1: num(volume.h1), h6: num(volume.h6), h24: num(volume.h24) },
    txns24h: txns.h24 ? { buys: txns.h24.buys ?? 0, sells: txns.h24.sells ?? 0 } : null,
    pairCreatedAt: num(p.pairCreatedAt),
    url: String(p.url ?? ""),
  };
}

export interface MarketState {
  market: MarketSnapshot | null;
  loading: boolean;
  /** True when the token exists but no pair is indexed yet. */
  unlisted: boolean;
}

/**
 * One token's market, refreshed while the page is open.
 *
 * A newly launched pool takes minutes to appear, so `unlisted` is its own
 * state rather than an error: "not indexed yet" and "this token does not
 * exist" look identical from one request and are not the same thing.
 */
export function useMarket(mint: string | null, refreshMs = 30_000): MarketState {
  const [market, setMarket] = useState<MarketSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlisted, setUnlisted] = useState(false);

  useEffect(() => {
    if (!mint) { setLoading(false); return; }
    let live = true;
    const load = async () => {
      try {
        const m = await fetchMarket(mint);
        if (!live) return;
        setMarket(m);
        setUnlisted(m === null);
      } catch {
        // A failed refresh should not blank a price that is already on
        // screen; the previous snapshot stays until a better one arrives.
      } finally {
        if (live) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, refreshMs);
    return () => { live = false; clearInterval(id); };
  }, [mint, refreshMs]);

  return { market, loading, unlisted };
}

/** DexScreener's own chart for a pair, themed to match. */
export function chartUrl(pairAddress: string): string {
  return `https://dexscreener.com/solana/${pairAddress}?embed=1&theme=dark&trades=0&info=0`;
}

export function usd(v: number | null, dp = 2): string {
  if (v === null) return "—";
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  if (v >= 1) return `$${v.toFixed(dp)}`;
  if (v === 0) return "$0";
  // A launch opens near $0.000005 a token, and rounding that to $0.00 loses
  // every digit that moves.
  return `$${v.toPrecision(3)}`;
}
