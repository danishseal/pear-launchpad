"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useUnifiedWalletContext } from "@jup-ag/wallet-adapter";
import { ArrowSquareOut, CaretDown, Wallet } from "@phosphor-icons/react";
import { usePeardSigner, usePeardAddress } from "@/lib/peard/signer";
import {
  executeSwap, getQuote, useBalances, SOL_MINT, type Quote,
} from "@/lib/peard/jupiter";
import { explorerUrl } from "@/lib/peard/config";

/**
 * Buy and sell, from inside the app.
 *
 * The panel that was here said "Buying and selling from inside peard is not
 * wired yet" and offered a link to DexScreener, which is a link to somewhere
 * that also cannot sell you the token. This one quotes and settles.
 *
 * Denominated in SOL rather than in USDC because that is what pump.fun pools
 * are quoted in, and because a SOL-denominated panel needs no stablecoin
 * balance to work: a wallet with SOL in it can trade immediately.
 */

const SLIPPAGES = [50, 100, 300, 500] as const;
const BUY_PRESETS = [0.1, 0.25, 0.5, 1] as const;
const SELL_PRESETS = [25, 50, 75, 100] as const;

type Mode = "buy" | "sell";

/** Human input to base units, without going through a float. */
function toBase(input: string, decimals: number): bigint {
  const [whole = "0", frac = ""] = input.replace(/,/g, "").split(".");
  const padded = (frac + "0".repeat(decimals)).slice(0, decimals);
  try {
    return BigInt(whole || "0") * BigInt(10) ** BigInt(decimals) + BigInt(padded || "0");
  } catch {
    return 0n;
  }
}

function fmtAmount(v: number, dp = 4): string {
  if (!Number.isFinite(v)) return "0";
  if (v === 0) return "0";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1000) return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (v >= 1) return v.toFixed(2);
  return v.toPrecision(dp);
}

