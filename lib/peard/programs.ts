/* eslint-disable @typescript-eslint/no-explicit-any --
 * The IDLs are runtime JSON. Anchor 0.31+ reads the program id off
 * `idl.address` and the account discriminators off `idl.accounts[].
 * discriminator`, neither of which the JSON module type knows about. */
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import type { Transaction, VersionedTransaction } from "@solana/web3.js";
import { conn, USD, type Pairable } from "./chain";
import peardIdl from "./idl/peard.json";
import peardPerpsIdl from "./idl/peard_perps.json";
import peardAmmIdl from "./idl/peard_amm.json";

/**
 * Anchor's `Wallet`, structurally. Anchor's own is Node-only and drags fs in.
 *
 * Declared here rather than imported from the Vite app's `wallet.ts`: this
 * repo already has a wallet provider of its own under `components/wallet/`,
 * and a second one reading `window.solana` behind its back is two sources of
 * truth about who is connected. Whoever wires a write passes the signer in.
 */
type Signable = Transaction | VersionedTransaction;
export interface AnchorWallet {
  publicKey: PublicKey;
  signTransaction<T extends Signable>(tx: T): Promise<T>;
  signAllTransactions<T extends Signable>(txs: T[]): Promise<T[]>;
}

/**
 * The write side. Reads do not come through here.
 *
 * `chain.ts` decodes with a bare `BorshAccountsCoder` so the app can read
 * without a wallet, and the two paths spell the same IDL differently:
 *
 *     coder.decode("Pairable", data).price_twap     <- PascalCase, snake_case
 *     program.account.pairable.fetch(pda).priceTwap <- camelCase, camelCase
 *
 * Same file, two conventions, and the only warning either gives when you mix
 * them up is `undefined` at runtime - no throw, no type error, just a number
 * that quietly is not there. So: reads stay on the coder in `chain.ts`,
 * `Program` is used for building transactions and nothing else, and any
 * argument named here is camelCased because that is the side of the fence
 * this file is on.
 */

export type Venue = "peard" | "peard_perps" | "peard_amm";

const IDL: Record<Venue, any> = {
  peard: peardIdl,
  peard_perps: peardPerpsIdl,
  peard_amm: peardAmmIdl,
};

/** Taken from the IDL rather than typed out, so it cannot drift from the build. */
export const PROGRAM_ID: Record<Venue, PublicKey> = {
  peard: new PublicKey((peardIdl as any).address),
  peard_perps: new PublicKey((peardPerpsIdl as any).address),
  peard_amm: new PublicKey((peardAmmIdl as any).address),
};

export function providerFor(w: AnchorWallet): AnchorProvider {
  // `processed` would let the UI move sooner and lie sooner. Reads elsewhere
  // in the app are `confirmed`; a write that resolves ahead of them would
  // land the user on a page that does not show what they just did.
  return new AnchorProvider(conn, w, { commitment: "confirmed" });
}

export function programFor(venue: Venue, w?: AnchorWallet | null): Program {
  const wallet = w;
  if (!wallet) throw new Error("No connected wallet to sign with.");
  // Since 0.31 the program id is read off `idl.address`, so it is not passed.
  return new Program(IDL[venue] as any, providerFor(wallet));
}

/**
 * Whether a program is actually on this cluster.
 *
 * A launchpad that offers a button for a program that is not deployed is
 * lying about what it can do, and the failure lands as a base58 error from
 * inside the RPC. Cheaper to ask, and the answer is worth showing.
 */
export async function presence(): Promise<Record<Venue, boolean>> {
  const venues: Venue[] = ["peard", "peard_perps", "peard_amm"];
  try {
    const infos = await conn.getMultipleAccountsInfo(venues.map((v) => PROGRAM_ID[v]));
    return Object.fromEntries(
      venues.map((v, i) => [v, Boolean(infos[i]?.executable)])
    ) as Record<Venue, boolean>;
  } catch {
    // An unreachable RPC is not evidence of absence, so claim nothing.
    return { peard: false, peard_perps: false, peard_amm: false };
  }
}

/* ------------------------------------------------------------ derivation */

/** Depth is the only liquidity knob there is, so it gets a sane default. */
export const DEFAULT_DEPTH_USD = 250_000;
/** And a cap on how much of it can be borrowed against at once. */
export const DEFAULT_OI_CAP_USD = 100_000;

/** 1x. Opening a venue on a weekly-printing index with leverage on top is
 *  two experiments at once, and only one of them is the product. */
export const INITIAL_MARGIN_BPS = 10_000;
export const MAINTENANCE_MARGIN_BPS = 500;
export const LIQUIDATION_FEE_BPS = 1_000;
export const FEE_BPS = 10;
/** Funding cannot be charged faster than the index can move. */
export const MIN_FUNDING_INTERVAL_SECS = 3_600;
export const MAX_FUNDING_CEILING_BPS = 1_000;

