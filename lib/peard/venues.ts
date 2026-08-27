/* eslint-disable @typescript-eslint/no-explicit-any --
 * Same reason as chain.ts: the borsh coder decodes off a runtime IDL and has
 * no static type. Ported verbatim, and the arithmetic below mirrors the
 * programs' integer maths in bigint. Do not re-derive it. */
import { Buffer } from "buffer";
import { BorshAccountsCoder } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { conn } from "./chain";
import { serial, share } from "./queue";
import peardPerpsIdl from "./idl/peard_perps.json";
import peardAmmIdl from "./idl/peard_amm.json";

/**
 * The two venues, read the same way `chain.ts` reads the registry.
 *
 * Same bare-coder choice and for the same reason: no Provider, no wallet, no
 * indexer, just `getProgramAccounts` and borsh. The difference is that every
 * number here is kept as a **bigint** rather than divided into a float on the
 * way out.
 *
 * That is not fussiness. A perp's quote reserve is a u128 of USD e6 and a
 * pool's invariant is `quote_total * base_reserve`, which for the live SOL
 * pool is 2.8e23 - past `Number.MAX_SAFE_INTEGER` by five orders of
 * magnitude. Quoting a trade in floats and quoting it on chain would then
 * disagree, and the UI would be previewing a fill nobody can get. So the
 * curve maths below is the program's maths, in the program's integers, and a
 * float is only ever made at the last step for the sake of a label.
 */

const CONTANGO_ID = new PublicKey((peardPerpsIdl as any).address);
const QUOTEBOOK_ID = new PublicKey((peardAmmIdl as any).address);

const contangoCoder = new BorshAccountsCoder(peardPerpsIdl as any);
const quotebookCoder = new BorshAccountsCoder(peardAmmIdl as any);

/** Shared scales, spelled exactly as `programs/contango/src/state.rs` has them. */
export const USD_ONE = 1_000_000n;
export const BASE_ONE = 1_000_000_000n;
export const FUNDING_ONE = 1_000_000_000_000n;
export const BPS = 10_000n;

function disc(idl: any, name: string): string {
  const acc = idl.accounts?.find((a: any) => a.name === name);
  if (!acc?.discriminator) throw new Error(`no discriminator for ${name}`);
  return Buffer.from(acc.discriminator).toString("base64");
}

const big = (v: any): bigint => BigInt(v.toString());
const num = (v: any): number => Number(v.toString());
const str = (bytes: number[] | Uint8Array) =>
  Buffer.from(bytes).toString("utf8").replace(/\0+$/, "");

/* ------------------------------------------------------------- path A: perp */

export interface Perp {
  pda: string;
  pairable: string;
  /** Cached on the market, so a synced price cannot be swapped for another. */
  pairableId: string;
  authority: string;
  /** Virtual. Nobody deposited these and nobody owns a share of them. */
  baseReserve: bigint;
  quoteReserve: bigint;
  k: bigint;
  indexPrice: bigint;
  indexTs: number;
  maxIndexAgeSecs: number;
  cumulativeFunding: bigint;
  lastFundingTs: number;
  fundingIntervalSecs: number;
  maxFundingBps: number;
  longBase: bigint;
  shortBase: bigint;
  maxOpenBase: bigint;
  collateralTotal: bigint;
  badDebt: bigint;
  feesUsd: bigint;
  feeBps: number;
  maintenanceMarginBps: number;
  initialMarginBps: number;
  liquidationFeeBps: number;
  maxDivergenceBps: number;
  halted: boolean;
  settled: boolean;
  settledPrice: bigint;
  settledTs: number;
  /** All-zero pubkey means nobody has put a reserve behind this market. */
  backing: string;
  /** The reserve's marked value, USD e6, as the attestation last stated it. */
  backingValueUsd: bigint;
  /** The attestation's own `as_of`, not when the market last synced it. */
  backingAsOf: number;
  backingMaxAgeSecs: number;
}

export interface PerpPosition {
  pda: string;
  owner: string;
  market: string;
  /** Signed, 9dp. Positive long, negative short, zero flat. */
  baseSize: bigint;
  quoteEntry: bigint;
  collateral: bigint;
  fundingSnapshot: bigint;
  realizedPnl: bigint;
}

export interface PerpGlobal {
  pda: string;
  admin: string;
  registryProgram: string;
  /** The one mint every position is collateralised and settled in. */
  usdMint: string;
  feeReceiver: string;
  marketCount: number;
}

