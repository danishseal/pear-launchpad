"use client";

import { useEffect, useState } from "react";
import { loadAll, health, type Pairable } from "./chain";
import { loadMeta, type Meta } from "./meta";
import ATTESTED from "./attested.json";

/**
 * The underlyings whose price is a number an operator typed.
 *
 * A LIST, not a heuristic, and the heuristic it replaces was wrong in a way
 * worth recording. It read `pushCount <= 2 && lastSourceCount <= 1`, which is
 * true of a hand-typed price and ALSO true of every entry on a cluster whose
 * relayer has run once. Mainnet was seeded and cranked the same afternoon, so
 * all 97 priced entries reported themselves as operator-attested, including
 * Microsoft priced off a live pool.
 *
 * These fourteen are the `manual:` block of relayer/config/mainnet.yaml,
 * which is the only place that fact actually lives. Re-derive it from there
 * whenever the relayer's config changes; nothing checks that automatically.
 */
const HAND_TYPED = new Set<string>(ATTESTED as string[]);

/**
 * The registry, in the shape the cards already expect.
 *
 * The mockup carried eight hand-written coins with their artwork cropped out
 * of `reference.png`. This replaces the array and nothing else: every class
 * name, every element and the whole stylesheet stay exactly as they are.
 *
 * WHAT THE GRID SHOWS IS UNDERLYINGS, NOT LAUNCHED TOKENS, and that is not a
 * placeholder. There are no pools on mainnet yet, so a grid of launches would
 * be empty; the 121 things you can launch AGAINST are the inventory that
 * makes this venue different from every other launchpad, and they are real,
 * on chain, and priced.
 */

export interface Row {
  /** The registry id, e.g. `AP-DEC26`. Used as the route segment. */
  id: string;
  /** The human name from the registry file, falling back to the unit. */
  name: string;
  unit: string;
  category: string;
  grade: Pairable["grade"];
  /** USD per unit. Zero means the relayer has never pushed one. */
  price: number;
  /** Last accepted deviation, in bps. Signed. */
  devBps: number;
  /** live, frozen, expired, stale, unpriced. */
  health: ReturnType<typeof health>;
  /** True when the launch would be a token on a curve rather than a perp. */
  hard: boolean;
  /**
   * True when the number on screen is an OPERATOR ATTESTATION rather than a
   * market price: one source, barely pushed. The registry has 15 of these
   * and every surface showing one is required to say so.
   */
  attested: boolean;
  /** How many sources agreed on the last accepted push. */
  sources: number;
  /** Unix seconds of that push. Zero if there has never been one. */
  lastPushTs: number;
  pda: string;
  assetMint: string | null;
}

function money(v: number): string {
  if (v === 0) return "no price";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  if (v >= 1) return `$${v.toFixed(2)}`;
  // Sub-dollar underlyings are real (CETES at $0.069, a Mexican bill), and
  // rounding them to $0.07 loses the only digits that move.
  return `$${v.toPrecision(3)}`;
}

export const formatPrice = money;

export function rowsFrom(pairables: Pairable[], meta: Record<string, Meta> | null): Row[] {
  const now = Date.now() / 1000;
  return pairables.map((p) => {
    const m = meta?.[p.id] ?? null;
    return {
      id: p.id,
      name: m?.name ?? p.unit,
      unit: p.unit,
      category: m?.category ?? "other",
      grade: p.grade,
      price: p.price,
      devBps: p.lastDevBps,
      health: health(p, now),
      hard: p.grade === "hard",
      attested: HAND_TYPED.has(p.id),
      /** Sources that agreed on the last accepted push. A receipt. */
      sources: p.lastSourceCount,
      lastPushTs: p.priceLastTs,
      pda: p.pda,
      assetMint: p.assetMint,
    };
  });
}

export interface RegistryState {
  rows: Row[] | null;
  error: string | null;
}

export function useRegistry(): RegistryState {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        // Meta is a static file and the chain read is the slow half, so they
        // go together rather than one after the other.
        const [snap, meta] = await Promise.all([loadAll(), loadMeta().catch(() => null)]);
        if (!live) return;
        setRows(rowsFrom(snap.pairables, meta));
      } catch (e) {
        if (!live) return;
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  return { rows, error };
}

/**
 * Most recently moved, by the size of the last accepted deviation.
 *
 * Ranks the UNDERLYING's own print, never a token's price, because no token
 * exists yet. An entry that has only ever been pushed once has no movement to
 * report and is excluded rather than shown at 0.00%.
 */
export function movers(rows: Row[], n: number): Row[] {
  return [...rows]
    .filter((r) => r.devBps !== 0 && r.price > 0)
    .sort((a, b) => Math.abs(b.devBps) - Math.abs(a.devBps))
    .slice(0, n);
}

/** Launchable today: hard grade, a real price, and an asset that exists. */
export function launchable(rows: Row[]): Row[] {
  return rows.filter((r) => r.hard && r.price > 0 && r.assetMint && r.health === "live");
}

/**
 * Why a token cannot be launched on this underlying, in one sentence.
 *
 * Null when it can. Returned rather than filtered on, because hiding two
 * thirds of the registry from the launch page reads as "we do not have
 * those" when the truth is "those trade a different way, and there are
 * already 47 markets on them".
 */
export function whyNotLaunchable(r: Row): string | null {
  if (!r.hard) {
    return "Index grade: there is no asset to hold, so this trades as a perp rather than carrying a token launch.";
  }
  if (r.price <= 0) return "No price has ever been pushed, so a curve cannot be sized against it.";
  if (!r.assetMint) return "Hard grade with no asset mint, which the program refuses.";
  if (r.health === "stale") return "Its last print is older than its own staleness gate.";
  if (r.health === "frozen") return "The breaker tripped and the registry froze it.";
  if (r.health === "expired") return "Past its last trading day.";
  return null;
}