export function TradePanel({
  mint,
  symbol,
  /** Null until a pool is indexed. Nothing can be quoted before that. */
  tradable,
}: {
  mint: string;
  symbol: string;
  tradable: boolean;
}) {
  const signer = usePeardSigner();
  const address = usePeardAddress();
  const { setShowModal } = useUnifiedWalletContext();

  const [mode, setMode] = useState<Mode>("buy");
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState<number>(300);
  const [slipOpen, setSlipOpen] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [noRoute, setNoRoute] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sig, setSig] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  // Bumped after a settled trade so the balance read reruns.
  const [nonce, setNonce] = useState(0);

  const bal = useBalances(address, mint, nonce);
  const decimals = bal?.decimals ?? 6;

  const inMint = mode === "buy" ? SOL_MINT : mint;
  const outMint = mode === "buy" ? mint : SOL_MINT;
  const inDecimals = mode === "buy" ? 9 : decimals;
  const outDecimals = mode === "buy" ? decimals : 9;

  const inBase = useMemo(() => toBase(amount, inDecimals), [amount, inDecimals]);

  /* ------------------------------------------------------------- quoting */

  // The request in flight, so a slow answer for an old amount cannot land on
  // a new one. Typing "1" then "12" fires two quotes and they can return in
  // either order.
  const seq = useRef(0);

  const refreshQuote = useCallback(async () => {
    const mine = ++seq.current;
    if (inBase <= 0n || !tradable) {
      setQuote(null); setNoRoute(false); setQuoting(false);
      return;
    }
    setQuoting(true);
    try {
      const q = await getQuote(inMint, outMint, inBase, slippage);
      if (seq.current !== mine) return;
      setQuote(q);
      setNoRoute(q === null);
      setErr(null);
    } catch (e) {
      if (seq.current !== mine) return;
      setQuote(null);
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      if (seq.current === mine) setQuoting(false);
    }
  }, [inBase, inMint, outMint, slippage, tradable]);

  // Debounced while typing, then held fresh: a quote is a price and an
  // eight-second-old price on a pump.fun pool is fiction.
  useEffect(() => {
    const t = setTimeout(refreshQuote, 300);
    return () => clearTimeout(t);
  }, [refreshQuote]);

  useEffect(() => {
    if (inBase <= 0n) return;
    const id = setInterval(refreshQuote, 12_000);
    return () => clearInterval(id);
  }, [refreshQuote, inBase]);

  /* ------------------------------------------------------------ settling */

  const submit = async () => {
    if (!signer || !quote) return;
    setBusy(true); setErr(null); setSig(null);
    try {
      const s = await executeSwap(quote, signer);
      setSig(s);
      setAmount("");
      setQuote(null);
      setNonce((v) => v + 1);
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      // A wallet rejection is a decision, not a failure, and reporting it in
      // red next to a transaction hash field reads as though something broke.
      setErr(/reject|denied|cancel/i.test(m) ? null : m);
    } finally {
      setBusy(false);
    }
  };

  /* -------------------------------------------------------------- render */

  const outAmount = quote ? Number(quote.outAmount) / 10 ** outDecimals : null;
  const minOut = quote ? Number(quote.minOutAmount) / 10 ** outDecimals : null;
  const impact = quote ? quote.priceImpact * 100 : null;

  const have = mode === "buy" ? (bal?.sol ?? 0) : (bal?.token ?? 0);
  const wantNum = Number(amount) || 0;
  // Buying spends the fee and the rent for a first-time token account out of
  // the same balance, so spending the literal maximum always fails.
  const overspend = mode === "buy" ? wantNum > Math.max(0, have - 0.01) : wantNum > have;

  const label = (() => {
    if (!tradable) return "Not launched yet";
    if (!address) return "Connect wallet";
    if (busy) return "Confirming";
    if (inBase <= 0n) return mode === "buy" ? `Buy ${symbol}` : `Sell ${symbol}`;
    if (overspend) return mode === "buy" ? "Not enough SOL" : `Not enough ${symbol}`;
    if (noRoute) return "No route yet";
    if (quoting && !quote) return "Quoting";
    return mode === "buy" ? `Buy ${symbol}` : `Sell ${symbol}`;
  })();

  const ready = Boolean(address && quote && !busy && !overspend && tradable);

  const setPreset = (p: number) => {
    if (mode === "buy") setAmount(String(p));
    else if (bal) setAmount(String((bal.token * p) / 100));
  };

  return (
    <aside className="trade-panel" data-mode={mode}>
      <div className="trade-tabs" role="tablist" aria-label="Buy or sell">
        {(["buy", "sell"] as Mode[]).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            className={mode === m ? "active" : ""}
            onClick={() => { setMode(m); setAmount(""); setQuote(null); setSig(null); setErr(null); }}
          >
            {m === "buy" ? "Buy" : "Sell"}
          </button>
        ))}
      </div>

      <label className="trade-amount">
        <input
          inputMode="decimal"
          aria-label={mode === "buy" ? "Amount in SOL" : `Amount in ${symbol}`}
          placeholder="0"
          disabled={!tradable}
          value={amount}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "" || /^\d*\.?\d*$/.test(v)) setAmount(v);
          }}
        />
        <span className="trade-symbol">{mode === "buy" ? "SOL" : symbol}</span>
      </label>

      <div className="tp-receive">
        {quote && outAmount !== null ? (
          <>
            <span>receive</span>
            <b>{fmtAmount(outAmount)} {mode === "buy" ? symbol : "SOL"}</b>
          </>
        ) : (
          <span className="tp-receive-idle">
            {quoting ? "quoting" : noRoute ? "no route yet" : "enter an amount"}
          </span>
        )}
      </div>

      <div className="quick-amounts">
        {(mode === "buy" ? BUY_PRESETS : SELL_PRESETS).map((p) => (
          <button
            key={p}
            disabled={!tradable}
            className={
              mode === "buy"
                ? Number(amount) === p ? "active" : ""
                : bal && Math.abs(Number(amount) - (bal.token * p) / 100) < 1e-9 && Number(amount) > 0 ? "active" : ""
            }
            onClick={() => setPreset(p)}
          >
            {mode === "buy" ? `${p}` : p === 100 ? "MAX" : `${p}%`}
          </button>
        ))}
      </div>

      <dl className="tp-rows">
        <div>
          <dt>Balance</dt>
          <dd>
            {address
              ? mode === "buy" ? `${(bal?.sol ?? 0).toFixed(3)} SOL` : `${fmtAmount(bal?.token ?? 0)} ${symbol}`
              : "not connected"}
          </dd>
        </div>
        <div>
          <dt>Price impact</dt>
          <dd className={impact !== null && impact >= 5 ? "tp-warn" : undefined}>
            {impact === null ? "—" : `${impact < 0.01 ? "<0.01" : impact.toFixed(2)}%`}
          </dd>
        </div>
        <div>
          <dt>Minimum received</dt>
          <dd>{minOut === null ? "—" : `${fmtAmount(minOut)} ${mode === "buy" ? symbol : "SOL"}`}</dd>
        </div>
        <div>
          <dt>Route</dt>
          <dd>{quote?.route.length ? quote.route.join(" › ") : "—"}</dd>
        </div>
      </dl>

      <div className="tp-foot">
        <button className="fee" onClick={() => setSlipOpen((v) => !v)} aria-expanded={slipOpen}>
          {slippage / 100}% slippage <CaretDown className={slipOpen ? "rotated" : ""} />
        </button>
        {slipOpen ? (
          <div className="fee-popover" role="group" aria-label="Slippage tolerance">
            {SLIPPAGES.map((s) => (
              <button
                key={s}
                className={s === slippage ? "active" : ""}
                onClick={() => { setSlippage(s); setSlipOpen(false); }}
              >
                {s / 100}%
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {sig ? (
        <a className="tp-done" href={explorerUrl("tx", sig)} target="_blank" rel="noopener noreferrer">
          Settled. View the transaction <ArrowSquareOut />
        </a>
      ) : null}
      {err ? <p className="tp-err">{err}</p> : null}

      <button
        className="buy-login"
        disabled={!tradable || (Boolean(address) && !ready)}
        onClick={() => (address ? submit() : setShowModal(true))}
      >
        {!address && tradable ? <Wallet weight="fill" /> : null}
        {label}
      </button>
    </aside>
  );
}