function decodePerp(pda: PublicKey, data: Buffer): Perp {
  const m: any = contangoCoder.decode("Market", data);
  return {
    pda: pda.toBase58(),
    pairable: m.pairable.toBase58(),
    pairableId: str(m.pairable_id),
    authority: m.authority.toBase58(),
    baseReserve: big(m.base_reserve),
    quoteReserve: big(m.quote_reserve),
    k: big(m.k),
    indexPrice: big(m.index_price),
    indexTs: num(m.index_ts),
    maxIndexAgeSecs: m.max_index_age_secs,
    cumulativeFunding: big(m.cumulative_funding),
    lastFundingTs: num(m.last_funding_ts),
    fundingIntervalSecs: m.funding_interval_secs,
    maxFundingBps: m.max_funding_bps,
    longBase: big(m.long_base),
    shortBase: big(m.short_base),
    maxOpenBase: big(m.max_open_base),
    collateralTotal: big(m.collateral_total),
    badDebt: big(m.bad_debt),
    feesUsd: big(m.fees_usd),
    feeBps: m.fee_bps,
    maintenanceMarginBps: m.maintenance_margin_bps,
    initialMarginBps: m.initial_margin_bps,
    liquidationFeeBps: m.liquidation_fee_bps,
    maxDivergenceBps: m.max_divergence_bps,
    halted: m.halted,
    settled: m.settled,
    settledPrice: big(m.settled_price),
    settledTs: num(m.settled_ts),
    backing: m.backing.toBase58(),
    backingValueUsd: big(m.backing_value_usd),
    backingAsOf: num(m.backing_as_of),
    backingMaxAgeSecs: m.backing_max_age_secs,
  };
}

function decodePerpPosition(pda: PublicKey, data: Buffer): PerpPosition {
  const p: any = contangoCoder.decode("Position", data);
  return {
    pda: pda.toBase58(),
    owner: p.owner.toBase58(),
    market: p.market.toBase58(),
    baseSize: big(p.base_size),
    quoteEntry: big(p.quote_entry),
    collateral: big(p.collateral),
    fundingSnapshot: big(p.funding_snapshot),
    realizedPnl: big(p.realized_pnl),
  };
}

/* -------------------------------------------------------------- path B: pool */

export interface Pool {
  pda: string;
  baseMint: string;
  quoteMint: string;
  creator: string;
  /** A pricedin market's reward vault. The whole join between the programs. */
  feeClaimer: string;
  /** Base tokens still on the curve, stored rather than measured. */
  baseReserve: bigint;
  /** Real quote the pool actually holds, excluding accrued fees. */
  quoteReserve: bigint;
  /** The leg nobody deposited. Shapes the curve; is not money. */
  virtualQuote: bigint;
  feesQuote: bigint;
  feesQuoteLifetime: bigint;
  volumeQuoteLifetime: bigint;
  swaps: number;
  /** What the issuer took out of the vault. Never a rounding counter. */
  shortfallQuoteLifetime: bigint;
  shortfallBaseLifetime: bigint;
  feeBps: number;
  baseDecimals: number;
  quoteDecimals: number;
}

function decodePool(pda: PublicKey, data: Buffer): Pool {
  const p: any = quotebookCoder.decode("Pool", data);
  return {
    pda: pda.toBase58(),
    baseMint: p.base_mint.toBase58(),
    quoteMint: p.quote_mint.toBase58(),
    creator: p.creator.toBase58(),
    feeClaimer: p.fee_claimer.toBase58(),
    baseReserve: big(p.base_reserve),
    quoteReserve: big(p.quote_reserve),
    virtualQuote: big(p.virtual_quote),
    feesQuote: big(p.fees_quote),
    feesQuoteLifetime: big(p.fees_quote_lifetime),
    volumeQuoteLifetime: big(p.volume_quote_lifetime),
    swaps: num(p.swaps),
    shortfallQuoteLifetime: big(p.shortfall_quote_lifetime),
    shortfallBaseLifetime: big(p.shortfall_base_lifetime),
    feeBps: p.fee_bps,
    baseDecimals: p.base_decimals,
    quoteDecimals: p.quote_decimals,
  };
}

/* -------------------------------------------------------------------- loads */

