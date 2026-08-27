"use client";

import {
  ArrowDown, ArrowUp, CaretLeft, CaretRight, User,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useLaunches, type Launch } from "./launches";
import { usd } from "@/lib/peard/market";
import { useToken } from "@/lib/peard/feed";
import { OFFICIAL, OFFICIAL_MINT, useOfficial } from "@/lib/peard/official";
import { useIcons, localIcon, tint } from "@/lib/peard/icons";
import { AppHeader, AppSidebar } from "./app-chrome";

/*
 * The "Moved most recently" carousel is GONE, for the same reason the grid
 * stopped listing pairables: it presented underlyings as though they were
 * launches, and it dressed them in regions of reference.png, so
 * Counter-Strike's concurrent player count arrived wearing a photograph of
 * somebody's dog and NVIDIA arrived as a lightning bolt.
 *
 * When there are launches to rank, this comes back ranking THEM. Ranking the
 * registry on a page about launches was the error, not the carousel.
 */

/**
 * One card's live numbers, through this app's own route.
 *
 * Per card rather than batched, because the grid is a handful of tokens
 * rather than the 121-entry registry this page used to render, and because
 * the route caches for ten seconds anyway: ten cards open in twenty tabs are
 * still six calls a minute upstream.
 */
function useCardMarket(mint: string) {
  return useToken(mint, 30_000);
}

/**
 * peard's own token, pinned to the front of the grid ONCE IT EXISTS.
 *
 * Hidden until then, deliberately: a card reading "not launched yet" is an
 * announcement, and the page should not be making one. What replaces it is
 * the watch in `useOfficial`, which polls the mint and puts this card up the
 * moment the coin is created, with no reload and nothing to switch on.
 */
const OFFICIAL_LAUNCH: Launch = {
  mint: OFFICIAL_MINT,
  name: OFFICIAL.name,
  symbol: OFFICIAL.symbol,
  at: Number.MAX_SAFE_INTEGER,
  creator: "",
  on: null,
  onMeta: null,
  legacy: null,
};

function Change({ pct }: { pct: number | null }) {
  if (pct === null) return <em className="zero" aria-label="24 hour change 0.00%">0.00%</em>;
  if (pct === 0) return <em className="zero" aria-label="24 hour change 0.00%">0.00%</em>;
  const up = pct >= 0;
  return <em className={up ? "up" : "down"} aria-label={`24 hour change ${pct.toFixed(2)}%`}>
    {up ? <ArrowUp weight="fill"/> : <ArrowDown weight="fill"/>}{Math.abs(pct).toFixed(2)}%
  </em>;
}

function LaunchCard({ l, icon }: { l: Launch; icon?: string }) {
  const official = l.mint === OFFICIAL_MINT;
  const { snap, loading } = useCardMarket(l.mint);
  // The token's own artwork once the venue has it, then the registry mark,
  // then initials. peard itself has a real logo either way.
  const art = snap?.image ?? (official ? "/peard.webp" : l.on ? localIcon(l.on.id) ?? icon : undefined);
  return <Link className="coin-link" href={`/token/${l.mint}`}><article className="coin-card">
    {art
      // eslint-disable-next-line @next/next/no-img-element
      ? <div className="coin-image coin-mark" role="img" aria-label=""><img alt="" src={art}/></div>
      : <div className="coin-image coin-blank" style={{ background: tint(l.mint) }}>
          <span>{(l.symbol || l.mint).slice(0, 3).toUpperCase()}</span>
        </div>}
    <div className="coin-info">
      <h3>{snap?.name ?? l.name ?? l.symbol}</h3>
      <div className="symbol">${snap?.symbol ?? l.symbol} <b>{l.on?.id ?? ""}</b></div>
      <div className="numbers">
        <strong>{snap?.marketCapUsd != null ? usd(snap.marketCapUsd) : loading ? "…" : "$0"}</strong>
        <Change pct={snap?.change24hPct ?? null}/>
      </div>
      <div className="creator"><span className="avatar a0"><User weight="fill"/></span>
        {l.on ? `on ${l.on.id}` : "launch"}
      </div>
    </div>
  </article></Link>;
}

/**
 * The strip along the top, back and ranking LAUNCHES.
 *
 * It was removed because it ranked the REGISTRY on a page about launches and
 * dressed each entry in a region of reference.png, so a player count arrived
 * wearing a photograph of a dog. The section was never the problem; what it
 * was pointed at was.
 *
 * Ranks by 24h move, and falls back to newest while nothing has traded yet:
 * a strip called "moving" that is empty because everything is an hour old is
 * less useful than one that shows what just launched.
 */
function TopStrip({ launches, icons }: { launches: Launch[]; icons: Record<string, string> }) {
  const [slide, setSlide] = useState(0);
  const [cardsPerPage, setCardsPerPage] = useState(2);
  const shown = launches.slice(0, 6);
  const pages = Math.max(1, Math.ceil(shown.length / cardsPerPage));
  const step = cardsPerPage === 1 ? 315 : 835;

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 700px)");
    const sync = () => {
      setCardsPerPage(narrow.matches ? 1 : 2);
      setSlide(0);
    };
    sync();
    narrow.addEventListener("change", sync);
    return () => narrow.removeEventListener("change", sync);
  }, []);

  if (shown.length === 0) return null;

  return <section className="trending" aria-labelledby="strip-title">
    <div className="section-heading">
      <h1 id="strip-title">Trending now</h1>
      <div>
        <button aria-label="Previous" disabled={slide === 0} onClick={() => setSlide((v) => Math.max(0, v - 1))}><CaretLeft/></button>
        <button aria-label="Next" disabled={slide >= pages - 1} onClick={() => setSlide((v) => Math.min(pages - 1, v + 1))}><CaretRight/></button>
      </div>
    </div>
    <div className={`feature-viewport${pages > 1 ? " is-scrollable" : ""}`}>
      <div className="feature-row" style={{ transform: `translateX(-${slide * step}px)` }}>
        {shown.map((l) => <FeatureCard key={l.mint} l={l} icon={icons[l.on?.assetMint ?? ""]}/>)}
      </div>
    </div>
    <div className="pagination" aria-label={`Page ${slide + 1} of ${pages}`}>
      {Array.from({ length: pages }).map((_, i) => <i className={slide === i ? "active" : ""} key={i}/>)}
    </div>
  </section>;
}

