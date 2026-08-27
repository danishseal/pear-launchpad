"use client";

import Link from "next/link";
import localFont from "next/font/local";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { usePeardSigner } from "@/lib/peard/signer";
import {
  CaretLeft, CaretRight, Check, ImageSquare, LinkSimple, MagnifyingGlass, PencilSimple, UploadSimple,
} from "@phosphor-icons/react";
import "./launch.css";
import { launchable, formatPrice, type Row } from "@/lib/peard/underlyings";
import { useRegistry } from "../registry";
import {
  launchOnMeteora, LAUNCH_FEE_BPS, DEFAULT_SUPPLY, INITIAL_MARKET_CAP_USD,
  MIGRATION_MARKET_CAP_USD, type MeteoraLaunchResult,
} from "@/lib/peard/meteora-launch";
import { recordAttachment } from "@/lib/peard/attachments";
import { explorerUrl } from "@/lib/peard/config";
import { useIcons, localIcon, tint } from "@/lib/peard/icons";
import { ConnectButton } from "../connect-button";

const launchFont = localFont({
  src: "../83afe278b6a6bb3c-s.p.3a6ba036.woff2",
  variable: "--font-launch",
  weight: "100 900",
  display: "swap",
});

/**
 * Launching, as a five-step wizard.
 *
 * The shape is LONG's: a chrome strip naming the step you are going TO on the
 * right and Back on the left, a thin progress rail, then one decision per
 * screen. The intro is not filler — it is where the two-line contract of the
 * product is stated before anyone types anything.
 *
 * ONLY PATH B IS REACHABLE HERE. A launch mints a token and stands a curve up
 * against a real asset, which needs hard grade. The index-grade half of the
 * registry already has 37 perp markets opened on it as of 2026-08-26, and
 * `init_market` refuses one that exists, so offering those would be a button
 * that always fails. They are reached from their own token page.
 */

type StepId = "intro" | "pick" | "fees" | "details" | "review";

/** What is wrong with launching here, as opposed to which pool it gets. */
function blocker(r: Row): string | null {
  if (r.price <= 0) return "no price yet, so rewards cannot convert";
  if (r.health === "frozen") return "frozen: the breaker tripped";
  if (r.health === "expired") return "past its last trading day";
  return null;
}

const ORDER: StepId[] = ["intro", "pick", "fees", "details", "review"];
const TITLE: Record<StepId, string> = {
  intro: "Intro",
  pick: "Choose an underlying",
  fees: "Fees",
  details: "Details",
  review: "Launch",
};

/**
 * The asset's own logo, or a stable tint when it has none.
 *
 * Index-grade underlyings have nothing behind them to carry a mark, so the
 * initial on a colour derived from the id is the honest fallback: it is
 * consistent between renders and between sessions, and it never implies a
 * brand that does not exist.
 */
function Avatar({ id, icon: fetched, size = 38 }: { id: string; icon?: string; size?: number }) {
  // Order matters and is resolved HERE rather than at each call site, so no
  // caller can get it wrong: the mark we ship, then whatever Jupiter has for
  // the tokenised asset, then the initials.
  const icon = localIcon(id) ?? fetched;
  return <span className="wiz-avatar" style={{ width: size, height: size, background: icon ? "transparent" : tint(id) }}>
    {icon
      // eslint-disable-next-line @next/next/no-img-element
      ? <img alt="" src={icon} width={size} height={size}/>
      : <i>{id.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase()}</i>}
  </span>;
}

/* ------------------------------------------------------------------ step 1 */