export interface Venues {
  perps: Perp[];
  perpPositions: PerpPosition[];
  perpGlobal: PerpGlobal | null;
  pools: Pool[];
  /** Which venue programs are actually executable on this cluster. */
  deployed: { contango: boolean; quotebook: boolean };
  /**
   * Whether that has been established yet.
   *
   * Without this the empty state claimed "contango is not deployed on this
   * cluster" during the second before the first scan returned, which is a
   * false statement about somebody's deployment rendered in the same
   * styling as a true one. Not knowing yet is its own state and says so.
   */
  checked: boolean;
}

export const EMPTY_VENUES: Venues = {
  perps: [],
  perpPositions: [],
  perpGlobal: null,
  pools: [],
  deployed: { contango: false, quotebook: false },
  checked: false,
};

/**
 * Everything both venues hold, in four filtered `getProgramAccounts` calls.
 *
 * A program that is not deployed here is reported as absent rather than as
 * an empty venue: "no markets" and "no program" are different sentences and
 * only one of them is the operator's problem.
 */
export function loadVenues(): Promise<Venues> {
  return share("venues", readVenues);
}

async function readVenues(): Promise<Venues> {
  const scan = (id: PublicKey, idl: any, name: string) =>
    serial(() =>
      conn.getProgramAccounts(id, {
        filters: [{ memcmp: { offset: 0, bytes: disc(idl, name), encoding: "base64" } }],
      })
    );

  const [infos, mk, po, gl, pl] = await Promise.all([
    conn.getMultipleAccountsInfo([CONTANGO_ID, QUOTEBOOK_ID]),
    scan(CONTANGO_ID, peardPerpsIdl, "Market"),
    scan(CONTANGO_ID, peardPerpsIdl, "Position"),
    scan(CONTANGO_ID, peardPerpsIdl, "Global"),
    scan(QUOTEBOOK_ID, peardAmmIdl, "Pool"),
  ]);

  const g: any = gl[0] ? contangoCoder.decode("Global", gl[0].account.data as Buffer) : null;
  return {
    perps: mk
      .map((a) => decodePerp(a.pubkey, a.account.data as Buffer))
      .sort((x, y) => x.pairableId.localeCompare(y.pairableId)),
    perpPositions: po.map((a) => decodePerpPosition(a.pubkey, a.account.data as Buffer)),
    perpGlobal: g && {
      pda: gl[0].pubkey.toBase58(),
      admin: g.admin.toBase58(),
      registryProgram: g.registry_program.toBase58(),
      usdMint: g.usd_mint.toBase58(),
      feeReceiver: g.fee_receiver.toBase58(),
      marketCount: g.market_count,
    },
    pools: pl.map((a) => decodePool(a.pubkey, a.account.data as Buffer)),
    deployed: {
      contango: Boolean(infos[0]?.executable),
      quotebook: Boolean(infos[1]?.executable),
    },
    checked: true,
  };
}

/* ---------------------------------------------------------------- perp maths */

/** Ceil division, the way `u128::div_ceil` does it. */
export function ceilDiv(n: bigint, d: bigint): bigint {
  if (d === 0n) return 0n;
  return (n + d - 1n) / d;
}

/** Mark, USD e6 per base unit. `Market::mark_price` verbatim. */
export function mark(m: Perp): bigint {
  if (m.baseReserve === 0n) return 0n;
  return (m.quoteReserve * BASE_ONE) / m.baseReserve;
}

/** Signed gap between mark and index, in bps. Truncates toward zero, as i128 does. */
export function divergenceBps(m: Perp): number {
  if (m.indexPrice === 0n) return 0;
  return Number(((mark(m) - m.indexPrice) * BPS) / m.indexPrice);
}

/**
 * The funding rate one crank would charge, bps of notional, signed.
 *
 * Identical to `settle_funding`: the divergence, clamped by the market's own
 * ceiling. Positive means the mark sits above the index, and a long pays.
 * Reading the rate off the clamp rather than off the raw gap matters here -
 * the live markets cap at 100bps and several sit well past that, so the
 * unclamped number would overstate every payment by a factor of two.
 */
export function fundingBps(m: Perp): number {
  const cap = m.maxFundingBps;
  return Math.max(-cap, Math.min(cap, divergenceBps(m)));
}

/** Whether the clamp is doing the work, which is worth saying out loud. */
export function fundingClamped(m: Perp): boolean {
  return Math.abs(divergenceBps(m)) > m.maxFundingBps;
}

export type FundingSide = "longs" | "shorts" | "nobody";

/** Who pays whom, as a side rather than as a sign. */
export function fundingPayer(m: Perp): FundingSide {
  const f = fundingBps(m);
  if (f > 0) return "longs";
  if (f < 0) return "shorts";
  return "nobody";
}