function FeatureCard({ l, icon }: { l: Launch; icon?: string }) {
  const { snap } = useCardMarket(l.mint);
  const art = snap?.image ?? (l.mint === OFFICIAL_MINT ? "/peard.webp" : l.on ? localIcon(l.on.id) ?? icon : undefined);
  return <Link
    className="feature feature-plain feature-link"
    href={`/token/${l.mint}`}
    style={art ? undefined : { background: tint(l.mint) }}
  >
    {art
      ? <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="feature-backdrop" alt="" src={art}/>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="feature-art" alt="" src={art}/>
        </>
      : <span className="feature-initials">{(l.symbol || l.mint).slice(0, 3).toUpperCase()}</span>}
    <div className="feature-user">
      <span className="feature-user-mark">
        {art
          // eslint-disable-next-line @next/next/no-img-element
          ? <img alt="" src={art}/>
          : null}
      </span>
      {l.creator ? `${l.creator.slice(0, 10)}…` : "launch"}
    </div>
    <div className="feature-copy">
      <div className="feature-token"><b>{snap?.name ?? l.name ?? l.symbol}</b><small>${snap?.symbol ?? l.symbol}</small></div>
      <div className="quote">
        <b>{snap?.marketCapUsd != null ? usd(snap.marketCapUsd) : "$0"}</b>
        <Change pct={snap?.change24hPct ?? null}/>
      </div>
      <span className="feature-trade">Trade</span>
    </div>
  </Link>;
}

function ExploreSection({ launches, error, query }: { launches: Launch[] | null; error: string | null; query: string }) {
  const icons = useIcons((launches ?? []).map((l) => l.on?.assetMint));

  return <section className="explore" aria-labelledby="explore-title">
    <h2 id="explore-title">Launches{launches ? <em className="grid-count">{launches.length}</em> : null}</h2>
    {error ? <p style={{ color: "#e6a5a5", fontSize: 13 }}>Cannot read the chain: {error}</p> : null}
    {launches === null ? <p className="grid-empty">Reading the chain…</p> : null}

    {launches !== null && launches.length === 0 && query ? (
      <div className="no-launches">
        <h3>No coins found</h3>
        <p>No launch matches “{query}”. Try a name, ticker, mint, creator, or underlying.</p>
      </div>
    ) : null}

    {launches !== null && launches.length === 0 && !query ? (
      // Nothing launched yet, and saying so beats filling the grid with the
      // registry: those are the things you launch AGAINST, not things
      // anybody launched.
      <div className="no-launches">
        <h3>Nothing launched yet</h3>
        <p>
          A peard token is priced in a real thing rather than in dollars: its price, market cap and
          rewards all read in whatever it was launched on.
        </p>
        <Link className="no-launches-cta" href="/launch">Launch the first one</Link>
      </div>
    ) : null}

    <div className="coin-grid">{launches?.map((l) => (
      <LaunchCard key={l.mint} l={l} icon={icons[l.on?.assetMint ?? ""]}/>
    ))}</div>
  </section>;
}

function SearchableHome() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  return <HomeContent key={initialQuery} initialQuery={initialQuery}/>;
}

function HomeContent({ initialQuery }: { initialQuery: string }) {
  const { launches, error } = useLaunches();
  // The watch. One cached call every fifteen seconds, and the only thing it
  // decides is whether peard's own card is on the page at all.
  const { awaiting } = useOfficial();
  const [q, setQ] = useState(initialQuery);
  const visibleLaunches = useMemo(() => {
    if (!launches) return null;
    const all = [
      ...(awaiting ? [] : [OFFICIAL_LAUNCH]),
      ...launches.filter((launch) => launch.mint !== OFFICIAL_MINT),
    ];
    const needle = q.trim().toLowerCase();
    return needle
      ? all.filter((launch) => [
          launch.name,
          launch.symbol,
          launch.mint,
          launch.creator,
          launch.on?.id,
          launch.onMeta?.name,
        ].filter(Boolean).join(" ").toLowerCase().includes(needle))
      : all;
  }, [launches, q, awaiting]);
  const stripIcons = useIcons((visibleLaunches ?? []).map((l) => l.on?.assetMint));
  return <main className="app-shell app-chrome-shell">
    <div className="ambient"/>
    <AppSidebar/>
    <section className="workspace"><AppHeader query={q} onQueryChange={setQ}/>{visibleLaunches?.length ? <TopStrip launches={visibleLaunches} icons={stripIcons}/> : null}<ExploreSection launches={visibleLaunches} error={error} query={q.trim()}/></section>
  </main>;
}

export default function HomePage() {
  return <Suspense fallback={null}><SearchableHome/></Suspense>;
}
