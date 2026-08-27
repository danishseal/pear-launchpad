"use client";

import { useToken } from "./feed";
import type { TokenSnapshot } from "./token-data";

/**
 * peard's own token, and the watch that puts it on the page.
 *
 * The mint below is a pump.fun vanity address. pump.fun reserves the keypair
 * up front, so the contract address is public and shareable before anything
 * is deployed, and nothing exists at it until the coin is actually created.
 * That is what makes a tracker possible at all: pump.fun answers
 *
 *     404 "Coin not found for mint"    nobody has launched it yet
 *     200 with the coin                it is live, from this moment on
 *
 * and the flip between those two is the launch. There is nothing to
 * subscribe to before the coin exists, so this polls; it is one cached call
 * every twenty seconds and it stops mattering once it flips.
 *
 * The card is on the home page either way. A launch nobody can find because
 * the page only lists what already exists is the failure this avoids: the
 * token is there beforehand, saying it has not launched, and fills itself in
 * without a reload.
 */
export const OFFICIAL_MINT = "57J3ueLSiXBaEiEUCoP7NdACw3HURuz81Xudu7c5pump";

export const OFFICIAL = {
  mint: OFFICIAL_MINT,
  name: "peard",
  symbol: "PEARD",
  /** Launched on pump.fun rather than through this app's own launch flow. */
  venue: "pump.fun",
  url: `https://pump.fun/coin/${OFFICIAL_MINT}`,
} as const;

export interface OfficialState {
  snap: TokenSnapshot;
  /** Nothing has been deployed at the mint yet. */
  awaiting: boolean;
  loading: boolean;
}

export function useOfficial(): OfficialState {
  // Faster than the rest of the app polls, because this is the one number on
  // the page whose CHANGE is the event.
  const { snap, loading } = useToken(OFFICIAL_MINT, 15_000);
  return {
    snap: snap!,
    awaiting: snap?.phase === "awaiting",
    loading,
  };
}

/** The official token as a card, whether or not it exists yet. */
export function officialDisplay(snap: TokenSnapshot) {
  return {
    mint: OFFICIAL_MINT,
    // pump.fun's own name and symbol once it has them, and peard's until
    // then. They should agree; if they do not, pump.fun is what holders see.
    name: snap.name ?? OFFICIAL.name,
    symbol: snap.symbol ?? OFFICIAL.symbol,
    image: snap.image,
  };
}