/** The same fact in words, because a signed bps figure is not a sentence. */
export function fundingSentence(m: Perp): string {
  const f = fundingBps(m);
  const per = intervalLabel(m.fundingIntervalSecs);
  if (f === 0) {
    return `Mark is level with the index, so nobody pays. Funding only moves when the curve drifts off the print.`;
  }
  const rate = `${(Math.abs(f) / 100).toFixed(3)}% of notional per ${per}`;
  return f > 0
    ? `Mark is above the index, so LONGS PAY SHORTS ${rate}. That payment is what makes somebody want the other side without anyone arranging it.`
    : `Mark is below the index, so SHORTS PAY LONGS ${rate}. That payment is what makes somebody want the other side without anyone arranging it.`;
}

export function intervalLabel(secs: number): string {
  if (secs % 86400 === 0) return secs === 86400 ? "day" : `${secs / 86400}d`;
  if (secs % 3600 === 0) return secs === 3600 ? "hour" : `${secs / 3600}h`;
  if (secs % 60 === 0) return `${secs / 60}m`;
  return `${secs}s`;
}

/** Funding as an annualised percentage, for comparison against anything else. */
export function fundingApr(m: Perp): number {
  const perYear = (365 * 86400) / Math.max(1, m.fundingIntervalSecs);
  return (fundingBps(m) / 10_000) * perYear;
}

/** Seconds until the next crank is allowed. Negative means it is overdue. */
export function fundingDueIn(m: Perp, now = Date.now() / 1000): number {
  return m.lastFundingTs + m.fundingIntervalSecs - now;
}

export function indexAge(m: Perp, now = Date.now() / 1000): number {
  return m.indexTs === 0 ? Infinity : now - m.indexTs;
}

/**
 * Whether the index may still be used to move value.
 *
 * `Market::index_ok`, and it gates more than it looks like it does: funding,
 * opens AND liquidation all refuse a stale index, so a market in this state
 * is frozen rather than merely unpriced.
 */
export function indexOk(m: Perp, now = Date.now() / 1000): boolean {
  if (m.indexPrice === 0n || m.indexTs === 0) return false;
  return m.maxIndexAgeSecs === 0 || now - m.indexTs <= m.maxIndexAgeSecs;
}

const DEFAULT_PUBKEY = "11111111111111111111111111111111";

/** Whether anyone has put a real reserve behind this market. `Market::is_backed`. */
export function isBacked(m: Perp): boolean {
  return m.backing !== DEFAULT_PUBKEY;
}

/**
 * Whether the reserve attestation is fresh enough to open against.
 *
 * `Market::backing_ok`, and deliberately the same shape as `index_ok`: it
 * gates OPENING only. A holder can always close, because a reserve nobody
 * has marked lately is a reason to stop taking new risk and never a reason
 * to trap the risk already taken.
 */
export function backingOk(m: Perp, now = Date.now() / 1000): boolean {
  if (m.backingAsOf <= 0) return false;
  return m.backingMaxAgeSecs === 0 || now - m.backingAsOf <= m.backingMaxAgeSecs;
}

/** `Market::backing_cap_base`: the reserve's dollars, priced into base units. */
export function backingCapBase(m: Perp): bigint | null {
  if (m.indexPrice === 0n) return null;
  return (m.backingValueUsd * BASE_ONE) / m.indexPrice;
}

/**
 * The open-interest ceiling actually in force per side, base units.
 *
 * `Market::effective_open_cap`. An unbacked market is bounded by
 * `max_open_base` alone, which is every market today. A backed one takes the
 * LOWER of that and what the reserve stands behind, so declaring backing can
 * only tighten a market. `null` is the program's `None`: a backed market
 * whose attestation has gone stale, or whose index is unusable, refuses to
 * open at all and `open_position` returns `BackingUnusable`.
 */
export function effectiveOpenCap(m: Perp, now = Date.now() / 1000): bigint | null {
  if (!isBacked(m)) return m.maxOpenBase;
  if (!backingOk(m, now)) return null;
  const fromBacking = backingCapBase(m);
  if (fromBacking === null) return null;
  return fromBacking < m.maxOpenBase ? fromBacking : m.maxOpenBase;
}

export type PerpState =
  | "live"
  | "halted"
  | "settled"
  | "index stale"
  | "backing stale"
  | "diverged";