function Intro({ rows, onNext }: { rows: Row[] | null; onNext: () => void }) {
  const ready = rows !== null;
  const n = rows ? launchable(rows).length : null;
  const orbit = useMemo(() => rows ? launchable(rows).slice(0, 8) : [], [rows]);
  const icons = useIcons(orbit.map((row) => row.assetMint));
  return <div className="wiz-intro">
    <h1>Launch on a real underlying</h1>
    <p className="wiz-sub">Anchor a token to something that already has a price.</p>
    <ol className="wiz-steps">
      <li><span>1</span>Pick an underlying</li>
      <li><span>2</span>Launch a new token on top of it</li>
    </ol>
    <p className="wiz-note">
      {n === null
        ? "Reading the registry."
        : `${n} underlyings are ready for a launch today.`}
    </p>
    <div className="wiz-orbit" aria-label="Available underlyings">
      {orbit.map((row) => <Avatar id={row.id} icon={icons[row.assetMint ?? ""]} key={row.id} size={52}/>) }
    </div>
    <button className="wiz-cta" disabled={!ready} onClick={onNext} type="button">
      {ready ? "CHOOSE AN UNDERLYING" : "READING THE REGISTRY…"}
    </button>
  </div>;
}

/* ------------------------------------------------------------------ step 2 */

function Pick({ rows, onPick }: { rows: Row[] | null; onPick: (r: Row) => void }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  // EVERY underlying, not only the ones with a tokenised asset. Hiding the
  // index-grade half read as "we do not have those": the apples and Drake and
  // the rest vanished from this page entirely. They launch too, quoted in
  // USDC, and the card says which pool each one gets.
  const all = useMemo(() => (rows ? [...rows].sort((a, b) => {
    if ((b.price > 0) !== (a.price > 0)) return b.price > 0 ? 1 : -1;
    if (a.hard !== b.hard) return a.hard ? -1 : 1;
    return a.id.localeCompare(b.id);
  }) : []), [rows]);
  const canLaunch = useMemo(() => (rows ? launchable(rows) : []), [rows]);
  const icons = useIcons(all.map((r) => r.assetMint));

  const cats = useMemo(() => {
    const n = new Map<string, number>();
    for (const r of all) n.set(r.category, (n.get(r.category) ?? 0) + 1);
    return [...n.entries()].sort((a, b) => b[1] - a[1]);
  }, [all]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter((r) => {
      if (cat === "__priced") { if (r.price <= 0) return false; }
      else if (cat && r.category !== cat) return false;
      return !needle || `${r.id} ${r.name} ${r.category} ${r.unit}`.toLowerCase().includes(needle);
    });
  }, [all, q, cat]);

  // Quick pick is the deepest markets rather than a hand-picked list: the
  // ones a launch is least likely to be stranded on.
  const quick = useMemo(() => canLaunch.filter((r) => !r.attested).slice(0, 3), [canLaunch]);
  const moved = useMemo(
    () => [...all].filter((r) => r.devBps !== 0).sort((a, b) => Math.abs(b.devBps) - Math.abs(a.devBps)).slice(0, 3),
    [all]
  );
  const browsing = !q.trim() && cat === null;
  const themes = useMemo(() => cats.slice(0, 4).map(([category, count]) => ({
    category,
    count,
    rows: all.filter((row) => row.category === category).slice(0, 3),
  })), [all, cats]);
  const featured = useMemo(() => canLaunch.slice(3, 9), [canLaunch]);

  return <div className="wiz-pick">
    <h2>Pick your underlying</h2>
    <p className="wiz-sub">Your launch is priced in it.</p>

    <label className="wiz-search"><MagnifyingGlass/>
      <input onChange={(e) => setQ(e.target.value)} placeholder={`Search ${all.length} underlyings`} value={q}/>
    </label>

    {rows === null ? <p className="wiz-empty">Reading the registry…</p> : null}

    {browsing && quick.length > 0 ? <>
      <div className="wiz-row-head"><b>Quick pick</b><span>Click to select</span></div>
      <div className="wiz-quick">{quick.map((r) => <button className="wiz-quick-card" key={r.id} onClick={() => onPick(r)} type="button">
        <Avatar id={r.id} icon={icons[r.assetMint ?? ""]}/>
        <div><b>{r.id}</b><small>{r.name}</small></div>
      </button>)}</div>
    </> : null}

    {browsing && themes.length > 0 ? <>
      <div className="wiz-row-head"><b>Themes</b><span>Browse categories</span></div>
      <div className="wiz-themes">{themes.map((theme) => <button key={theme.category} onClick={() => setCat(theme.category)} type="button">
        <span className="wiz-theme-icons">{theme.rows.map((row) => <Avatar id={row.id} icon={icons[row.assetMint ?? ""]} key={row.id} size={36}/>)}</span>
        <b>{theme.category}</b><small>{theme.count} underlyings</small>
      </button>)}</div>
    </> : null}

    {browsing && moved.length > 0 ? <>
      <div className="wiz-row-head"><b>Trending</b><span>Latest accepted move</span></div>
      <ol className="wiz-trending">{moved.map((r, i) => <li key={r.id}>
        <button onClick={() => onPick(r)} type="button">
          <span className="wiz-rank">{i + 1}</span>
          <Avatar id={r.id} icon={icons[r.assetMint ?? ""]} size={30}/>
          <div><b>{r.id}</b><small>{r.name}</small></div>
          <em className={r.devBps >= 0 ? "up" : "down"}>{r.devBps >= 0 ? "+" : "-"}{Math.abs(r.devBps / 100).toFixed(1)}%</em>
        </button>
      </li>)}</ol>
    </> : null}

    {browsing && featured.length > 0 ? <>
      <div className="wiz-row-head"><b>Available now</b><span>{featured.length}</span></div>
      <div className="wiz-featured">{featured.map((r) => <button key={r.id} onClick={() => onPick(r)} type="button">
        <Avatar id={r.id} icon={icons[r.assetMint ?? ""]} size={44}/>
        <div><b>{r.id}</b><small>{r.name}</small></div>
      </button>)}</div>
    </> : null}

    <div className="wiz-row-head"><b>{q.trim() ? "Search results" : cat ? cat : "All underlyings"}</b>
      {cat ? <button className="wiz-clear-theme" onClick={() => setCat(null)} type="button">See all</button> : <span>A–Z</span>}
    </div>
    {rows !== null && shown.length === 0 ? <p className="wiz-empty">Nothing matches.</p> : null}
    <div className="wiz-market-list">{shown.map((r) => {
      const stop = blocker(r);
      return <button className={`wiz-card${stop ? " warn" : ""}`} key={r.id} onClick={() => onPick(r)} type="button">
        <Avatar id={r.id} icon={icons[r.assetMint ?? ""]} size={32}/>
        <div className="wiz-card-id"><b>{r.id}</b><small>{r.name}</small></div>
        <span className="wiz-market-price">{stop ?? `${formatPrice(r.price)} / ${r.unit}`}</span>
      </button>;
    })}</div>
  </div>;
}

