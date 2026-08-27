"use client";

import { UnifiedWalletButton } from "@jup-ag/wallet-adapter";

/**
 * The wallet control.
 *
 * Jupiter's own button and modal, which is the point of using the kit: it
 * already handles detected wallets, not-installed wallets, mobile deep links
 * and the connected state, all of which had to be hand-written before.
 *
 * `className` still comes in so callers do not have to change, and is applied
 * through the kit's own override props rather than by wrapping, because
 * wrapping it in a styled span leaves two nested clickable boxes.
 *
 * `overrideContent` is the disconnected label only. The kit replaces it with
 * the truncated address once a wallet is connected, which is the behaviour
 * every previous version of this file had to write by hand.
 */
export function ConnectButton({
  className = "signup connect-wallet",
  connectLabel = "Connect",
}: {
  className?: string;
  connectLabel?: string;
}) {
  return (
    <UnifiedWalletButton
      buttonClassName={className}
      currentUserClassName={className}
      overrideContent={connectLabel}
    />
  );
}