export function perpState(m: Perp, now = Date.now() / 1000): PerpState {
  if (m.settled) return "settled";
  if (m.halted) return "halted";
  if (!indexOk(m, now)) return "index stale";
  // A backed market with an unusable attestation refuses every open, which
  // is the same kind of fact as a diverged mark and belongs next to it.
  if (effectiveOpenCap(m, now) === null) return "backing stale";
  if (Math.abs(divergenceBps(m)) > m.maxDivergenceBps) return "diverged";
  return "live";
}

/** Notional of a base size at a price, USD e6. */
export function notional(base: bigint, price: bigint): bigint {
  return (absBig(base) * price) / BASE_ONE;
}

export const absBig = (v: bigint) => (v < 0n ? -v : v);

/** Open interest per side, valued at the index, USD e6. */
export function oiUsd(m: Perp): { long: bigint; short: bigint; cap: bigint } {
  // The ceiling in force rather than the configured one. A backed market
  // with a stale attestation has no headroom at all, which is zero.
  const cap = effectiveOpenCap(m);
  return {
    long: notional(m.longBase, m.indexPrice),
    short: notional(m.shortBase, m.indexPrice),
    cap: cap === null ? 0n : notional(cap, m.indexPrice),
  };
}

/** Imbalance as a fraction of the larger side, which is what funding chases. */
export function imbalanceFraction(m: Perp): number {
  const l = Number(m.longBase);
  const s = Number(m.shortBase);
  const total = l + s;
  if (total === 0) return 0;
  return (l - s) / total;
}

export interface Quoted {
  /** Base size asked for, 9dp. */
  size: bigint;
  /** Quote paid (long) or received (short), USD e6. */
  quote: bigint;
  /** Average fill, USD e6 per unit. */
  entry: bigint;
  /** How far the fill sits from the pre-trade mark, bps. Always a cost. */
  impactBps: number;
  /** Opening fee, USD e6. */
  fee: bigint;
  /** Collateral the margin check demands, before the fee. */
  marginRequired: bigint;
  /** Reserves the trade would leave behind. */
  newBase: bigint;
  newQuote: bigint;
  /** Set when the curve, the OI cap or the divergence gate refuses it. */
  refusal: string | null;
}

/**
 * Price a hypothetical open against the curve, exactly as the program would.
 *
 * Long takes base off the curve and pays the quote the invariant demands;
 * short is the mirror. Both round the quote leg UP, because that is what
 * `div_ceil` does on chain and the remainder is the curve's, not the
 * trader's. Quoting this in floats would round the other way about half the
 * time and hand the trader a fill the program will not honour.
 */
export function quoteOpen(m: Perp, size: bigint, long: boolean): Quoted | null {
  if (size <= 0n || m.baseReserve === 0n) return null;
  const before = mark(m);
  let quote: bigint;
  let newBase: bigint;
  let newQuote: bigint;
  if (long) {
    newBase = m.baseReserve - size;
    if (newBase <= 0n) {
      return refused(size, before, "larger than the whole base leg of the curve");
    }
    newQuote = ceilDiv(m.k, newBase);
    quote = newQuote - m.quoteReserve;
  } else {
    newBase = m.baseReserve + size;
    newQuote = ceilDiv(m.k, newBase);
    if (newQuote > m.quoteReserve) {
      return refused(size, before, "larger than the whole quote leg of the curve");
    }
    quote = m.quoteReserve - newQuote;
  }
  if (quote <= 0n) return refused(size, before, "too small to move the curve by one unit");

  const entry = (quote * BASE_ONE) / size;
  // Both sides pay: a long fills above the mark, a short below it. Reported
  // unsigned so the column reads as a cost either way.
  const impactBps =
    before === 0n ? 0 : Number((absBig(entry - before) * BPS) / before);
  const fee = (quote * BigInt(m.feeBps)) / BPS;
  const marginRequired =
    (notional(size, m.indexPrice) * BigInt(m.initialMarginBps)) / BPS;

  const openBase = long ? m.longBase + size : m.shortBase + size;
  // `open_position` resolves the ceiling once and enforces it on both sides.
  // Backing can only ever lower it, so quoting against `max_open_base` alone
  // would preview a fill a backed market has already refused.
  const openCap = effectiveOpenCap(m);
  let refusal: string | null = null;
  if (openCap === null) {
    refusal = "the backing attestation is stale, so the market refuses new risk";
  } else if (openBase > openCap) {
    refusal = `past the ${long ? "long" : "short"} open-interest cap`;
  } else if (Math.abs(divergenceBps(m)) > m.maxDivergenceBps) {
    refusal = `mark has diverged past ${m.maxDivergenceBps}bps, so the market refuses new risk`;
  } else if (m.halted) {
    refusal = "the market is halted";
  } else if (m.settled) {
    refusal = "the market has settled";
  } else if (!indexOk(m)) {
    refusal = "the index is stale, so opens, funding and liquidation are all refused";
  }

  return { size, quote, entry, impactBps, fee, marginRequired, newBase, newQuote, refusal };
}

