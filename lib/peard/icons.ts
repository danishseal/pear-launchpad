"use client";

import { useEffect, useState } from "react";
import LOCAL from "./local-icons.json";

/**
 * Logos for the assets an underlying is backed by, from Jupiter.
 *
 * The registry stores no imagery: a pairable is a price and a unit, and the
 * thing that HAS a logo is the tokenised asset behind a hard-grade entry.
 * Jupiter's token search carries it, so `MSFT` shows Microsoft's mark because
 * `MSFTx` does, and an index-grade entry with nothing behind it shows none.
 *
 * By MINT ADDRESS, never by symbol. Searching "SPYx" returns eleven pump
 * launches with the same ticker and one real one, and picking the wrong logo
 * is the visual version of picking the wrong mint.
 *
 * One request per mint, but the results are cached for the life of the page
 * and the queue keeps a floor between calls: the lite API rate-limits by IP,
 * and this fires across a grid of sixty at once. Losing a logo to a 429 is
 * cheap; losing the price reads that share the limit is not.
 */

/**
 * Icons we ship, keyed by REGISTRY ID rather than by mint.
 *
 * These win over anything Jupiter returns. Jupiter carries the logo the
 * TOKENISED asset's issuer chose, which for the xStocks is a Backed-branded
 * variant; these are the real marks. Twenty of the 121 have one, and an id
 * without an entry falls through to Jupiter and then to its initials, which
 * is why the fallback chain stays.
 *
 * By id, not by mint, on purpose: the mint can be repointed by a regrade and
 * the id cannot, and an index-grade entry has no mint to key on at all.
 */
const LOCAL_ICONS = LOCAL as Record<string, string>;

/** The shipped icon for a registry id, if there is one. */
export function localIcon(id: string): string | null {
  return LOCAL_ICONS[id] ?? null;
}

const LITE = "https://lite-api.jup.ag";
const cache = new Map<string, string | null>();

let chain: Promise<unknown> = Promise.resolve();
let lastAt = 0;
const GAP_MS = 260;

function queued<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(async () => {
    const wait = Math.max(0, lastAt + GAP_MS - Date.now());
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastAt = Date.now();
    return fn();
  });
  // The queue has to survive a rejection or one failure stalls every call
  // behind it for the life of the page.
  chain = run.catch(() => undefined);
  return run;
}

export interface AssetInfo {
  icon: string | null;
  symbol: string | null;
  /** Pool liquidity Jupiter reports, in dollars. */
  liquidityUsd: number | null;
}

const infoCache = new Map<string, AssetInfo>();

async function fetchIcon(mint: string): Promise<string | null> {
  if (cache.has(mint)) return cache.get(mint) ?? null;
  try {
    const icon = await queued(async () => {
      const res = await fetch(`${LITE}/tokens/v2/search?query=${encodeURIComponent(mint)}`);
      if (!res.ok) throw new Error(String(res.status));
      const body = await res.json();
      const list: Array<Record<string, unknown>> = Array.isArray(body) ? body : (body?.tokens ?? []);
      const t = list.find((x) => (x.id ?? x.address) === mint);
      // One request answers both questions, so the depth is free: the card
      // needs to say how thin the thing behind it is, and a separate call
      // for that would double the pressure on a rate limit this already
      // shares with the price reads.
      infoCache.set(mint, {
        icon: ((t?.icon ?? t?.logoURI) as string | undefined) ?? null,
        symbol: (t?.symbol as string | undefined) ?? null,
        liquidityUsd: Number.isFinite(Number(t?.liquidity)) ? Number(t?.liquidity) : null,
      });
      const url = (t?.icon ?? t?.logoURI) as string | undefined;
      return url ?? null;
    });
    cache.set(mint, icon);
    return icon;
  } catch {
    // Cached as a miss so a rate-limited grid does not retry sixty times on
    // every re-render. A logo is not worth a retry storm.
    cache.set(mint, null);
    return null;
  }
}

/**
 * Icons for a set of mints, filling in as they arrive.
 *
 * Returns a map rather than an array so a card can look itself up without
 * knowing its index, and re-renders per batch rather than per icon.
 */
export function useIcons(mints: Array<string | null | undefined>): Record<string, string> {
  const [icons, setIcons] = useState<Record<string, string>>({});
  const key = mints.filter(Boolean).join(",");

  useEffect(() => {
    const list = key ? key.split(",") : [];
    if (list.length === 0) return;
    let live = true;
    let pending: Record<string, string> = {};
    let timer: ReturnType<typeof setTimeout> | null = null;

    const flush = () => {
      if (!live || Object.keys(pending).length === 0) return;
      const batch = pending;
      pending = {};
      setIcons((prev) => ({ ...prev, ...batch }));
    };

    (async () => {
      for (const mint of list) {
        const url = await fetchIcon(mint);
        if (!live) return;
        if (url) {
          pending[mint] = url;
          // Coalesce: a grid of sixty resolving one at a time would be sixty
          // renders. This is at most one every 200ms.
          if (!timer) timer = setTimeout(() => { timer = null; flush(); }, 200);
        }
      }
      flush();
    })();

    return () => { live = false; if (timer) clearTimeout(timer); };
  }, [key]);

  return icons;
}

/** What was learned about a mint while fetching its logo. Null until then. */
export function assetInfo(mint: string | null | undefined): AssetInfo | null {
  return mint ? infoCache.get(mint) ?? null : null;
}

/** A stable colour for an underlying with no logo, derived from its id. */
export function tint(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return `hsl(${h} 28% 32%)`;
}
