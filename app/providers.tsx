"use client";

import { useMemo } from "react";
import { UnifiedWalletProvider } from "@jup-ag/wallet-adapter";
import { CLUSTER } from "@/lib/peard/config";

/**
 * Wallets, for the whole app.
 *
 * Jupiter's Unified Wallet Kit. It is the wallet adapter underneath, with a
 * modal already built, which is the part every previous attempt here got
 * wrong in a different way:
 *
 *   @solana/wallet-adapter-react   no UI, and I registered each wallet twice
 *                                  by passing adapters alongside the Wallet
 *                                  Standard's own discovery
 *   Privy                          an account system, a dashboard and
 *                                  server-side verification between a click
 *                                  and a signature; failed on two app ids
 *   hand-rolled                    connected reliably, and the UI was thin
 *
 * This has no account, no dashboard and no API key, so there is nothing to
 * misconfigure, and it discovers wallets through the Wallet Standard.
 *
 * `wallets` is EMPTY on purpose, the same lesson as before: discovery finds
 * Phantom and Solflare on its own, and naming them here registers each one
 * twice.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const config = useMemo(
    () => ({
      autoConnect: true,
      env: (CLUSTER === "mainnet-beta" ? "mainnet-beta" : "devnet") as "mainnet-beta" | "devnet",
      metadata: {
        name: "Peard",
        description: "Launch a token priced in a real thing",
        url: "https://peard.fun",
        iconUrls: ["/peard.webp"],
      },
      theme: "dark" as const,
      lang: "en" as const,
    }),
    []
  );

  return (
    <UnifiedWalletProvider wallets={[]} config={config}>
      {children}
    </UnifiedWalletProvider>
  );
}