function refused(size: bigint, before: bigint, why: string): Quoted {
  return {
    size,
    quote: 0n,
    entry: before,
    impactBps: 0,
    fee: 0n,
    marginRequired: 0n,
    newBase: 0n,
    newQuote: 0n,
    refusal: why,
  };
}

/** Funding this position owes since it was last touched, USD e6. Positive pays. */
export function fundingOwed(p: PerpPosition, cumulative: bigint): bigint {
  const delta = cumulative - p.fundingSnapshot;
  if (delta === 0n || p.baseSize === 0n) return 0n;
  return (p.baseSize * delta) / ((FUNDING_ONE * BASE_ONE) / USD_ONE);
}

const U64_MAX = (1n << 64n) - 1n;

/**
 * Collateral after `apply_funding`, which is what the margin check then sees.
 *
 * The clamp is the whole point. The program pays funding out of at most the
 * collateral that exists and books the rest as `bad_debt`, then measures
 * equity with the funding term already zero. So a position owing more
 * funding than it holds lands on zero, NOT on a negative number, and
 * modelling it as `collateral - owed` makes a deeply behind position look
 * worse than the chain thinks it is: the liquidation price it draws is
 * unbounded where the chain caps a long at `entry / (1 - maintenance)`.
 *
 * The two agree exactly whenever owed is under collateral, which is every
 * position that has not lost its whole margin to funding.
 *
 * DUPLICATED ON PURPOSE. `relayer/src/liquidate.ts:260-267` holds the same
 * function for the liquidator bot. The app and the relayer are separate npm
 * packages with separate tsconfigs and no shared workspace, so there is
 * nowhere to put one copy. Change one and change the other.
 */
export function collateralAfterFunding(collateral: bigint, owed: bigint): bigint {
  if (owed === 0n) return collateral;
  if (owed > 0n) return owed >= collateral ? 0n : collateral - owed;
  const credit = -owed;
  // saturating_add, as the program does. Unreachable, and free to be right.
  return collateral + credit > U64_MAX ? U64_MAX : collateral + credit;
}

/** Unrealised profit, USD e6, signed. `state::unrealized_pnl` verbatim. */
export function unrealizedPnl(baseSize: bigint, quoteEntry: bigint, price: bigint): bigint {
  if (baseSize === 0n) return 0n;
  const value = (absBig(baseSize) * price) / BASE_ONE;
  return baseSize > 0n ? value - quoteEntry : quoteEntry - value;
}

export interface PositionView {
  long: boolean;
  size: bigint;
  entry: bigint;
  /** Marked against the index, because that is what the margin check uses. */
  pnl: bigint;
  funding: bigint;
  collateral: bigint;
  equity: bigint;
  notional: bigint;
  maintenance: bigint;
  /** Index price at which this becomes liquidatable, or null if it cannot be. */
  liqPrice: bigint | null;
  /** Signed fraction of the index price between here and there. */
  liqDistance: number | null;
  /** Effective leverage: notional over collateral. */
  leverage: number;
}

/**
 * A position, marked.
 *
 * Everything is measured against the INDEX rather than the mark, and that is
 * not a simplification: `liquidate` and both margin checks read
 * `market.index_price`, so a curve somebody just pushed around does not
 * decide who gets liquidated. Marking the panel to the mark would show a
 * liquidation distance the program does not use.
 */
