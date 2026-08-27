"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowSquareOut, CaretLeft, CheckCircle, Copy,
  ShareNetwork,
} from "@phosphor-icons/react";
import { useUnderlying, ago } from "@/lib/peard/underlying-detail";
import { formatPrice } from "@/lib/peard/underlyings";
import { explorerUrl } from "@/lib/peard/config";
import { useIcons, localIcon, tint } from "@/lib/peard/icons";
import { useMarket, usd, chartUrl } from "@/lib/peard/market";
import { attachmentFor, resolveUnderlying, type Attachment } from "@/lib/peard/attachments";
import { AppHeader, AppSidebar } from "../../app-chrome";
import { useLaunches } from "../../launches";

/**
 * One page, two things it can be showing.
 *
 * The route segment is either a MINT, from a launch card, or a registry ID,
 * from the launch wizard. It used to assume the second and told anybody
 * arriving from a launch that "No underlying called CFYDJB69GHYH5X... is
 * registered on this cluster", which is true and useless: they had just
 * launched it.
 *
 * A base58 mint is 32 bytes and 43-44 characters; a registry id is short and
 * upper-case with hyphens. Long enough to be an address is the test, and it
 * cannot collide because no pairable id is that long.
 */
function looksLikeMint(s: string): boolean {
  return s.length >= 32;
}

function Mark({ id, mint, size }: { id: string; mint: string | null; size?: number }) {
  const icons = useIcons([mint]);
  const icon = localIcon(id) ?? (mint ? icons[mint] : undefined);
  return <div className="token-avatar token-mark" style={{ background: icon ? "#f4f6f4" : tint(id), width: size, height: size }}>
    {icon
      // eslint-disable-next-line @next/next/no-img-element
      ? <img alt="" src={icon}/>
      : <span>{id.replace(/[^A-Za-z0-9]/g, "").slice(0, 2)}</span>}
  </div>;
}

/* ------------------------------------------------------------- a launch */

