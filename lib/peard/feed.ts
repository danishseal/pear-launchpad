"use client";

import { useEffect, useRef, useState } from "react";
import { EMPTY_SNAPSHOT, type Candle, type RangeKey, type TokenSnapshot } from "./token-data";

/**
 * The client half. Reads this app's own routes and nothing else.
 *
 * Every upstream difference is settled server-side, so nothing here knows
 * that pump.fun and Meteora are different places, and adding a third venue
 * does not touch this file.
 */

/**
 * One token, refreshed while the page is open.
 *
 * State is held as a single object stamped with the mint it describes.
 * Written that way because the obvious version needs a second effect that
 * blanks everything when `mint` changes, and a synchronous setState in an
 * effect body paints the previous token's price under the new token's name
 * for one frame before the reset lands.
 */
export function useToken(mint: string | null, refreshMs = 20_000) {
  const [st, setSt] = useState<{ key: string; snap: TokenSnapshot } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mint) return;
    let live = true;

    const load = async () => {
      try {
        const res = await fetch(`/api/token/${mint}`);
        if (!res.ok) return;
        const snap: TokenSnapshot = await res.json();
        if (!live) return;
        setSt({ key: mint, snap });
      } catch {
        // Hold the last good answer. A dropped refresh is not a price of zero.
      } finally {
        if (live) setLoading(false);
      }
    };

    load();
    const id = setInterval(load, refreshMs);
    return () => { live = false; clearInterval(id); };
  }, [mint, refreshMs]);

  const fresh = st && mint && st.key === mint ? st.snap : null;
  return {
    snap: fresh ?? (mint ? EMPTY_SNAPSHOT(mint) : null),
    /** True until the first answer for THIS mint has landed. */
    loading: mint ? loading || fresh === null : false,
  };
}

/**
 * One token's candles.
 *
 * A token minutes old legitimately has one or two, so an empty series is a
 * normal state here rather than a failure, and the chart draws it as such.
 */
export function useCandles(mint: string | null, range: RangeKey, refreshMs = 20_000) {
  const [st, setSt] = useState<{ key: string; rows: Candle[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const drawn = useRef(false);

  useEffect(() => {
    if (!mint) return;
    let live = true;
    const key = `${mint}:${range}`;

    const load = async () => {
      try {
        const res = await fetch(`/api/candles/${mint}?range=${range}`);
        if (!res.ok) return;
        const body: { candles: Candle[] } = await res.json();
        if (!live) return;
        drawn.current = body.candles.length > 0;
        setSt({ key, rows: body.candles });
      } catch {
        // Same reasoning: never blank a chart that is already drawn.
      } finally {
        if (live) setLoading(false);
      }
    };

    load();
    const id = setInterval(load, refreshMs);
    return () => { live = false; clearInterval(id); };
  }, [mint, range, refreshMs]);

  const key = mint ? `${mint}:${range}` : null;
  const fresh = st && key && st.key === key ? st.rows : null;
  return {
    candles: fresh ?? [],
    loading: mint ? loading || fresh === null : false,
  };
}
