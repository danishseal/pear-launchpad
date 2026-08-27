"use client";

import { useEffect, useState } from "react";
import { loadAll, type Market, type Pairable } from "./chain";
import { loadVenues, type Pool } from "./venues";
import { loadMeta, type Meta } from "./meta";
import { allAttachments, type Attachment } from "./attachments";

/**
 * Tokens that have actually been launched here.
 *
 * NOT the registry. The home grid used to render all 121 pairables, which
 * are the things you launch AGAINST rather than things anybody launched, so
 * it read as a list of products when it was a list of raw materials. The
 * registry belongs on the launch page, where picking one is the point.
 *
 * A launch is a `peard` Market joined to a `peard_amm` Pool by the pool's
 * `fee_claimer`, which is the market PDA. That address is the whole
 * integration between the two programs, so it is also the only honest way to
 * tell whether a pool belongs to a peard launch or is some unrelated pool
 * that happens to exist under the same program.
 */

export interface Launch {
  /** The launched token's mint. Also the route segment. */
  mint: string;
  name: string;
  symbol: string;
  /** Unix seconds. */
  at: number;
  creator: string;
  /** The underlying it was launched on. */
  on: Pairable | null;
  onMeta: Meta | null;
  /** Only set for launches made before the move to Meteora. */
  legacy: { market: Market; pool: Pool | null } | null;
}

export interface LaunchesState {
  launches: Launch[] | null;
  error: string | null;
}

export function useLaunches(): LaunchesState {
  const [launches, setLaunches] = useState<Launch[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const [snap, venues, meta] = await Promise.all([
          loadAll(),
          loadVenues().catch(() => null),
          loadMeta().catch(() => null),
        ]);
        if (!live) return;

        const byId = new Map(snap.pairables.map((p) => [p.id, p]));
        const byClaimer = new Map<string, Pool>();
        for (const p of venues?.pools ?? []) byClaimer.set(p.feeClaimer, p);

        const out: Launch[] = [];

        // Meteora launches, from what this browser recorded.
        for (const a of allAttachments() as Attachment[]) {
          const on = byId.get(a.underlying) ?? null;
          out.push({
            mint: a.mint,
            name: a.name,
            symbol: a.symbol,
            at: a.at,
            creator: a.creator,
            on,
            onMeta: on ? meta?.[on.id] ?? null : null,
            legacy: null,
          });
        }

        // Launches made against peard's own programs, before the move to
        // Meteora. Kept because they exist on chain and their holders do
        // not care which venue they were made on.
        for (const m of snap.markets) {
          if (out.some((l) => l.mint === m.tokenMint)) continue;
          const on = snap.pairables.find((x) => x.pda === m.pairable) ?? null;
          out.push({
            mint: m.tokenMint,
            name: on ? `Launched on ${on.id}` : "Launch",
            symbol: m.tokenMint.slice(0, 4),
            at: 0,
            creator: m.creator,
            on,
            onMeta: on ? meta?.[on.id] ?? null : null,
            legacy: { market: m, pool: byClaimer.get(m.pda) ?? null },
          });
        }

        setLaunches(out.sort((a, b) => b.at - a.at));
      } catch (e) {
        if (!live) return;
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { live = false; };
  }, []);

  return { launches, error };
}
