"use client";

import { useEffect, useState } from "react";
import { PublicKey, VersionedTransaction } from "@solana/web3.js";
import { conn } from "./chain";
import type { PeardSigner } from "./tx";

/**
 * Buying and selling a launched token, through Jupiter.
 *
 * Routed rather than called directly, and that is the point: a pump.fun token
 * lives on its bonding curve until it graduates and on an AMM pool after,
 * and the switch happens without warning at whatever minute the curve fills.
 * Anything that talked to one venue by hand would be correct for part of a
 * token's life and silently broken for the rest. Jupiter's route plan already
 * says `Pump.fun Amm` for one and `Pump.fun` for the other, and the caller
 * here does not have to know which.
 *
 * Keyless: `lite-api.jup.ag` needs no key and answers with
 * `access-control-allow-origin: *`, so quotes come straight from the browser.
 */

const API = "https://lite-api.jup.ag/swap/v1";

export const SOL_MINT = "So11111111111111111111111111111111111111112";
export const LAMPORTS_PER_SOL = 1_000_000_000;

export interface Quote {
  /** Base units in, base units out. */
  inAmount: bigint;
  outAmount: bigint;
  /** Base units, after slippage. What the transaction actually guarantees. */
  minOutAmount: bigint;
  /** Fraction, not percent: 0.0118 is 1.18%. */
  priceImpact: number;
  /** The venues the route crosses, in order. */
  route: string[];
  /** Handed back to the swap endpoint verbatim. Do not reshape it. */
  raw: unknown;
}

export async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: bigint,
  slippageBps: number
): Promise<Quote | null> {
  if (amount <= 0n) return null;
  const url =
    `${API}/quote?inputMint=${inputMint}&outputMint=${outputMint}` +
    `&amount=${amount}&slippageBps=${slippageBps}`;
  const res = await fetch(url);
  if (!res.ok) {
    // 400 here is the normal answer for "no route", which happens for every
    // token in the minutes between its mint and its first pool. It is not an
    // error worth throwing at the user.
    if (res.status === 400 || res.status === 404) return null;
    throw new Error(`jupiter ${res.status}`);
  }
  const q = await res.json();
  if (!q?.outAmount) return null;
  return {
    inAmount: BigInt(q.inAmount),
    outAmount: BigInt(q.outAmount),
    minOutAmount: BigInt(q.otherAmountThreshold ?? q.outAmount),
    priceImpact: Number(q.priceImpactPct ?? 0) || 0,
    route: (q.routePlan ?? []).map(
      (r: { swapInfo?: { label?: string } }) => r.swapInfo?.label ?? "?"
    ),
    raw: q,
  };
}

/**
 * Sign and send a swap.
 *
 * `wrapAndUnwrapSol` is on because the panel is denominated in SOL and the
 * pools are not: without it, selling leaves the proceeds stranded in a wSOL
 * account the user has to find and close by hand.
 *
 * Confirmation is `confirmed`, not `processed`. The panel refreshes balances
 * as soon as this resolves, and a read at `processed` can still come back
 * with the pre-swap balance, which looks exactly like a failed trade.
 */
export async function executeSwap(quote: Quote, signer: PeardSigner): Promise<string> {
  const res = await fetch(`${API}/swap`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote.raw,
      userPublicKey: signer.publicKey.toBase58(),
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
    }),
  });
  if (!res.ok) throw new Error(`jupiter swap ${res.status}`);
  const { swapTransaction } = await res.json();
  if (!swapTransaction) throw new Error("jupiter returned no transaction");

  const tx = VersionedTransaction.deserialize(
    Uint8Array.from(atob(swapTransaction), (c) => c.charCodeAt(0))
  );
  const signed = await signer.signTransaction(tx);

  const sig = await conn.sendRawTransaction(signed.serialize(), { maxRetries: 3 });
  const bh = await conn.getLatestBlockhash("confirmed");
  const done = await conn.confirmTransaction(
    { signature: sig, blockhash: bh.blockhash, lastValidBlockHeight: bh.lastValidBlockHeight },
    "confirmed"
  );
  if (done.value.err) throw new Error(`the swap failed on chain: ${JSON.stringify(done.value.err)}`);
  return sig;
}

/* ------------------------------------------------------------- balances */

export interface Balances {
  /** Whole SOL. */
  sol: number;
  /** Whole tokens, already scaled by the mint's decimals. */
  token: number;
  /** Base units, for the sell path, where scaling back down would lose dust. */
  tokenRaw: bigint;
  decimals: number;
}

/**
 * What the connected wallet actually holds.
 *
 * Read from the chain rather than from a balances API, because this is the
 * number a trade is sized against and a stale one produces a transaction
 * that cannot land. Decimals come off the mint for the same reason: pump.fun
 * uses 6, most things use 9, and assuming either turns a sell of everything
 * into a sell of a thousandth.
 */
export function useBalances(owner: string | null, mint: string | null, nonce = 0): Balances | null {
  // Stamped with the wallet and mint it describes, so switching either one
  // cannot briefly show the previous pair's balance. The alternative is a
  // second effect that blanks it, and a synchronous setState in an effect
  // body is a cascading render.
  const [st, setSt] = useState<{ key: string; bal: Balances } | null>(null);

  useEffect(() => {
    if (!owner || !mint) return;
    let live = true;
    (async () => {
      try {
        const ownerKey = new PublicKey(owner);
        const [lamports, accounts, mintInfo] = await Promise.all([
          conn.getBalance(ownerKey),
          conn.getParsedTokenAccountsByOwner(ownerKey, { mint: new PublicKey(mint) }),
          conn.getParsedAccountInfo(new PublicKey(mint)),
        ]);
        if (!live) return;

        const parsed = mintInfo.value?.data;
        const decimals =
          parsed && typeof parsed === "object" && "parsed" in parsed
            ? Number(parsed.parsed?.info?.decimals ?? 6)
            : 6;

        // A holder can have more than one account for a mint. All of them
        // spend, so all of them count.
        let raw = 0n;
        for (const { account } of accounts.value) {
          const info = account.data.parsed?.info?.tokenAmount;
          if (info?.amount) raw += BigInt(info.amount);
        }

        setSt({
          key: `${owner}:${mint}`,
          bal: {
            sol: lamports / LAMPORTS_PER_SOL,
            token: Number(raw) / 10 ** decimals,
            tokenRaw: raw,
            decimals,
          },
        });
      } catch {
        // Leave the last known balances up. Blanking them mid-trade reads as
        // "your tokens are gone".
      }
    })();
    return () => { live = false; };
  }, [owner, mint, nonce]);

  const key = owner && mint ? `${owner}:${mint}` : null;
  return st && key && st.key === key ? st.bal : null;
}