/* ------------------------------------------------------------------ step 3 */

function Fees({ picked, icon, address, onNext }: { picked: Row; icon?: string; address: string | null; onNext: () => void }) {
  return <div className="wiz-fees">
    <h2>{picked.id} launch fees</h2>
    <p className="wiz-sub">How fees work on a launch anchored to {picked.id}</p>

    <div className="wiz-fee-art"><Avatar id={picked.id} icon={icon} size={92}/></div>

    <p className="wiz-fee-lead">
      Every trade on your token pays a flat <b>{LAUNCH_FEE_BPS / 100}% fee</b>.
    </p>


    <div className="wiz-fee-split">
      <div><b>1%</b><span>on every trade, in USDC, for the life of the curve</span></div>
    </div>

    <p className="wiz-note">
      This is not a setting. `create_pool` points `fee_claimer` at the market PDA rather than at a person,
      which is what makes fees claimable by holders at all. Pointing it anywhere else produces a launch that
      looks complete while the fees reach nobody.
    </p>

    {address
      ? <div className="wiz-kv wiz-as"><span>Launching as</span><b className="mono">{address.slice(0, 4)}…{address.slice(-4)}</b></div>
      : <p className="wiz-warn">No wallet connected. You can look, but not launch.</p>}

    <button className="wiz-cta" onClick={onNext} type="button">CONTINUE</button>
  </div>;
}

/* ------------------------------------------------------------------ step 4 */