export function viewPosition(p: PerpPosition, m: Perp): PositionView {
  const price = m.settled ? m.settledPrice : m.indexPrice;
  const size = absBig(p.baseSize);
  const long = p.baseSize > 0n;
  const funding = fundingOwed(p, m.cumulativeFunding);
  // What `apply_funding` leaves behind, which every margin check reads. The
  // clamp means funding can take the collateral to zero and no further.
  const paid = collateralAfterFunding(p.collateral, funding);
  const pnl = unrealizedPnl(p.baseSize, p.quoteEntry, price);
  // `account_equity(position.collateral, pnl, 0)`: funding is already out of
  // collateral by the time the program measures this, so it is not a term.
  const equity = paid + pnl;
  const n = notional(p.baseSize, price);
  const maintenance = (n * BigInt(m.maintenanceMarginBps)) / BPS;
  const mm = BigInt(m.maintenanceMarginBps);

  // Solve equity(P) = maintenance(P) for P, with `paid` standing in for the
  // collateral the chain will have left. Long: paid + sP - entry = sP * mm,
  // so P = (entry - paid) / (s * (1 - mm)). Short flips both signs and the
  // maintenance term lands on the other side. Because `paid` cannot go
  // below zero, a long's answer is capped at entry / (1 - mm) the way the
  // program's is, rather than running away with the funding owed.
  let liqPrice: bigint | null = null;
  if (size > 0n) {
    if (long) {
      const numer = (p.quoteEntry - paid) * BASE_ONE * BPS;
      const denom = size * (BPS - mm);
      liqPrice = numer <= 0n ? 0n : numer / denom;
    } else {
      const numer = (paid + p.quoteEntry) * BASE_ONE * BPS;
      const denom = size * (BPS + mm);
      liqPrice = numer <= 0n ? 0n : numer / denom;
    }
  }
  const liqDistance =
    liqPrice !== null && price > 0n
      ? Number(((long ? price - liqPrice : liqPrice - price) * BPS) / price) / 10_000
      : null;

  return {
    long,
    size,
    entry: size > 0n ? (p.quoteEntry * BASE_ONE) / size : 0n,
    pnl,
    funding,
    collateral: p.collateral,
    equity,
    notional: n,
    maintenance,
    liqPrice,
    liqDistance,
    leverage: p.collateral > 0n ? Number(n) / Number(p.collateral) : 0,
  };
}

/** Max leverage the market allows, from the initial margin. 10000bps is 1x. */
export function maxLeverage(m: Perp): number {
  return m.initialMarginBps > 0 ? 10_000 / m.initialMarginBps : 1;
}

/* ---------------------------------------------------------------- pool maths */

/** The pricing leg: real quote plus the leg nobody deposited. */
export function quoteTotal(p: Pool): bigint {
  return p.quoteReserve + p.virtualQuote;
}

/** Derived, never stored, so a write-down reprices the curve with no second number. */
export function poolK(p: Pool): bigint {
  return quoteTotal(p) * p.baseReserve;
}

/** Fraction of the pricing leg that is real money. Zero is a legal state. */
export function realFraction(p: Pool): number {
  const t = quoteTotal(p);
  return t === 0n ? 0 : Number((p.quoteReserve * 1_000_000n) / t) / 1_000_000;
}

/** Spot, in whole quote per whole base, decimal-adjusted for display. */
export function spotPrice(p: Pool): number {
  if (p.baseReserve === 0n) return 0;
  const q = Number(quoteTotal(p)) / 10 ** p.quoteDecimals;
  const b = Number(p.baseReserve) / 10 ** p.baseDecimals;
  return b === 0 ? 0 : q / b;
}

/**
 * The largest sale the pool can actually honour, in base units.
 *
 * `sell` refuses any fill whose gross output exceeds the REAL quote reserve,
 * because the virtual leg is not money. Solving that constraint gives
 * `base_reserve * quote_reserve / virtual_quote`, and it is the number that
 * says what the curve is really worth: the SOL pool quotes against 310 SOL
 * and can pay out 0.099 of them.
 */
export function maxSellableBase(p: Pool): bigint {
  if (p.virtualQuote === 0n) return p.baseReserve;
  return (p.baseReserve * p.quoteReserve) / p.virtualQuote;
}

export interface Swap {
  /** What goes in, base units of the input mint. */
  amountIn: bigint;
  /** What comes out, base units of the output mint. */
  amountOut: bigint;
  fee: bigint;
  /** Average fill, in whole quote per whole base. */
  execPrice: number;
  /** Spot before and after, same units. */
  spotBefore: number;
  spotAfter: number;
  /**
   * The curve's own move, bps, measured on the input the curve actually saw.
   *
   * Deliberately fee-free. The fee is a separate line on the same trade and
   * folding it in here made a 0.1% order on the live SOL pool read as
   * 111bps of "impact" when 100 of those basis points were the fee sitting
   * in its own column two cells away.
   */
  impactBps: number;
  /** What the trader is actually down against spot, fee included. */
  allInBps: number;
  /** Fraction of the base leg this trade takes, for a sanity check on size. */
  shareOfBase: number;
  refusal: string | null;
}