export interface Depths {
  depthUsd: number;
  oiCapUsd: number;
}

export interface Derived {
  /** u128, units at 9dp. The base leg of the opening curve. */
  baseReserve: bigint;
  /** u128, USD at 6dp. The quote leg, which is the depth verbatim. */
  quoteReserve: bigint;
  /** u128, units at 9dp. Ceiling on open interest per side. */
  maxOpenBase: bigint;
  maxIndexAgeSecs: number;
  fundingIntervalSecs: number;
  maxDivergenceBps: number;
  maxFundingBps: number;
  initialMarginBps: number;
  maintenanceMarginBps: number;
  liquidationFeeBps: number;
  feeBps: number;
  /** The integers the derivation was done in, so the arithmetic is auditable. */
  priceE6: bigint;
  depthUsdE6: bigint;
  oiCapUsdE6: bigint;
}

/**
 * Every opening parameter, from the pairable and two dollar figures.
 *
 * Nothing here is a preference. The curve is anchored to the TWAP so the
 * market opens at the index rather than wherever the creator wanted it; the
 * risk limits are read off the pairable's own breaker, because a pairable
 * that is allowed to move 40% in a print cannot police a 5% divergence, and
 * one that only accepts a push an hour cannot fund faster than that. Same
 * inputs, same market, whoever launches it.
 *
 * Done in BigInt on the integers the program uses, not in floats scaled at
 * the end: `depth * 1e9 / price` in float loses the low digits of a u128 and
 * they are the ones that decide the opening mark.
 */
/** Twice the registry's gate, capped, and never equal to it. */
export const MAX_INDEX_AGE_CAP = 60 * 86_400;
export function indexAgeFor(registryMaxAgeSecs: number): number {
  if (registryMaxAgeSecs <= 0) return MAX_INDEX_AGE_CAP;
  const secs = Math.min(MAX_INDEX_AGE_CAP, registryMaxAgeSecs * 2);
  if (secs <= registryMaxAgeSecs) {
    throw new Error(
      `index age ${secs}s does not exceed the registry's ${registryMaxAgeSecs}s, so a position on this market could never be closed`
    );
  }
  return secs;
}

export function derive(p: Pairable, d: Depths): Derived | null {
  const priceE6 = BigInt(Math.round(p.price * USD));
  const depthUsdE6 = BigInt(Math.round(d.depthUsd * USD));
  const oiCapUsdE6 = BigInt(Math.round(d.oiCapUsd * USD));
  if (priceE6 <= 0n || depthUsdE6 <= 0n) return null;

  const UNIT_E9 = 1_000_000_000n;
  return {
    baseReserve: (depthUsdE6 * UNIT_E9) / priceE6,
    quoteReserve: depthUsdE6,
    maxOpenBase: (oiCapUsdE6 * UNIT_E9) / priceE6,
    // STRICTLY WIDER than the registry's own gate, never equal to it.
    //
    // `sync_index` copies the registry's PRINT timestamp onto the market, so
    // both gates read the same clock from the same instant. Equal values do
    // not leave a narrow window, they leave none: the last second the index
    // can be refreshed is the same second `index_ok` stops holding, and
    // `close_position` is on the far side of it. Four markets shipped in that
    // state and could not be repaired without a new instruction, because the
    // market PDA is seeded on the pairable and cannot be re-created. The
    // program refuses it now as `NoExitWindow`; this is why it never gets
    // that far.
    maxIndexAgeSecs: indexAgeFor(p.maxPriceAgeSecs),
    fundingIntervalSecs: Math.max(MIN_FUNDING_INTERVAL_SECS, p.minPushIntervalSecs),
    maxDivergenceBps: Math.floor(p.breakerBps / 2),
    maxFundingBps: Math.min(MAX_FUNDING_CEILING_BPS, Math.floor(p.breakerBps / 20)),
    initialMarginBps: INITIAL_MARGIN_BPS,
    maintenanceMarginBps: MAINTENANCE_MARGIN_BPS,
    liquidationFeeBps: LIQUIDATION_FEE_BPS,
    feeBps: FEE_BPS,
    priceE6,
    depthUsdE6,
    oiCapUsdE6,
  };
}

/** u128 args cross the wire as BN, and BN takes a string without losing bits. */
export const bn = (v: bigint) => new BN(v.toString());

/* ----------------------------------------------------------- the writes */

export class NotWired extends Error {
  constructor(public readonly instruction: string) {
    super(`${instruction} is not wired up yet.`);
  }
}

