/* eslint-disable @typescript-eslint/no-explicit-any --
 * `BorshAccountsCoder` decodes against an IDL loaded at runtime, so what it
 * hands back has no static type and never can have: the shape is whatever the
 * JSON said. `any` is the honest annotation for that, and every one of them is
 * narrowed on the next line by a hand-written decoder that names each field.
 * Ported verbatim from ~/pricedin/app/src/lib; do not "fix" the types here
 * without changing the decoders, which is how field names silently become
 * undefined at runtime with no throw and no type error. */
import { Buffer } from "buffer";
import { BorshAccountsCoder } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { serial, share } from "./queue";
import idl from "./idl/peard.json";
import { RPC_URL } from "./config";

// web3.js expects Node's Buffer. Set before anything decodes.
(globalThis as any).Buffer = (globalThis as any).Buffer ?? Buffer;

export const PROGRAM_ID = new PublicKey((idl as any).address);
const coder = new BorshAccountsCoder(idl as any);

/**
 * Re-exported so every consumer names one endpoint.
 *
 * The Vite build read an `?rpc=` override off `location.search` at module
 * scope. Next evaluates this module during the server pass of a client
 * component, where there is no `location`, so the override moves to
 * `NEXT_PUBLIC_PRICEDIN_RPC` in `config.ts` and the module stays isomorphic.
 */
export { RPC_URL };

export const conn = new Connection(RPC_URL, "confirmed");

const UNIT = 1e9; // units, 9dp
const USD = 1e6; // USD e6, and USDC base units
const ROLL = 1e12;
const S = 1e6;

/**
 * Account discriminator, for a getProgramAccounts prefilter.
 *
 * Read straight off the IDL rather than recomputed from the name: since
 * Anchor 0.31 the IDL carries the bytes, so taking them from there cannot
 * drift from what the program actually writes.
 */
function disc(name: string): string {
  const acc = (idl as any).accounts?.find(
    (a: any) => a.name.toLowerCase() === name.toLowerCase()
  );
  if (!acc?.discriminator) throw new Error(`no discriminator for ${name} in the IDL`);
  return Buffer.from(acc.discriminator).toString("base64");
}

export type Grade = "hard" | "soft" | "index";
export type Terminal = "settle" | "roll";

export interface Pairable {
  pda: string;
  id: string;
  unit: string;
  grade: Grade;
  resolver: string;
  /** USD per unit, EMA-smoothed. This is what settles. */
  price: number;
  /** The last raw observation, before smoothing. Showing both makes the
   *  TWAP visible rather than something the chart does silently. */
  priceRaw: number;
  priceLastTs: number;
  frozen: boolean;
  expiresAt: number;
  terminal: Terminal;
  successor: string | null;
  assetMint: string | null;
  /** Sources the pairable is configured to median: a claim. */
  providerCount: number;
  /** Sources that agreed on the last accepted push: a receipt. */
  lastSourceCount: number;
  pushCount: number;
  breakerTrips: number;
  lastDevBps: number;
  breakerBps: number;
  maxPriceAgeSecs: number;
  twapWindowSecs: number;
  minPushIntervalSecs: number;
  marketCount: number;
  ships: boolean;
  delivery: "ship" | "voucher";
  minRequestUsd: number;
  maxRequestUsd: number;
}

export interface Market {
  pda: string;
  pairable: string;
  tokenMint: string;
  quoteMint: string;
  /** Whoever called `create_market`. What "my launches" filters on. */
  creator: string;
  quoteMode: "denominated" | "native";
  quoteDecimals: number;
  feeBps: number;
  /** The venue whose fees land here. Provenance only, never settled on. */
  pool: string | null;
  poolKind: "none" | "dbc" | "dammv2" | "other";
  /** Units-e9 owed, as a unit count. */
  unitsOutstanding: number;
  unitsCredited: number;
  unitsClaimed: number;
  unitsFulfilled: number;
  vault: number;
  reserved: number;
  protocolFees: number;
  totalEarning: number;
  rollIndex: number;
  rollCount: number;
  /** The reserve attestation this market names. Default means none. */
  backingAccount: string | null;
  backingValueUsd: number;
  backingAsOf: number;
  backingMaxAgeSecs: number;
}

export interface Position {
  pda: string;
  owner: string;
  market: string;
  earning: number;
  unitsOwed: number;
  unitsClaimed: number;
  usdcClaimed: number;
}

const str = (bytes: number[] | Uint8Array) =>
  Buffer.from(bytes).toString("utf8").replace(/\0+$/, "");

const enumKey = (v: any): string => (v ? Object.keys(v)[0].toLowerCase() : "");

/**
 * Field names come back snake_case.
 *
 * `BorshAccountsCoder` decodes straight off the IDL, and only the typed
 * `program.account.x.fetch()` path camelCases on the way out. Using the raw
 * coder keeps the app free of a Provider and a wallet just to read, and the
 * cost is spelling fields the way the IDL does.
 */