/**
 * Price a swap the way the program prices it, fee first on a buy and fee
 * last on a sell, ceil on the leg that stays behind.
 *
 * The asymmetry is not cosmetic: a buy takes its fee off the input before
 * the curve sees it, a sell takes it off the output after, so the same
 * notional pays a slightly different fee in each direction and a UI that
 * applied one rule to both would misquote one side.
 */
export function quoteSwap(p: Pool, amountIn: bigint, buy: boolean): Swap | null {
  if (amountIn <= 0n || p.baseReserve === 0n) return null;
  const before = spotPrice(p);
  const k = poolK(p);
  const qScale = 10 ** p.quoteDecimals;
  const bScale = 10 ** p.baseDecimals;

  if (buy) {
    const fee = (amountIn * BigInt(p.feeBps)) / BPS;
    const net = amountIn - fee;
    if (net <= 0n) return null;
    const q1 = quoteTotal(p) + net;
    const b1 = ceilDiv(k, q1);
    if (b1 >= p.baseReserve) {
      return {
        amountIn,
        amountOut: 0n,
        fee,
        execPrice: 0,
        spotBefore: before,
        spotAfter: before,
        impactBps: 0,
        allInBps: 0,
        shareOfBase: 0,
        refusal: "too small to move the curve by one base unit",
      };
    }
    const out = p.baseReserve - b1;
    const after = Number(q1) / qScale / (Number(b1) / bScale);
    const exec = Number(amountIn) / qScale / (Number(out) / bScale);
    const curve = Number(net) / qScale / (Number(out) / bScale);
    return {
      amountIn,
      amountOut: out,
      fee,
      execPrice: exec,
      spotBefore: before,
      spotAfter: after,
      impactBps: before > 0 ? Math.round(((curve - before) / before) * 10_000) : 0,
      allInBps: before > 0 ? Math.round(((exec - before) / before) * 10_000) : 0,
      shareOfBase: Number(out) / Number(p.baseReserve),
      refusal: null,
    };
  }

  const b1 = p.baseReserve + amountIn;
  const q1 = ceilDiv(k, b1);
  const total = quoteTotal(p);
  if (q1 >= total) {
    return {
      amountIn,
      amountOut: 0n,
      fee: 0n,
      execPrice: 0,
      spotBefore: before,
      spotAfter: before,
      impactBps: 0,
      allInBps: 0,
      shareOfBase: 0,
      refusal: "too small to move the curve by one quote unit",
    };
  }
  const gross = total - q1;
  if (gross > p.quoteReserve) {
    return {
      amountIn,
      amountOut: 0n,
      fee: 0n,
      execPrice: 0,
      spotBefore: before,
      spotAfter: before,
      impactBps: 0,
      allInBps: 0,
      shareOfBase: Number(amountIn) / Number(p.baseReserve),
      refusal:
        "refused on chain: the fill would draw on the virtual leg, and the virtual leg is not money",
    };
  }
  const fee = (gross * BigInt(p.feeBps)) / BPS;
  const out = gross - fee;
  const after = Number(q1) / qScale / (Number(b1) / bScale);
  const exec = Number(out) / qScale / (Number(amountIn) / bScale);
  const curve = Number(gross) / qScale / (Number(amountIn) / bScale);
  return {
    amountIn,
    amountOut: out,
    fee,
    execPrice: exec,
    spotBefore: before,
    spotAfter: after,
    impactBps: before > 0 ? Math.round(((before - curve) / before) * 10_000) : 0,
    allInBps: before > 0 ? Math.round(((before - exec) / before) * 10_000) : 0,
    shareOfBase: Number(amountIn) / Number(p.baseReserve),
    refusal: null,
  };
}

/* ------------------------------------------------------------------ helpers */

/** A fixed-point integer as a float. Only ever for a label. */
export function toFloat(v: bigint, decimals: number): number {
  return Number(v) / 10 ** decimals;
}

/** Base units for a typed decimal amount, without going through a float. */
export function toUnits(input: string, decimals: number): bigint {
  const s = input.trim();
  if (!/^\d*\.?\d*$/.test(s) || s === "" || s === ".") return 0n;
  const [whole, frac = ""] = s.split(".");
  const padded = (frac + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt(padded || "0");
}
