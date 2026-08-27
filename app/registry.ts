"use client";

import { useEffect, useState } from "react";
import type { Pairable } from "@/lib/peard/chain";
import { loadMeta } from "@/lib/peard/meta";
import { rowsFrom, type RegistryState } from "@/lib/peard/underlyings";

export function useRegistry(): RegistryState {
  const [rows, setRows] = useState<RegistryState["rows"]>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;

    Promise.all([
      fetch("/api/launches?transport=2", { cache: "no-store" }).then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? `Registry read failed (${response.status})`);
        return body.snap.pairables as Pairable[];
      }),
      loadMeta().catch(() => null),
    ])
      .then(([pairables, meta]) => {
        if (!live) return;
        setRows(rowsFrom(pairables, meta));
        setError(null);
      })
      .catch((reason) => {
        if (!live) return;
        setError(reason instanceof Error ? reason.message : String(reason));
      });

    return () => { live = false; };
  }, []);

  return { rows, error };
}
