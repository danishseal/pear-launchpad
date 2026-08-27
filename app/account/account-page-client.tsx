"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePeardAddress } from "@/lib/peard/signer";
import { loadAll, type Market, type Pairable } from "@/lib/peard/chain";
import { explorerUrl } from "@/lib/peard/config";
import { ConnectButton } from "../connect-button";
import { ArrowDown, ArrowUp, Coins, DotsThreeOutline, Gift, House, Info, MagnifyingGlass, Plus, RocketLaunch, ShareNetwork, SlidersHorizontal, User, UserCircle } from "@phosphor-icons/react";

const tabs = ["Holdings", "Launches", "Activity"] as const;

/**
 * What this wallet has launched, read off chain.
 *
 * Filters `Market.creator`, which is set once by `create_market` and never
 * moves. Returns an empty list rather than null once the read lands, so an
 * empty account and an account still loading are distinguishable: they look
 * identical otherwise and one of them is a bug.
 */
function useMyLaunches(owner: string | null) {
  const [state, setState] = useState<{ markets: Market[]; pairables: Pairable[] } | null>(null);
  useEffect(() => {
    if (!owner) { setState(null); return; }
    let live = true;
    loadAll()
      .then((snap) => { if (live) setState({ markets: snap.markets.filter((m) => m.creator === owner), pairables: snap.pairables }); })
      .catch(() => { if (live) setState({ markets: [], pairables: [] }); });
    return () => { live = false; };
  }, [owner]);
  return state;
}
type AccountTab = (typeof tabs)[number];

function Sidebar() { return <aside className="account-sidebar"><Link className="account-brand" href="/">peard</Link><nav aria-label="Primary navigation"><Link href="/"><House />Home</Link><Link className="active" href="/account"><UserCircle weight="fill" />Account</Link><Link className="account-launch" href="/launch"><Plus weight="bold" />Launch a coin</Link></nav><button className="account-more"><DotsThreeOutline />More</button></aside>; }

function Header() { return <header className="account-topbar"><label><MagnifyingGlass /><input aria-label="Search" placeholder="Search coins or users" /></label><button className="account-how"><Info weight="fill" />How it works</button><ConnectButton className="account-signup connect-wallet" connectLabel="Connect"/></header>; }

function TabBody({ tab, connected, mine }: {
  tab: AccountTab;
  connected: boolean;
  mine: ReturnType<typeof useMyLaunches>;
}) {
  const copy = {
    Holdings: { Icon: Coins, title: "No holdings yet", text: "Coins in your portfolio will appear here.", action: "Explore underlyings", href: "/" },
    Launches: { Icon: RocketLaunch, title: "No launches yet", text: "Coins you launch will appear here.", action: "Launch a coin", href: "/launch" },
    Activity: { Icon: SlidersHorizontal, title: "No activity yet", text: "Your trades and account activity will appear here.", action: "Explore underlyings", href: "/" },
  }[tab];
  const Icon = copy.Icon;

  // Not connected is a DIFFERENT state from connected-with-nothing, and the
  // mockup rendered one message for both. One of them is fixed by clicking a
  // button and the other is not.
  if (!connected) {
    return <div className="account-empty"><div className="empty-icon"><Icon weight="duotone"/></div>
      <h2>Not connected</h2><p>Connect a wallet to see what it holds and what it has launched.</p>
      <ConnectButton className="account-signup" connectLabel="Connect"/>
    </div>;
  }

  if (tab === "Launches") {
    if (!mine) return <div className="account-empty"><p>Reading the chain…</p></div>;
    if (mine.markets.length === 0) {
      return <div className="account-empty"><div className="empty-icon"><Icon weight="duotone"/></div>
        <h2>{copy.title}</h2><p>{copy.text}</p><Link href={copy.href}>{copy.action}</Link></div>;
    }
    return <div className="my-launches">{mine.markets.map((m) => {
      const on = mine.pairables.find((x) => x.pda === m.pairable);
      return <a className="my-launch" key={m.pda} href={explorerUrl("address", m.tokenMint)} target="_blank" rel="noopener noreferrer">
        <div><b>{m.tokenMint.slice(0, 4)}…{m.tokenMint.slice(-4)}</b><small>priced in {on?.id ?? "an underlying"}</small></div>
        <div className="my-launch-right"><b>{m.feeBps / 100}% fee</b><small>{m.poolKind === "none" ? "no pool" : m.poolKind}</small></div>
      </a>;
    })}</div>;
  }

  // Holdings and Activity both need an indexer: one wants every token account
  // this wallet owns priced against its pool, the other wants a trade history
  // no program stores. Saying so beats a spinner that never resolves.
  return <div className="account-empty"><div className="empty-icon"><Icon weight="duotone"/></div>
    <h2>{copy.title}</h2>
    <p>{tab === "Holdings"
      ? "Nothing launched on this cluster yet, so there is nothing to hold. This reads your token accounts once pools exist."
      : "Trade history needs an indexer. No program stores it, and reconstructing it from the chain is a separate service."}</p>
    <Link href={copy.href}>{copy.action}</Link></div>;
}

export default function AccountPageClient() {
  const [activeTab, setActiveTab] = useState<AccountTab>("Holdings");
  const owner = usePeardAddress();
  const connected = Boolean(owner);
  const mine = useMyLaunches(owner);
  const short = useMemo(() => owner ? `${owner.slice(0, 4)}…${owner.slice(-4)}` : null, [owner]);

  return <main className="account-shell"><div className="account-ambient" /><Sidebar /><section className="account-main"><Header />
    <div className="account-profile-heading"><div className="account-avatar"><User weight="fill" /></div>
      <div><h1>{short ?? "Account"}</h1>
        {owner ? <a href={explorerUrl("address", owner)} target="_blank" rel="noopener noreferrer" style={{ color: "#94a397", fontSize: 13 }}>view on explorer</a> : <ConnectButton className="account-signup" connectLabel="Connect"/>}
      </div>
      <button className="share-profile" aria-label="Share profile"><ShareNetwork /></button>
      <button className="earn-button"><Gift weight="fill" />Earn</button></div>
    <div className="account-summary">
      <article className="portfolio-card"><div className="summary-label">Launched by you</div><strong>{mine ? mine.markets.length : connected ? "…" : "—"}</strong></article>
      <article className="cash-card"><div><span className="summary-label">Cluster</span><strong style={{ fontSize: 20 }}>mainnet-beta</strong></div>
        <div className="cash-actions"><Link href="/launch"><ArrowUp />Launch a coin</Link><Link href="/"><ArrowDown />Explore</Link></div></article></div>
    <section className="profile-card"><div className="account-tabs" role="tablist">{tabs.map(tab => <button role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)} key={tab}>{tab}</button>)}</div>
      <TabBody tab={activeTab} connected={connected} mine={mine}/></section>
  </section></main>;
}