function Details(props: {
  name: string; setName: (v: string) => void;
  ticker: string; setTicker: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  preview: string | null; onImage: (e: ChangeEvent<HTMLInputElement>) => void;
  social: string; setSocial: (v: string) => void;
  devBuy: string; setDevBuy: (v: string) => void;
  onNext: () => void;
}) {
  const ready = Boolean(props.name.trim() && props.ticker.trim());
  return <div className="wiz-details">
    <h2>Name your token</h2>
    <p className="wiz-sub">This is how it shows up everywhere.</p>

    {/* The live card, so the thing being named is visible while naming it. */}
    <div className="wiz-live">
      <span className="wiz-live-art">{props.preview
        // eslint-disable-next-line @next/next/no-img-element
        ? <img alt="" src={props.preview}/>
        : null}</span>
      <div><b>${props.ticker || "TICKER"}</b><small>{props.name || "Your token"}</small></div>
    </div>

    <label className="wiz-field">Ticker
      <input maxLength={10} onChange={(e) => props.setTicker(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder="" value={props.ticker}/>
    </label>
    <label className="wiz-field">Name
      <input maxLength={32} onChange={(e) => props.setName(e.target.value)} placeholder="" value={props.name}/>
    </label>

    <div className="wiz-field">Image
      {/*
        A LABEL, not a button that calls input.click().
        The button version did nothing: the input carried `hidden`, which is
        display:none, and a programmatic click on it is unreliable and
        silently so. A label pointing at the input is the browser's own
        mechanism and needs no JavaScript at all. The input stays visually
        hidden rather than `hidden`, so it is still focusable by keyboard.
      */}
      <label className="wiz-upload" htmlFor="launch-image">
        {props.preview ? <><UploadSimple/> Change image</> : <><ImageSquare/> Upload image</>}
      </label>
      <input
        id="launch-image"
        className="wiz-file"
        accept="image/png,image/jpeg,image/webp"
        onChange={props.onImage}
        type="file"
      />
      {/* Said here rather than discovered after launching. */}
      <p className="wiz-warn small">Local preview only. Nothing on chain carries an image yet.</p>
    </div>

    <label className="wiz-field">Social links <em>optional</em>
      <div className="wiz-prefixed"><LinkSimple/>
        <input onChange={(e) => props.setSocial(e.target.value)} placeholder="Paste link — X, website…" value={props.social}/>
      </div>
    </label>

    <label className="wiz-field">Buy your own <em>optional</em>
      <div className="wiz-prefixed"><span className="wiz-prefix">$</span>
        <input
          inputMode="decimal"
          onChange={(e) => props.setDevBuy(e.target.value.replace(/[^0-9.]/g, ""))}
          placeholder="0"
          value={props.devBuy}
        />
      </div>
      <p className="wiz-warn small">In USDC, bought at the opening price in the same transaction. You need that much USDC already.</p>
    </label>

    <label className="wiz-field">Description <em>optional</em>
      <textarea maxLength={100} onChange={(e) => props.setDescription(e.target.value)} value={props.description}/>
      <span className="wiz-count">{props.description.length}/100</span>
    </label>

    <button className="wiz-cta" disabled={!ready} onClick={props.onNext} type="button">
      {ready ? "REVIEW LAUNCH" : "NAME IT AND GIVE IT A TICKER"}
    </button>
  </div>;
}

/* ------------------------------------------------------------------ step 5 */

function Review({
  picked, icon, name, ticker, preview, address, connected, busy, failure, result, onEdit,
}: {
  picked: Row; icon?: string; name: string; ticker: string; preview: string | null;
  address: string | null; connected: boolean; busy: boolean;
  failure: string | null; result: MeteoraLaunchResult | null;
  onEdit: (s: StepId) => void;
}) {
  if (result) {
    return <div className="wiz-done">
      <span className="wiz-tick"><Check weight="bold"/></span>
      <h2>${ticker} is live</h2>
      <p>Priced in {picked.name}.</p>
      <div className="launch-steps">{result.steps.map((st, i) => st.signature
        ? <a key={i} href={explorerUrl("tx", st.signature)} target="_blank" rel="noopener noreferrer">
            <Check weight="bold"/><span>{st.label}</span>
          </a>
        : <span key={i}><Check weight="bold"/><span>{st.label}</span></span>
      )}</div>
      <div className="launch-addresses">
        <a href={explorerUrl("address", result.mint)} target="_blank" rel="noopener noreferrer">token {result.mint.slice(0, 4)}…{result.mint.slice(-4)}</a>
      </div>
      <Link className="wiz-cta" href={`/token/${result.mint}`}>OPEN ${ticker}</Link>
    </div>;
  }

  return <div className="wiz-review">
    <h2>Ready to launch</h2>
    <p className="wiz-sub">One transaction and ${ticker || "your token"} is live.</p>

    <div className="wiz-label">Your token</div>
    <div className="wiz-rowcard">
      <span className="wiz-live-art">{preview
        // eslint-disable-next-line @next/next/no-img-element
        ? <img alt="" src={preview}/>
        : null}</span>
      <div><b>${ticker || "TICKER"}</b><small>{name || "unnamed"}</small></div>
      <button aria-label="Edit details" onClick={() => onEdit("details")} type="button"><PencilSimple/></button>
    </div>

    <div className="wiz-label">Anchored to</div>
    <div className="wiz-rowcard">
      <Avatar id={picked.id} icon={icon} size={44}/>
      <div><b>{picked.id}</b><small>{picked.name} · {formatPrice(picked.price)} per {picked.unit}</small></div>
      <button aria-label="Edit underlying" onClick={() => onEdit("pick")} type="button"><PencilSimple/></button>
    </div>

    <div className="wiz-label">Fees</div>
    <div className="wiz-rowcard plain">
      <div><b>1% a side</b><small>Flat, in USDC, the same on every launch.</small></div>
      <button aria-label="About fees" onClick={() => onEdit("fees")} type="button"><PencilSimple/></button>
    </div>

    <div className="wiz-label">The curve</div>
    <div className="wiz-note-box">
      <div className="wiz-kv"><span>Underlying</span><b>{picked.id}</b></div>
      <div className="wiz-kv"><span>Opening market cap</span><b>${INITIAL_MARKET_CAP_USD.toLocaleString()}</b></div>
      <div className="wiz-kv"><span>Graduates at</span><b>${MIGRATION_MARKET_CAP_USD.toLocaleString()}</b></div>
      <div className="wiz-kv"><span>Supply</span><b>{DEFAULT_SUPPLY.toLocaleString()}</b></div>
      <div className="wiz-kv"><span>Trades against</span><b>USDC</b></div>
      <div className="wiz-kv"><span>Fee</span><b>{LAUNCH_FEE_BPS / 100}% a side</b></div>
    </div>

    {address ? <div className="wiz-kv wiz-as"><span>Launching as</span><b className="mono">{address.slice(0, 4)}…{address.slice(-4)}</b></div> : null}
    {failure ? <p className="launch-failure">{failure}</p> : null}

    {connected
      ? <button className="wiz-cta" disabled={busy} type="submit">{busy ? "SIGNING…" : `LAUNCH $${ticker || "TOKEN"}`}</button>
      : <div className="wiz-connect"><ConnectButton className="wiz-cta" connectLabel="CONNECT A WALLET TO LAUNCH"/></div>}
  </div>;
}

/* ------------------------------------------------------------------- shell */

function LaunchWizard() {
  // Null until Privy has a wallet, which is exactly the "can you launch"
  // test.
  const signer = usePeardSigner();
  const params = useSearchParams();
  const router = useRouter();
  const { rows } = useRegistry();

  const [step, setStep] = useState<StepId>("intro");
  const [picked, setPicked] = useState<Row | null>(null);
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [social, setSocial] = useState("");
  const [devBuy, setDevBuy] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<MeteoraLaunchResult | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  // Arriving from a token page's "Launch on X" skips straight past the pick.
  const wanted = params.get("on");
  useEffect(() => {
    if (!rows || picked || !wanted) return;
    const hit = launchable(rows).find((r) => r.id.toUpperCase() === wanted.toUpperCase());
    if (!hit) return;
    let live = true;
    queueMicrotask(() => {
      if (!live) return;
      setPicked(hit);
      setStep("fees");
    });
    return () => { live = false; };
  }, [rows, picked, wanted]);

  // One lookup for the chosen underlying, so the fee and review screens can
  // show its mark without each re-running the fetch.
  const pickedIcons = useIcons([picked?.assetMint]);
  const pickedIcon = picked?.assetMint ? pickedIcons[picked.assetMint] : undefined;

  const idx = Math.max(0, ORDER.indexOf(step));
  const prev = ORDER[idx - 1] ?? null;
  const next = ORDER[idx + 1] ?? null;
  const goToStep = (target: StepId) => {
    setStep(target);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const onImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy || !picked || !signer) return;
    setFailure(null);
    setBusy(true);
    try {
      const r = await launchOnMeteora(signer, {
        name: name.trim(),
        symbol: ticker.trim(),
        pairablePda: picked.pda,
        devBuyUsdc: Number(devBuy) > 0 ? Number(devBuy) : undefined,
      });
      // Recorded against the mint, which is the one identifier that cannot
      // change. Everything that shows what a token was launched on reads it.
      recordAttachment({
        mint: r.mint,
        underlying: picked.id,
        config: r.config,
        name: name.trim(),
        symbol: ticker.trim(),
        at: Math.floor(Date.now() / 1000),
        creator: signer.publicKey.toBase58(),
      });
      setResult(r);
      // Straight to the token. The success card is the last thing anybody
      // wants to look at; the thing they just made is not.
      setTimeout(() => router.push(`/token/${r.mint}`), 1800);
    } catch (e) {
      // The program's own words. Anchor puts the code in the logs and the
      // prose in the message, and only the code is stable.
      const m = e instanceof Error ? e.message : String(e);
      const code = /Error Code: (\w+)/.exec(m)?.[1];
      setFailure(code ? `${code}: ${m.split("\n")[0]}` : m);
    } finally {
      setBusy(false);
    }
  };

  return <main className={`${launchFont.variable} launch-shell`}>
    <div className="launch-halo halo-one"/><div className="launch-halo halo-two"/><div className="launch-halo halo-three"/>
    <section className="launch-main">
      <div className="launch-canvas">
      <header className="launch-focus-header">
        <Link className="launch-wordmark" href="/">peard</Link>
        <div className="launch-focus-actions">
          <span className="launch-chain"><i/> Solana</span>
          <ConnectButton/>
        </div>
      </header>

      <form className="wiz" onSubmit={onSubmit}>
        <div className="wiz-chrome">
          {prev && !result
            ? <button className="wiz-back" onClick={() => goToStep(prev)} type="button"><CaretLeft/> {TITLE[prev]}</button>
            : <Link className="wiz-back" href="/"><CaretLeft/> Back</Link>}
          {next && !result ? <span className="wiz-next">{TITLE[next]} <CaretRight/></span> : null}
        </div>
        <div className="wiz-rail"><i style={{ width: `${((idx + 1) / ORDER.length) * 100}%` }}/></div>

        {step === "intro" ? <Intro rows={rows} onNext={() => goToStep("pick")}/> : null}
        {step === "pick" ? <Pick rows={rows} onPick={(r) => { setPicked(r); goToStep("fees"); }}/> : null}
        {step === "fees" && picked ? <Fees picked={picked} icon={pickedIcon} address={signer?.publicKey.toBase58() ?? null} onNext={() => goToStep("details")}/> : null}
        {step === "details" ? <Details
          name={name} setName={setName} ticker={ticker} setTicker={setTicker}
          description={description} setDescription={setDescription}
          preview={preview} onImage={onImage}
          social={social} setSocial={setSocial}
          devBuy={devBuy} setDevBuy={setDevBuy}
          onNext={() => goToStep("review")}/> : null}
        {step === "review" && picked ? <Review
          picked={picked} icon={pickedIcon} name={name} ticker={ticker} preview={preview}
          address={signer?.publicKey.toBase58() ?? null}
          connected={Boolean(signer)} busy={busy} failure={failure} result={result}
          onEdit={goToStep}/> : null}
      </form>
      </div>
    </section>
  </main>;
}

/**
 * `useSearchParams` opts a route out of static prerender unless it sits under
 * a Suspense boundary, and the build refuses rather than shipping a page that
 * bails to client rendering silently.
 */
export default function LaunchPage() {
  return <Suspense fallback={<main className="launch-shell"/>}><LaunchWizard/></Suspense>;
}
