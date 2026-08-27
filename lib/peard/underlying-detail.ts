"use client";

import { useEffect, useState } from "react";
import { loadAll, health, type Pairable, type Market } from "./chain";
import { loadVenues, type Perp } from "./venues";
import { loadMeta, type Meta } from "./meta";

/**
 * One underlying, everything the token page shows about it.
 *
 * The route is `/token/[symbol]` and the cards link to a registry id, so what
 * this resolves is a PAIRABLE, not a launched token. That is not a stand-in:
 * there are no pools on mainnet yet, and an underlying is a real thing with a
 * real price, a real provenance and a real answer to "what would a launch on
 * this be". When pools exist the same page gains a second half.
 */

export interface Detail {
  p: Pairable;
  meta: Meta | null;
  /** Registry markets against this pairable (Path B), if any. */
  markets: Market[];
  /** The peard_perps market on this pairable, if one has been opened. */
  perp: Perp | null;
  health: ReturnType<typeof health>;
  /** Null when a launch is possible, a sentence when it is not. */
  refusal: string | null;
  /** True when the price is one operator's typed figure rather than a market. */
  attested: boolean;
}

export interface DetailState {
  detail: Detail | null;
  loading: boolean;
  error: string | null;
}

/**
 * Why a launch on this underlying would be refused, in the program's terms.
 *
 * Checked here so the page can say it before anybody signs. Each of these is
 * a real on-chain constraint rather than a policy of the UI:
 */
function refusalFor(p: Pairable, h: ReturnType<typeof health>): string | null {
  // `base_reserve = depth * 1e9 / price_twap` divides by the price. Zero is
  // not a small number here, it is a division by zero.
  if (p.price <= 0) return "No price has ever been pushed, so a curve cannot be sized against it.";
  if (p.frozen) return "The breaker tripped and the registry froze this. Pushes are refused until governance unfreezes it.";
  if (h === "expired") return "This contract is past its last trading day.";
  if (h === "stale") return "The last print is older than this pairable's own staleness gate.";
  // Hard grade and an asset mint are a biconditional the program enforces.
  // Index grade is NOT a refusal any more. peard_perps went to mainnet on
  // 2026-08-26 and 37 markets were opened on it, so these are tradeable;
  // they are just a different instrument. The caller decides which surface
  // to show from `grade`, not from this.
  if (p.grade !== "hard") return null;
  if (!p.assetMint) return "Hard grade with no asset mint, which the program refuses.";
  return null;
}

export function useUnderlying(id: string): DetailState {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setLoading(true);
    (async () => {
      try {
        const [snap, meta, venues] = await Promise.all([
          loadAll(),
          loadMeta().catch(() => null),
          loadVenues().catch(() => null),
        ]);
        if (!live) return;
        const want = id.toUpperCase();
        const p = snap.pairables.find((x) => x.id.toUpperCase() === want) ?? null;
        if (!p) {
          setError(`No underlying called ${want} is registered on this cluster.`);
          setDetail(null);
          return;
        }
        const h = health(p);
        setDetail({
          p,
          meta: meta?.[p.id] ?? null,
          markets: snap.markets.filter((m) => m.pairable === p.pda),
          // Matched on the pairable PDA, not the cached id: the id is a
          // convenience copy and the address is the identity.
          perp: venues?.perps.find((x) => x.pairable === p.pda) ?? null,
          health: h,
          refusal: refusalFor(p, h),
          attested: p.pushCount <= 2 && p.lastSourceCount <= 1,
        });
        setError(null);
      } catch (e) {
        if (!live) return;
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [id]);

  return { detail, loading, error };
}

/** Seconds, as something a person reads. */
export function ago(ts: number): string {
  if (!ts) return "never";
  const s = Math.max(0, Math.floor(Date.now() / 1000 - ts));
  if (s < 90) return `${s}s ago`;
  if (s < 5400) return `${Math.round(s / 60)}m ago`;
  if (s < 172800) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}