function LaunchView({ mint }: { mint: string }) {
  const [att] = useState<Attachment | null>(() => attachmentFor(mint));
  const [detailTab, setDetailTab] = useState<"about" | "holders" | "activity">("about");
  const { launches } = useLaunches();
  const launch = launches?.find((candidate) => candidate.mint === mint) ?? null;
  const { market, loading, unlisted } = useMarket(mint);
  const name = att?.name ?? launch?.name ?? "Launch";
  const symbol = att?.symbol ?? launch?.symbol ?? mint.slice(0, 4);
  const launchUnderlying = att?.underlying ?? launch?.on?.id ?? null;
  const price = loading ? "…" : usd(market?.priceUsd ?? 0, 6);
  const marketCap = loading ? "…" : usd(market?.marketCapUsd ?? market?.fdvUsd ?? 0);
  const liquidity = loading ? "…" : usd(market?.liquidityUsd ?? 0);
  const volume24h = loading ? "…" : usd(market?.volume.h24 ?? 0);

  // Local first, then the chain. A launch made against peard's own programs
  // carries its underlying in the Market account, so it is knowable on any
  // device rather than only the one that made it.
  const [resolvedUnder, setResolvedUnder] = useState<string | null>(null);
  const under = launchUnderlying ?? resolvedUnder;
  useEffect(() => {
    if (under) return;
    let live = true;
    resolveUnderlying(mint).then((id) => { if (live && id) setResolvedUnder(id); });
    return () => { live = false; };
  }, [mint, under]);

  const { detail } = useUnderlying(under ?? "");

  return <main className="token-shell app-chrome-shell"><AppSidebar/><div className="token-main"><AppHeader/>
    <section className="token-identity">
      <Link href="/" aria-label="Back"><CaretLeft/></Link>
      <Mark id={under ?? launchUnderlying ?? mint} mint={detail?.p.assetMint ?? launch?.on?.assetMint ?? null}/>
      <div className="token-identity-copy">
        <h1>{name}
          <button aria-label="Copy link" className="icon-btn" onClick={() => navigator.clipboard?.writeText(window.location.href)}><ShareNetwork/></button>
        </h1>
        <p>${symbol}
          <button aria-label="Copy the mint" className="icon-btn" onClick={() => navigator.clipboard?.writeText(mint)}><Copy/></button>
        </p>
        <div className="token-badges">
          <span>{market ? "Live market" : unlisted ? "Indexing" : "Loading"}</span>
          <span>{under ? `Priced on ${under}` : "Reading underlying"}</span>
        </div>
      </div>
    </section>
    <div className="token-divider"/>

    <div className="token-layout">
      <div>
        <section className="token-overview" aria-label="Market overview">
          <div><span>Price</span><b>{price}</b></div>
          <div><span>Market cap</span><b>{marketCap}</b></div>
          <div><span>Liquidity</span><b>{liquidity}</b></div>
          <div><span>24h volume</span><b>{volume24h}</b></div>
        </section>
        <section className="chart-panel">
          <div className="chart-value">
            <strong>{price}</strong>
            <span>price</span>
            {market?.change.h24 !== null && market?.change.h24 !== undefined
              ? <em style={{ color: market.change.h24 >= 0 ? "#7fd396" : "#d99" }}>
                  {market.change.h24 >= 0 ? "▲" : "▼"} {Math.abs(market.change.h24).toFixed(2)}% 24h
                </em>
              : null}
          </div>
          <div className="unit-price">
            <b>{marketCap}</b><span>MARKET CAP</span>
          </div>

          {/*
            DexScreener's own chart for the pair.
            The registry stores one TWAP and DBC stores a current price, so
            there is no series on chain to draw and no keyless OHLC endpoint
            to build one from. An embedded chart is real data somebody else
            already keeps; a line drawn here would be invented.
          */}
          {market?.pairAddress ? (
            <iframe className="dex-chart" src={chartUrl(market.pairAddress)} title="Price chart" loading="lazy"/>
          ) : (
            <div className="detail-empty" style={{ height: 260, borderBottom: 0 }}>
              <span>{unlisted ? "Not indexed yet" : "Loading"}</span>
              <p>{unlisted
                ? "A new pool takes a few minutes to appear. The chart fills in once it has traded."
                : "Reading the market."}</p>
            </div>
          )}
        </section>

        <section className="token-details">
          <div className="detail-tabs" role="tablist" aria-label="Token details">
            {(["about", "holders", "activity"] as const).map((tab) => (
              <button
                className={detailTab === tab ? "active" : ""}
                key={tab}
                onClick={() => setDetailTab(tab)}
                role="tab"
                aria-selected={detailTab === tab}
              >{tab[0].toUpperCase() + tab.slice(1)}</button>
            ))}
          </div>

          {detailTab === "about" ? <>
            <div className="market-links">
              <a href={`https://dexscreener.com/solana/${mint}`} target="_blank" rel="noopener noreferrer">DexScreener</a>
              <a href={explorerUrl("address", mint)} target="_blank" rel="noopener noreferrer">Solana Explorer</a>
              {under ? <Link href={`/token/${under.toLowerCase()}`}>{under} underlying</Link> : null}
            </div>

            <div className="creator-row"><span>Creator</span><b>
              <i className="creator-token-avatar">{symbol.slice(0, 1).toUpperCase()}</i>
              {launch?.creator ? `${launch.creator.slice(0, 8)}…${launch.creator.slice(-4)}` : "—"}
            </b></div>
            <div className="fee-row"><span>Creator fees</span><b>$0</b></div>

            <h3>Stats</h3>
            <div className="stat-row stripe"><span>Starting MCAP</span><b>{launch?.legacy ? "$50K" : "$5K"}</b></div>
            <div className="stat-row"><span>Pool pairing</span><b>{under ?? "—"}</b></div>
            <div className="stat-row stripe"><span>All-time volume</span><b>$0</b></div>
            <div className="stat-row"><span>24h volume</span><b>{volume24h}</b></div>
            <div className="stat-row stripe"><span>Total Supply</span><b>1B</b></div>
            <div className="stat-row"><span>Created</span><b>{launch?.at ? ago(launch.at) : "—"}</b></div>
            <div className="stat-row stripe"><span>Market fee</span><b>{((launch?.legacy?.market.feeBps ?? 100) / 100).toFixed(2)}%</b></div>
            <div className="stat-row"><span>Trade feeling</span><b><i className="feeling-pill">Peard</i></b></div>

            <h3>Contract</h3>
            <div className="stat-row stripe"><span>Chain</span><b>Solana</b></div>
            <div className="stat-row"><span>Contract Address</span><b>
              <a href={explorerUrl("address", mint)} target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>
                {mint.slice(0, 6)}…{mint.slice(-4)} <ArrowSquareOut/>
              </a>
            </b></div>
          </> : <div className="detail-tab-empty">
            <b>No {detailTab} data yet</b>
            <span>This section will populate when indexed activity is available.</span>
          </div>}
        </section>
      </div>

      <aside className="trade-panel">
        <div className="perp-head"><b>Trade</b><span>{market ? market.dexId : "pending"}</span></div>
        <div className="trade-summary">
          <div><span>Token</span><b>${symbol}</b></div>
          <div><span>Quote</span><b>USDC</b></div>
          <div><span>Underlying</span><b>{under ?? "—"}</b></div>
        </div>
        <p className="perp-funding">
          This token trades on a bonding curve against USDC. Buying and selling from inside peard is not wired yet.
        </p>
        {market?.url
          ? <a className="buy-login" href={market.url} target="_blank" rel="noopener noreferrer"
               style={{ display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
              Trade on DexScreener
            </a>
          : <button className="buy-login" disabled>Waiting for the pool to index</button>}
      </aside>
    </div>
  </div></main>;
}

/* --------------------------------------------------------- an underlying */

function UnderlyingView({ id }: { id: string }) {
  const { detail, loading, error } = useUnderlying(id);
  const ticker = id.toUpperCase();

  return <main className="token-shell app-chrome-shell"><AppSidebar/><div className="token-main"><AppHeader/>
    <section className="token-identity">
      <Link href="/" aria-label="Back"><CaretLeft/></Link>
      <Mark id={ticker} mint={detail?.p.assetMint ?? null}/>
      <div>
        <h1>{ticker}{detail?.p.grade === "hard" ? <CheckCircle weight="fill"/> : null}</h1>
        <p>{detail?.meta?.name ?? (loading ? "Reading the registry…" : ticker)}</p>
      </div>
    </section>
    <div className="token-divider"/>
    {error ? <p style={{ color: "#e0a3a3", fontSize: 13, padding: "18px 0" }}>{error}</p> : null}
    {detail ? <div className="token-layout">
      <div>
        <section className="token-details">
          <h3>The underlying</h3>
          <div className="stat-row stripe"><span>Price</span><b>{formatPrice(detail.p.price)} per {detail.p.unit}</b></div>
          <div className="stat-row"><span>Last pushed</span><b>{ago(detail.p.priceLastTs)}</b></div>
          <div className="stat-row stripe"><span>Sources agreeing</span><b>{detail.p.lastSourceCount} of {detail.p.providerCount}</b></div>
          <div className="stat-row"><span>Category</span><b>{detail.meta?.category ?? "other"}</b></div>
          <div className="stat-row stripe"><span>Goes stale after</span><b>{Math.round(detail.p.maxPriceAgeSecs / 3600)}h</b></div>
          {detail.p.expiresAt > 0 ? <div className="stat-row"><span>Last trading day</span><b>{new Date(detail.p.expiresAt * 1000).toISOString().slice(0, 10)}</b></div> : null}
          <h3>Where it comes from</h3>
          <p style={{ color: "#a8b6ab", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            {detail.meta?.source ?? "No note recorded for this underlying."}
          </p>
        </section>
      </div>
      <aside className="trade-panel">
        <div className="perp-head"><b>Launch on it</b><span>{detail.p.grade}</span></div>
        <div className="stat-row"><span>Price</span><b>{formatPrice(detail.p.price)}</b></div>
        <div className="stat-row stripe"><span>Unit</span><b>{detail.p.unit}</b></div>
        {detail.refusal
          ? <p style={{ position: "absolute", left: 19, right: 19, bottom: 24, margin: 0, fontSize: 12, lineHeight: 1.45, color: "#d8b48f" }}>{detail.refusal}</p>
          : <Link className="buy-login" href={`/launch?on=${encodeURIComponent(detail.p.id)}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
              Launch on {detail.p.id}
            </Link>}
      </aside>
    </div> : null}
  </div></main>;
}

export default function TokenPageClient({ symbol }: { symbol: string }) {
  return looksLikeMint(symbol) ? <LaunchView mint={symbol}/> : <UnderlyingView id={symbol}/>;
}
