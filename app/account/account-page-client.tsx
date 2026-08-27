"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePeardAddress } from "@/lib/peard/signer";
import { loadAll, type Market, type Pairable } from "@/lib/peard/chain";
import { explorerUrl } from "@/lib/peard/config";
import { ConnectButton } from "../connect-button";
import { AppHeader, AppSidebar } from "../app-chrome";
import { Check, Coins, Copy, CurrencyDollar, PlusSquare, RocketLaunch, ShareNetwork, SlidersHorizontal, User, X } from "@phosphor-icons/react";

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
  const [state, setState] = useState<{ owner: string; markets: Market[]; pairables: Pairable[] } | null>(null);
  useEffect(() => {
    if (!owner) return;
    let live = true;
    loadAll()
      .then((snap) => { if (live) setState({ owner, markets: snap.markets.filter((m) => m.creator === owner), pairables: snap.pairables }); })
      .catch(() => { if (live) setState({ owner, markets: [], pairables: [] }); });
    return () => { live = false; };
  }, [owner]);
  return owner && state?.owner === owner ? state : null;
}
type AccountTab = (typeof tabs)[number];

function useSolBalance(owner: string | null) {
  const [balance, setBalance] = useState<{ owner: string; sol: number | null; failed: boolean } | null>(null);

  useEffect(() => {
    if (!owner) return;
    let live = true;
    const read = () => fetch(`/api/balance?address=${encodeURIComponent(owner)}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Balance request failed");
        return response.json() as Promise<{ sol: number }>;
      })
      .then(({ sol }) => {
        if (live) setBalance({ owner, sol, failed: false });
      })
      .catch(() => {
        if (live) setBalance({ owner, sol: null, failed: true });
      });
    void read();
    const timer = window.setInterval(read, 15_000);
    return () => {
      live = false;
      window.clearInterval(timer);
    };
  }, [owner]);

  if (!owner) return { sol: null, loading: false, failed: false };
  if (!balance || balance.owner !== owner) return { sol: null, loading: true, failed: false };
  return { sol: balance.sol, loading: false, failed: balance.failed };
}

function CashCard({ owner }: { owner: string | null }) {
  const [fundingOpen, setFundingOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const balance = useSolBalance(owner);
  const balanceLabel = !owner
    ? "—"
    : balance.loading
      ? "…"
      : balance.failed || balance.sol === null
        ? "Unavailable"
        : `${balance.sol.toLocaleString(undefined, { maximumFractionDigits: 4 })} SOL`;

  async function copyAddress() {
    if (!owner) return;
    await navigator.clipboard.writeText(owner);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return <>
    <article className="cash-card">
      <div className="cash-balance-row"><span className="cash-balance-label"><i><CurrencyDollar weight="bold"/></i>Cash balance</span><strong>{balanceLabel}</strong></div>
      {owner
        ? <button className="account-add-cash" type="button" onClick={() => setFundingOpen(true)}><PlusSquare weight="bold"/>Add cash</button>
        : <ConnectButton className="account-add-cash" connectLabel="Add cash"/>}
    </article>
    {fundingOpen && owner ? <div className="funding-overlay" role="presentation" onMouseDown={() => setFundingOpen(false)}>
      <section className="funding-dialog" role="dialog" aria-modal="true" aria-labelledby="funding-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="funding-close" type="button" aria-label="Close" onClick={() => setFundingOpen(false)}><X/></button>
        <span className="funding-mark"><CurrencyDollar weight="bold"/></span>
        <h2 id="funding-title">Add cash</h2>
        <p>Send SOL or another supported Solana asset to your wallet address.</p>
        <div className="funding-address"><code>{owner}</code><button type="button" onClick={copyAddress}>{copied ? <Check weight="bold"/> : <Copy/>}{copied ? "Copied" : "Copy"}</button></div>
        <a href={explorerUrl("address", owner)} target="_blank" rel="noopener noreferrer">View wallet on Solana Explorer</a>
      </section>
    </div> : null}
  </>;
}

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

  return <main className="account-shell app-chrome-shell"><div className="account-ambient" /><AppSidebar /><section className="account-main"><AppHeader />
    <div className="account-profile-heading"><div className="account-avatar"><User weight="fill" /></div>
      <div><h1>{short ?? "Account"}</h1>
        {owner ? <a href={explorerUrl("address", owner)} target="_blank" rel="noopener noreferrer" style={{ color: "#94a397", fontSize: 13 }}>view on explorer</a> : <ConnectButton className="account-signup" connectLabel="Connect"/>}
      </div>
      <button className="share-profile" aria-label="Share profile"><ShareNetwork /></button></div>
    <div className="account-summary">
      <article className="portfolio-card"><div className="summary-label">Launched by you</div><strong>{mine ? mine.markets.length : connected ? "…" : "—"}</strong></article>
      <CashCard owner={owner}/></div>
    <section className="profile-card"><div className="account-tabs" role="tablist">{tabs.map(tab => <button role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)} key={tab}>{tab}</button>)}</div>
      <TabBody tab={activeTab} connected={connected} mine={mine}/></section>
  </section></main>;
}