function decodePairable(pda: PublicKey, data: Buffer): Pairable {
  const p: any = coder.decode("Pairable", data);
  const none = PublicKey.default.toBase58();
  const successor = p.successor.toBase58();
  const asset = p.asset_mint.toBase58();
  return {
    pda: pda.toBase58(),
    id: str(p.id),
    unit: str(p.unit_label),
    grade: enumKey(p.grade) as Grade,
    resolver: enumKey(p.resolver),
    price: Number(p.price_twap) / USD,
    priceRaw: Number(p.price_last_raw) / USD,
    priceLastTs: Number(p.price_last_ts),
    frozen: p.frozen,
    expiresAt: Number(p.expires_at),
    terminal: enumKey(p.terminal) as Terminal,
    successor: successor === none ? null : successor,
    assetMint: asset === none ? null : asset,
    providerCount: p.provider_count,
    lastSourceCount: p.last_source_count,
    pushCount: Number(p.push_count),
    breakerTrips: p.breaker_trips,
    lastDevBps: p.last_dev_bps,
    breakerBps: p.params.breaker_bps,
    maxPriceAgeSecs: p.params.max_price_age_secs,
    twapWindowSecs: p.params.twap_window_secs,
    minPushIntervalSecs: p.params.min_push_interval_secs,
    marketCount: p.market_count,
    ships: p.fulfillment.enabled,
    delivery: enumKey(p.fulfillment.delivery) as "ship" | "voucher",
    minRequestUsd: Number(p.fulfillment.min_request_usd) / USD,
    maxRequestUsd: Number(p.fulfillment.max_request_usd) / USD,
  };
}

function decodeMarket(pda: PublicKey, data: Buffer): Market {
  const m: any = coder.decode("Market", data);
  const dec = 10 ** m.quote_decimals;
  return {
    pda: pda.toBase58(),
    pairable: m.pairable.toBase58(),
    tokenMint: m.token_mint.toBase58(),
    quoteMint: m.quote_mint.toBase58(),
    creator: m.creator.toBase58(),
    quoteMode: enumKey(m.quote_mode) as "denominated" | "native",
    quoteDecimals: m.quote_decimals,
    feeBps: m.fee_bps,
    pool: m.pool.toBase58() === PublicKey.default.toBase58() ? null : m.pool.toBase58(),
    poolKind: enumKey(m.pool_kind) as any,
    unitsOutstanding: Number(m.units_outstanding) / UNIT,
    unitsCredited: Number(m.units_credited_lifetime) / UNIT,
    unitsClaimed: Number(m.units_claimed_lifetime) / UNIT,
    unitsFulfilled: Number(m.units_fulfilled_lifetime) / UNIT,
    vault: Number(m.vault_usdc) / dec,
    reserved: Number(m.fulfillment_reserved_usdc) / dec,
    protocolFees: Number(m.protocol_fees_usdc) / dec,
    totalEarning: Number(m.total_earning_balance),
    rollIndex: Number(m.roll_index) / ROLL,
    rollCount: m.roll_count,
    backingAccount:
      m.backing.toBase58() === PublicKey.default.toBase58() ? null : m.backing.toBase58(),
    backingValueUsd: Number(m.backing_value_usd) / USD,
    backingAsOf: Number(m.backing_as_of),
    backingMaxAgeSecs: m.backing_max_age_secs,
  };
}

function decodePosition(pda: PublicKey, data: Buffer): Position {
  const p: any = coder.decode("Position", data);
  return {
    pda: pda.toBase58(),
    owner: p.owner.toBase58(),
    market: p.market.toBase58(),
    earning: Number(p.earning_balance),
    unitsOwed: Number(p.units_owed) / UNIT,
    unitsClaimed: Number(p.units_claimed_lifetime) / UNIT,
    usdcClaimed: Number(p.usdc_claimed_lifetime) / USD,
  };
}

/**
 * There is no indexer, so everything is a filtered getProgramAccounts.
 *
 * That is fine at this size and it keeps the app honest: what it draws is
 * chain state at a block, not a cache somebody else populated.
 */
export interface Snapshot {
  pairables: Pairable[];
  markets: Market[];
  positions: Position[];
  slot: number;
}

export function loadAll(): Promise<Snapshot> {
  // Shared, so StrictMode's double mount and an overlapping poll are one
  // sweep rather than two or three.
  return share("registry", readAll);
}

/**
 * The launch index only needs the registry entries and their markets.
 * Keeping this separate from `loadAll` avoids scanning every holder position
 * before the homepage can render.
 */
