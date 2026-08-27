"use client";

import {
  ArrowDown, ArrowUp, CaretLeft, CaretRight, DotsThreeOutline, House, Info,
  MagnifyingGlass, Plus, User, UserCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useLaunches, type Launch } from "@/lib/peard/launches";
import { useMarket, usd, type MarketSnapshot } from "@/lib/peard/market";
import { ConnectButton } from "./connect-button";
import { useIcons, localIcon, tint } from "@/lib/peard/icons";

const navItems = [
  { Icon: House, label: "Home", href: "/" },
  { Icon: UserCircle, label: "Account", href: "/account" },
];

/**
 * The search box does nothing yet, deliberately.
 *
 * It searched the registry, and the registry is no longer on this page. When
 * there are launches it should search THOSE; searching them today would be a
 * control that always returns nothing.
 */

function Sidebar() {
  return <aside className="sidebar">
    <div className="brand">peard</div>
    <nav aria-label="Primary navigation">
      {navItems.map(({ Icon, label, href }, index) => <Link href={href} style={{ textDecoration: "none" }} className={index === 0 ? "nav-item active" : "nav-item"} key={label}>
        <Icon className="nav-icon" weight={index === 0 ? "fill" : "regular"}/>{label}
      </Link>)}
      <Link className="launch" href="/launch"><Plus weight="bold"/> Launch a coin</Link>
    </nav>
    <Link className="more" href="/account"><DotsThreeOutline/> More</Link>
  </aside>;
}

function Header({ q, setQ }: { q: string; setQ: (v: string) => void }) {
  return <header className="topbar">
    <label className="search"><MagnifyingGlass/><input aria-label="Search" placeholder="Search underlyings" value={q} onChange={(e) => setQ(e.target.value)}/></label>
    <div className="topbar-actions">
      <button className="how"><Info weight="fill"/> How it works</button>
      <ConnectButton/>
    </div>
  </header>;
}

/** The six artwork regions the stylesheet already carries. */
const FEATURES = ["dog-feature", "light-feature", "cat-feature", "baseball-feature", "action-feature", "android-feature"];

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
 * One launch's live numbers.
 *
 * Per card rather than fetched in a batch, because DexScreener has no
 * multi-token endpoint that also returns the pair, and a launch grid is a
 * handful of tokens rather than the 121-entry registry this page used to
 * render.
 */
function useCardMarket(mint: string) {
  return useMarket(mint, 60_000);
}

function Change({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  const up = pct >= 0;
  return <em className={up ? "up" : "down"}>
    {up ? <ArrowUp weight="fill"/> : <ArrowDown weight="fill"/>}{Math.abs(pct).toFixed(2)}%
  </em>;
}

function LaunchCard({ l, icon }: { l: Launch; icon?: string }) {
  const art = l.on ? localIcon(l.on.id) ?? icon : undefined;
  const { market, unlisted } = useCardMarket(l.mint);
  return <Link className="coin-link" href={`/token/${l.mint}`}><article className="coin-card">
    {art
      // eslint-disable-next-line @next/next/no-img-element
      ? <div className="coin-image coin-mark" role="img" aria-label=""><img alt="" src={art}/></div>
      : <div className="coin-image coin-blank" style={{ background: tint(l.mint) }}>
          <span>{(l.symbol || l.mint).slice(0, 3).toUpperCase()}</span>
        </div>}
    <div className="coin-info">
      <h3>{l.name || l.symbol}</h3>
      <div className="symbol">${l.symbol} <b>{l.on?.id ?? ""}</b></div>
      <div className="numbers">
        <strong>{market ? usd(market.marketCapUsd ?? market.fdvUsd) : unlisted ? "new" : "…"}</strong>
        <Change pct={market?.change.h24 ?? null}/>
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
  const shown = launches.slice(0, 6);
  const pages = Math.max(1, Math.ceil(shown.length / 3));

  if (shown.length === 0) return null;

  return <section className="trending" aria-labelledby="strip-title">
    <div className="section-heading">
      <h1 id="strip-title">Just launched</h1>
      <div>
        <button aria-label="Previous" disabled={slide === 0} onClick={() => setSlide((v) => Math.max(0, v - 1))}><CaretLeft/></button>
        <button aria-label="Next" disabled={slide >= pages - 1} onClick={() => setSlide((v) => Math.min(pages - 1, v + 1))}><CaretRight/></button>
      </div>
    </div>
    <div className="feature-row" style={{ transform: `translateX(-${slide * 1068}px)` }}>
      {shown.map((l) => <FeatureCard key={l.mint} l={l} icon={icons[l.on?.assetMint ?? ""]}/>)}
    </div>
    <div className="pagination" aria-label={`Page ${slide + 1} of ${pages}`}>
      {Array.from({ length: pages }).map((_, i) => <i className={slide === i ? "active" : ""} key={i}/>)}
    </div>
  </section>;
}

function FeatureCard({ l, icon }: { l: Launch; icon?: string }) {
  const art = l.on ? localIcon(l.on.id) ?? icon : undefined;
  const { market } = useCardMarket(l.mint);
  return <article className="feature feature-plain" style={art ? undefined : { background: tint(l.mint) }}>
    {art
      // eslint-disable-next-line @next/next/no-img-element
      ? <img className="feature-art" alt="" src={art}/>
      : <span className="feature-initials">{(l.symbol || l.mint).slice(0, 3).toUpperCase()}</span>}
    <div className="feature-user"><User weight="fill"/> {l.on?.id ?? "launch"}</div>
    <div className="feature-copy">
      <div><b>{l.name || l.symbol}</b><small>${l.symbol}</small></div>
      <div className="quote">
        <b>{market ? usd(market.marketCapUsd ?? market.fdvUsd) : "new"}</b>
        <Change pct={market?.change.h24 ?? null}/>
      </div>
      <Link className="feature-trade" href={`/token/${l.mint}`}>Trade</Link>
    </div>
  </article>;
}

function ExploreSection({ launches, error }: { launches: Launch[] | null; error: string | null }) {
  const icons = useIcons((launches ?? []).map((l) => l.on?.assetMint));

  return <section className="explore" aria-labelledby="explore-title">
    <h2 id="explore-title">Launches{launches ? <em className="grid-count">{launches.length}</em> : null}</h2>
    {error ? <p style={{ color: "#e6a5a5", fontSize: 13 }}>Cannot read the chain: {error}</p> : null}
    {launches === null ? <p className="grid-empty">Reading the chain…</p> : null}

    {launches !== null && launches.length === 0 ? (
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

export default function HomePage() {
  const { launches, error } = useLaunches();
  const [q, setQ] = useState("");
  const visibleLaunches = useMemo(() => {
    if (!launches) return null;
    const needle = q.trim().toLowerCase();
    return needle
      ? launches.filter((launch) => `${launch.name} ${launch.symbol}`.toLowerCase().includes(needle))
      : launches;
  }, [launches, q]);
  const stripIcons = useIcons((visibleLaunches ?? []).map((l) => l.on?.assetMint));
  return <main className="app-shell">
    <div className="ambient"/>
    <Sidebar/>
    <section className="workspace"><Header q={q} setQ={setQ}/>{visibleLaunches?.length ? <TopStrip launches={visibleLaunches} icons={stripIcons}/> : null}<ExploreSection launches={visibleLaunches} error={error}/></section>
  </main>;
}