/**
 * PATH A. Not wired, and the single edit that wires it is below.
 *
 * `init_market` is still being hardened, so calling it from here today would
 * ship a button whose argument order is a guess. The derivation is the part
 * worth having early - it is what makes two launches on the same pairable
 * come out identical - and it is finished and shown.
 *
 * The edit, when the signature settles:
 *
 *   const program = programFor("peard_perps", w);
 *   return program.methods
 *     .initMarket(p.id, bn(x.baseReserve), bn(x.quoteReserve), {
 *       feeBps: x.feeBps,
 *       maintenanceMarginBps: x.maintenanceMarginBps,
 *       initialMarginBps: x.initialMarginBps,
 *       liquidationFeeBps: x.liquidationFeeBps,
 *       maxDivergenceBps: x.maxDivergenceBps,
 *       maxFundingBps: x.maxFundingBps,
 *       fundingIntervalSecs: x.fundingIntervalSecs,
 *       maxIndexAgeSecs: x.maxIndexAgeSecs,
 *       maxOpenBase: bn(x.maxOpenBase),
 *     })
 *     .accounts({ pairable: new PublicKey(p.pda), usdMint, tokenProgram })
 *     .rpc();
 *
 * `global`, `market` and `vault` are PDAs the IDL already describes, so
 * Anchor resolves them; `usdMint` has to match `Global.usd_mint` on the
 * contango deployment, which is a read this file does not do yet.
 */
export async function openPerpMarket(
  w: AnchorWallet,
  p: Pairable,
  x: Derived,
  opts: { simulateOnly?: boolean } = {}
): Promise<string> {
  const program = programFor("peard_perps", w);

  // `usd_mint` is read off the deployment rather than assumed. The registry's
  // own `usdMint` names mainnet Circle USDC and devnet uses a stand-in, so a
  // hardcoded mint is wrong on exactly one of the two clusters and silently.
  const globalPda = PublicKey.findProgramAddressSync(
    [Buffer.from("global")],
    PROGRAM_ID.peard_perps
  )[0];
  // The untyped `Program` has no generated account namespace, so this is
  // indexed by name rather than by property.
  const g = (await (
    program.account as unknown as Record<string, { fetch(a: PublicKey): Promise<unknown> }>
  ).global.fetch(globalPda)) as { usdMint: PublicKey };
  const usdMint = new PublicKey(g.usdMint);
  const mintInfo = await program.provider.connection.getAccountInfo(usdMint);
  if (!mintInfo) throw new Error("the peard_perps global names a collateral mint that is not on this cluster");
  const tokenProgram = mintInfo.owner;

  const builder = program.methods
    .initMarket(p.id, bn(x.baseReserve), bn(x.quoteReserve), {
      feeBps: x.feeBps,
      maintenanceMarginBps: x.maintenanceMarginBps,
      initialMarginBps: x.initialMarginBps,
      liquidationFeeBps: x.liquidationFeeBps,
      maxDivergenceBps: x.maxDivergenceBps,
      maxFundingBps: x.maxFundingBps,
      fundingIntervalSecs: x.fundingIntervalSecs,
      maxIndexAgeSecs: x.maxIndexAgeSecs,
      maxOpenBase: bn(x.maxOpenBase),
    })
    .accounts({
      authority: w.publicKey,
      pairable: new PublicKey(p.pda),
      usdMint,
      tokenProgram,
    });

  // Simulate first, always. A refusal here is the program's own reason, in
  // its own words, before anybody signs anything: `NoExitWindow`, `BadParam`,
  // `WrongPairable`. Sending blind turns each of those into a failed
  // signature and a lost fee.
  const sim = await builder.simulate().catch((e: unknown) => e);
  if (sim instanceof Error) throw sim;
  if (opts.simulateOnly) return "simulated";

  return builder.rpc();
}

/**
 * PATH B. Wired, and it lives in `@/lib/launch/build`.
 *
 * Not implemented here because it is not one instruction. A token launch is
 * a mint, its supply, `peard.create_market`, `peard_amm.create_pool` and
 * `set_pool`, in that order, across four transactions, and the order is
 * load-bearing: the pool's `claim_fees` pays into an account
 * `create_market` creates, and the mint authority has to survive until
 * `create_market` has checked it.
 *
 * This re-export keeps one import path for callers that already reach for
 * this file, without a second copy of the sequence.
 */
export { launchToken, virtualQuoteFor } from "./launch";
export type { LaunchInput, LaunchResult, LaunchStep } from "./launch";

/** Does the derived curve fit the u64 legs quotebook stores it in? */
export const FITS_U64 = (v: bigint) => v > 0n && v <= 18_446_744_073_709_551_615n;