export function loadLaunchRegistry(): Promise<Pick<Snapshot, "pairables" | "markets">> {
  return share("launch-registry", async () => {
    const [pa, ma] = await Promise.all([
      serial(() =>
        conn.getProgramAccounts(PROGRAM_ID, {
          filters: [{ memcmp: { offset: 0, bytes: disc("Pairable"), encoding: "base64" } }],
        })
      ),
      serial(() =>
        conn.getProgramAccounts(PROGRAM_ID, {
          filters: [{ memcmp: { offset: 0, bytes: disc("Market"), encoding: "base64" } }],
        })
      ),
    ]);

    return {
      pairables: pa
        .map((account) => decodePairable(account.pubkey, account.account.data as Buffer))
        .sort((a, b) => a.id.localeCompare(b.id)),
      markets: ma.map((account) => decodeMarket(account.pubkey, account.account.data as Buffer)),
    };
  });
}

async function readAll(): Promise<Snapshot> {
  // Queued rather than fired together: `getProgramAccounts` is the method
  // public endpoints rate-limit hardest, and three of them plus the venues'
  // four arrive inside one tick otherwise. See `queue.ts`.
  const [pa, ma, po, slot] = await Promise.all([
    serial(() =>
      conn.getProgramAccounts(PROGRAM_ID, {
        filters: [{ memcmp: { offset: 0, bytes: disc("Pairable"), encoding: "base64" } }],
      })
    ),
    serial(() =>
      conn.getProgramAccounts(PROGRAM_ID, {
        filters: [{ memcmp: { offset: 0, bytes: disc("Market"), encoding: "base64" } }],
      })
    ),
    serial(() =>
      conn.getProgramAccounts(PROGRAM_ID, {
        filters: [{ memcmp: { offset: 0, bytes: disc("Position"), encoding: "base64" } }],
      })
    ),
    conn.getSlot(),
  ]);
  return {
    pairables: pa
      .map((a) => decodePairable(a.pubkey, a.account.data as Buffer))
      .sort((x, y) => x.id.localeCompare(y.id)),
    markets: ma.map((a) => decodeMarket(a.pubkey, a.account.data as Buffer)),
    positions: po.map((a) => decodePosition(a.pubkey, a.account.data as Buffer)),
    slot,
  };
}

/**
 * Vault money that actually backs holder claims.
 *
 * The protocol's accrued cut is excluded as well as the fulfilment reserve.
 * That cut was split off before any units were credited, so it never backed
 * a claim, and counting it would draw a coverage bar that drops the moment
 * governance sweeps. Mirrors `Market::holder_usdc` on chain: if these two
 * ever disagree the UI is lying about the one number that matters.
 */
function backing(m: Market): number {
  return m.vault - m.reserved - m.protocolFees;
}

/** Coverage, capped at 1. Native mode holds what it owes, so it is always 1. */
export function coverage(m: Market, p: Pairable): number {
  if (m.quoteMode === "native") return 1;
  const owed = m.unitsOutstanding * p.price;
  if (owed <= 0) return 1;
  return Math.min(1, backing(m) / owed);
}

/**
 * Backing worth counting, in dollars. Zero when unset or gone stale.
 *
 * Stale is zero rather than old on purpose: carry and spoilage only ever
 * push a reserve's value down, so a figure nobody has marked recently is a
 * figure that overstates itself.
 */
export function backingValue(m: Market, now = Date.now() / 1000): number {
  if (!m.backingAccount || m.backingAsOf === 0) return 0;
  if (m.backingMaxAgeSecs > 0 && now - m.backingAsOf > m.backingMaxAgeSecs) return 0;
  return m.backingValueUsd;
}

/**
 * Everything a claim is worth against, capped at 1.
 *
 * Deliberately NOT what a cash claim may draw on. Pears in a warehouse do
 * not pay dollars until somebody sells them, so folding backing into the
 * ratio that governs USDC payouts would let a market read fully covered
 * while holding no money. Mirrors `Market::total_coverage` on chain; if the
 * two ever disagree the UI is lying about the number the product turns on.
 */
export function totalCoverage(m: Market, p: Pairable): number {
  if (m.quoteMode === "native") return 1;
  const owed = m.unitsOutstanding * p.price;
  if (owed <= 0) return 1;
  return Math.min(1, (backing(m) + backingValue(m)) / owed);
}

/** Raw ratio, uncapped, so a healthy surplus is visible rather than clipped. */
export function coverageRaw(m: Market, p: Pairable): number {
  if (m.quoteMode === "native") return 1;
  const owed = m.unitsOutstanding * p.price;
  if (owed <= 0) return Infinity;
  return backing(m) / owed;
}

export type Health = "live" | "frozen" | "expired" | "stale" | "unpriced";

export function health(p: Pairable, now = Date.now() / 1000): Health {
  if (p.price <= 0) return "unpriced";
  if (p.frozen) return "frozen";
  // Expired is not stale: the last print is final and settles forever.
  if (p.expiresAt !== 0 && now >= p.expiresAt) return "expired";
  if (p.maxPriceAgeSecs > 0 && now - p.priceLastTs > p.maxPriceAgeSecs) return "stale";
  return "live";
}

export { S, UNIT, USD };
