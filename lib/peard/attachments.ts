"use client";

/**
 * Which underlying each launched token belongs to.
 *
 * The pool is token/USDC on Meteora, so this association lives here rather
 * than in the pool's own accounts. It is what every surface reads to say
 * what a token was launched on.
 *
 * STORED IN THE BROWSER TODAY, and that is a real limitation rather than a
 * design: `localStorage` is per-device, so a launch made on one machine is
 * invisible on another and a cleared browser loses the mapping entirely. The
 * shape below is deliberately the shape a server would return, so moving it
 * behind a route handler later is a change of transport and not of callers.
 *
 * The mint is the key because it is the one identifier that cannot change:
 * pool addresses, configs and metadata can all be replaced, and the mint
 * cannot.
 */

const KEY = "peard.attachments.v1";

export interface Attachment {
  /** The launched token's mint. */
  mint: string;
  /** The registry id it was launched on, e.g. `AMZN`. */
  underlying: string;
  /** The DBC pool config, for reading the curve back. */
  config: string;
  name: string;
  symbol: string;
  /** Unix seconds. */
  at: number;
  /** Who launched it. */
  creator: string;
}

function read(): Attachment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? (list as Attachment[]) : [];
  } catch {
    // A quota error, a private window, or somebody else's data under our
    // key. An empty list is the right answer to all three: this is a record
    // of launches, and failing to read it must never block making one.
    return [];
  }
}

function write(list: Attachment[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Same reasoning. A launch that succeeded on chain has succeeded whether
    // or not we managed to note it locally.
  }
}

export function allAttachments(): Attachment[] {
  return read().sort((a, b) => b.at - a.at);
}

export function attachmentFor(mint: string): Attachment | null {
  return read().find((a) => a.mint === mint) ?? null;
}

export function recordAttachment(a: Attachment): void {
  const list = read().filter((x) => x.mint !== a.mint);
  list.push(a);
  write(list);
}

/**
 * The underlying for a mint, from wherever it is actually recorded.
 *
 * Two sources, and the order matters:
 *
 *   1. the local record, written when a Meteora launch is made here
 *   2. the CHAIN, for launches made against peard's own programs, whose
 *      Market carries `pairable` and therefore knows its underlying without
 *      anybody's browser having to remember
 *
 * Written because the page said "not recorded on this device" for a token
 * whose underlying was sitting in a Market account the whole time. Local
 * storage was the first place to look and the only place being looked.
 */
import { loadAll } from "./chain";

export async function resolveUnderlying(mint: string): Promise<string | null> {
  const local = attachmentFor(mint);
  if (local) return local.underlying;
  try {
    const snap = await loadAll();
    const market = snap.markets.find((m) => m.tokenMint === mint);
    if (!market) return null;
    return snap.pairables.find((p) => p.pda === market.pairable)?.id ?? null;
  } catch {
    return null;
  }
}
