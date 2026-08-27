"use client";

import { useEffect, useState } from "react";
import type { Market, Pairable } from "@/lib/peard/chain";
import type { Pool } from "@/lib/peard/venues";
import { loadMeta, type Meta } from "@/lib/peard/meta";
import { allAttachments, type Attachment } from "@/lib/peard/attachments";

export interface Launch {
  mint: string;
  name: string;
  symbol: string;
  at: number;
  creator: string;
  on: Pairable | null;
  onMeta: Meta | null;
  legacy: { market: Market; pool: Pool | null } | null;
}

interface LaunchSnapshot {
  snap: { pairables: Pairable[]; markets: Market[] };
}

const SNAPSHOT_KEY = "peard.launches.snapshot.v1";

/**
 * Whether to list the pre-Meteora test launches.
 *
 * Off. Two markets exist on chain from before the move to Meteora, named
 * "Launched on AMZN" and "Launched on AAPL", with no name, no symbol, no
 * price and no pool. They were tests, and a visitor cannot tell that from a
 * grid: they read as the two products this app has.
 *
 * A FLAG RATHER THAN A DELETION. The accounts are still on chain and
 * `/account` still decodes them, so this hides them from the shop window
 * without pretending they are gone or rotting the code that reads them.
 *
 * Nothing here affects a NEW launch. Those come from `allAttachments()`
 * above, a separate branch, so a token launched through this app lists the
 * moment it is made.
 */
const SHOW_LEGACY = false;

function launchesFrom({ snap }: LaunchSnapshot, meta: Record<string, Meta> | null): Launch[] {
  const byId = new Map(snap.pairables.map((pairable) => [pairable.id, pairable]));
  const out: Launch[] = [];

  for (const attachment of allAttachments() as Attachment[]) {
    const on = byId.get(attachment.underlying) ?? null;
    out.push({
      mint: attachment.mint,
      name: attachment.name,
      symbol: attachment.symbol,
      at: attachment.at,
      creator: attachment.creator,
      on,
      onMeta: on ? meta?.[on.id] ?? null : null,
      legacy: null,
    });
  }

  for (const market of SHOW_LEGACY ? snap.markets : []) {
    if (out.some((launch) => launch.mint === market.tokenMint)) continue;
    const on = snap.pairables.find((pairable) => pairable.pda === market.pairable) ?? null;
    out.push({
      mint: market.tokenMint,
      name: on ? `Launched on ${on.id}` : "Launch",
      symbol: market.tokenMint.slice(0, 4),
      at: 0,
      creator: market.creator,
      on,
      onMeta: on ? meta?.[on.id] ?? null : null,
      legacy: { market, pool: null },
    });
  }

  return out.sort((a, b) => b.at - a.at);
}

export function useLaunches(): { launches: Launch[] | null; error: string | null } {
  const [launches, setLaunches] = useState<Launch[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;

    const apply = (snapshot: LaunchSnapshot, meta: Record<string, Meta> | null) => {
      if (!live) return;
      setError(null);
      setLaunches(launchesFrom(snapshot, meta));
    };

    const metaPromise = loadMeta().catch(() => null);
    try {
      const stored = localStorage.getItem(SNAPSHOT_KEY);
      if (stored) {
        const snapshot = JSON.parse(stored) as LaunchSnapshot;
        void metaPromise.then((meta) => apply(snapshot, meta));
      }
    } catch { /* cached snapshots are only an optimization */ }

    Promise.all([
      fetch("/api/launches?transport=2").then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? `Launch read failed (${response.status})`);
        return body as LaunchSnapshot;
      }),
      metaPromise,
    ])
      .then(([snapshot, meta]) => {
        try { localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot)); } catch { /* cache is optional */ }
        apply(snapshot, meta);
      })
      .catch((reason) => {
        if (!live) return;
        setError(reason instanceof Error ? reason.message : String(reason));
      });

    return () => { live = false; };
  }, []);

  return { launches, error };
}
