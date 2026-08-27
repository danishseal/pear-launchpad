"use client";

import { useMemo } from "react";
import { useUnifiedWallet } from "@jup-ag/wallet-adapter";
import type { PeardSigner } from "./tx";

/**
 * A signer for the launch code, from whatever wallet is connected.
 *
 * The kit exposes the wallet adapter's own context, so this is a narrowing
 * rather than a translation: the adapter already speaks web3.js
 * `Transaction`, unlike Privy which signed bytes and needed the whole
 * serialise-sign-deserialise round trip.
 *
 * Returns null until a wallet can actually sign, which is the "can you
 * launch" test. `connected` alone is not enough: an adapter can be connected
 * and still expose no `signTransaction`, and the launch needs both that and
 * `signAllTransactions`.
 */
export function usePeardSigner(): PeardSigner | null {
  const { publicKey, connected, signTransaction, signAllTransactions } = useUnifiedWallet();

  return useMemo(() => {
    if (!connected || !publicKey || !signTransaction || !signAllTransactions) return null;
    return { publicKey, signTransaction, signAllTransactions };
  }, [connected, publicKey, signTransaction, signAllTransactions]);
}

/** The connected address, or null. */
export function usePeardAddress(): string | null {
  const { publicKey, connected } = useUnifiedWallet();
  return connected && publicKey ? publicKey.toBase58() : null;
}
