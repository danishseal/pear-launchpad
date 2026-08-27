"use client";

import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  DynamicBondingCurveClient,
  buildCurveWithMarketCap,
  ActivationType,
  BaseFeeMode,
  CollectFeeMode,
  MigrationFeeOption,
  MigrationOption,
  TokenAuthorityOption,
  TokenDecimal,
  TokenType,
} from "@meteora-ag/dynamic-bonding-curve-sdk";
import { BN, Program } from "@coral-xyz/anchor";
import { SystemProgram } from "@solana/web3.js";
import { connection, programFor, ata, ASSOCIATED_TOKEN_PROGRAM } from "./tx";
import type { PeardSigner } from "./tx";
import { peardMarketPda, peardGlobalPda, TOKEN_PROGRAM } from "./launch";

/**
 * A launch, as a Meteora Dynamic Bonding Curve pool quoted in USDC.
 *
 * This replaces the four-transaction sequence against peard's own programs.
 * The trade it makes is worth stating plainly, because it is the difference
 * between what the venue CLAIMS and what the chain ENFORCES:
 *
 *   before   the pool's quote leg held the real tokenised asset, so "priced
 *            in Microsoft" was custody. create_market checked it. The cost
 *            was that buying required already holding MSFTx, and that four
 *            programs had to agree.
 *
 *   now      every pool is token/USDC on Meteora. Anyone with dollars can
 *            buy on day one, and the underlying is an ATTACHMENT: recorded
 *            against the token, shown everywhere, and enforced by nothing.
 *
 * Nothing here should imply otherwise. A token launched on AMZN quotes in
 * dollars; the association is a label this app carries, not a property the
 * chain will defend, and `attachments.ts` is where that is written down.
 *
 * WHY METEORA ACCEPTS THIS AND REFUSED THE OLD DESIGN. peard_amm exists
 * because DBC would not take the tokenised assets as quote mints: they carry
 * a permanent delegate, and DBC refuses those. USDC carries none, so the
 * objection that justified writing a whole AMM does not apply to this shape.
 */

/** Circle USDC on mainnet-beta. Six decimals. */
export const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

/** One percent, all in, on every launch. Not a per-launch choice. */
export const LAUNCH_FEE_BPS = 100;

/** Whole tokens minted at launch. */
export const DEFAULT_SUPPLY = 1_000_000_000;

/** Where the curve opens, in dollars. */
export const INITIAL_MARKET_CAP_USD = 5_000;

/** Where it graduates to a DAMM v2 pool, in dollars. */
export const MIGRATION_MARKET_CAP_USD = 50_000;

export interface MeteoraLaunchStep {
  label: string;
  signature: string;
}

export interface MeteoraLaunchResult {
  /** The launched token's mint. */
  mint: string;
  /** The DBC pool config this launch created. */
  config: string;
  /** The peard market recording the underlying, if that step landed. */
  market: string | null;
  steps: MeteoraLaunchStep[];
}

export interface MeteoraLaunchInput {
  name: string;
  symbol: string;
  /** The underlying's Pairable PDA. Recorded on chain, see below. */
  pairablePda: string;
  /** Off-chain metadata JSON. Empty string is legal and common at launch. */
  uri?: string;
  /**
   * An opening purchase by the creator, in whole USDC. Zero or absent skips
   * it. The buyer needs that much USDC already: the curve takes dollars, and
   * nothing here converts SOL for them.
   */
  devBuyUsdc?: number;
}

/**
 * The curve, built once and identically for every launch.
 *
 * Every number here is fixed rather than offered, for the same reason the old
 * design derived its curve: two launches on the same terms should come out
 * the same, and a creator choosing their own fee is a creator choosing how
 * much to take from the people buying.
 */
function curveConfig() {
  return buildCurveWithMarketCap({
    token: {
      tokenType: TokenType.SPLToken,
      tokenBaseDecimal: TokenDecimal.SIX,
      tokenQuoteDecimal: TokenDecimal.SIX, // USDC
      // The mint authority is dropped at creation. Minting more would not
      // move the curve price, because DBC's reserves are stored rather than
      // measured, but it would dilute every holder, which is the part nobody
      // watching a chart would see.
      tokenAuthorityOption: TokenAuthorityOption.Immutable,
      totalTokenSupply: DEFAULT_SUPPLY,
      leftover: 0,
    },
    fee: {
      baseFeeParams: {
        baseFeeMode: BaseFeeMode.FeeSchedulerLinear,
        // A flat 1%: start and end equal, no decay, no periods. A fee
        // schedule that moves is a fee somebody has to check the time to
        // know.
        feeSchedulerParam: {
          startingFeeBps: LAUNCH_FEE_BPS,
          endingFeeBps: LAUNCH_FEE_BPS,
          numberOfPeriod: 0,
          totalDuration: 0,
        },
      },
      dynamicFeeEnabled: false,
      // Fees taken in USDC rather than in the launched token, so a creator's
      // claim is dollars rather than a bag of their own supply.
      collectFeeMode: CollectFeeMode.QuoteToken,
      creatorTradingFeePercentage: 0,
      poolCreationFee: 0,
      enableFirstSwapWithMinFee: false,
    },
    migration: {
      migrationOption: MigrationOption.MET_DAMM_V2,
      migrationFeeOption: MigrationFeeOption.FixedBps100,
      migrationFee: { feePercentage: 0, creatorFeePercentage: 0 },
    },
    liquidityDistribution: {
      partnerPermanentLockedLiquidityPercentage: 0,
      partnerLiquidityPercentage: 0,
      creatorPermanentLockedLiquidityPercentage: 100,
      creatorLiquidityPercentage: 0,
    },
    lockedVesting: {
      totalLockedVestingAmount: 0,
      numberOfVestingPeriod: 0,
      cliffUnlockAmount: 0,
      totalVestingDuration: 0,
      cliffDurationFromMigrationTime: 0,
    },
    activationType: ActivationType.Timestamp,
    initialMarketCap: INITIAL_MARKET_CAP_USD,
    migrationMarketCap: MIGRATION_MARKET_CAP_USD,
  });
}

async function send(
  signer: PeardSigner,
  conn: Connection,
  tx: Transaction,
  extra: Keypair[]
): Promise<string> {
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = signer.publicKey;
  // Client-generated keypairs sign for their own creation, and BEFORE the
  // wallet: a wallet that rewrites the message would invalidate anything
  // added after it.
  if (extra.length) tx.partialSign(...extra);
  const signed = await signer.signTransaction(tx);
  const sig = await conn.sendRawTransaction(signed.serialize(), { skipPreflight: false });
  await conn.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
  return sig;
}

/**
 * Create the config and the pool.
 *
 * `createConfigAndPool` puts both in ONE transaction, which is the whole
 * reason for using it: the old sequence was four signatures and four chances
 * to end up half-launched, and every partial state needed its own recovery
 * story. The mint and the config are fresh keypairs and sign alongside the
 * wallet.
 */
export async function launchOnMeteora(
  signer: PeardSigner,
  input: MeteoraLaunchInput
): Promise<MeteoraLaunchResult> {
  const client = new DynamicBondingCurveClient(connection, "confirmed");

  const configKp = Keypair.generate();
  const mintKp = Keypair.generate();

  const base = {
    ...curveConfig(),
    config: configKp.publicKey,
    feeClaimer: signer.publicKey,
    leftoverReceiver: signer.publicKey,
    quoteMint: USDC_MINT,
    payer: signer.publicKey,
    preCreatePoolParam: {
      name: input.name,
      symbol: input.symbol,
      uri: input.uri ?? "",
      poolCreator: signer.publicKey,
      baseMint: mintKp.publicKey,
    },
  };

  const steps: MeteoraLaunchStep[] = [];
  const devBuy = Math.max(0, Math.floor((input.devBuyUsdc ?? 0) * 1_000_000));

  if (devBuy > 0) {
    // A first buy splits this into TWO transactions: the config cannot be
    // referenced by the pool until it exists, and the buy rides with the
    // pool. Still fewer than the four the old design needed.
    const { createConfigTx, createPoolWithFirstBuyTx } =
      await client.partner.createConfigAndPoolWithFirstBuy({
        ...base,
        firstBuyParam: {
          buyer: signer.publicKey,
          buyAmount: new BN(devBuy),
          // Zero slippage floor, and it is safe HERE specifically: this buy
          // is in the same transaction as the pool's creation, so there is
          // no other trade that could move the price between quoting and
          // filling. It would not be safe on any later buy.
          minimumAmountOut: new BN(0),
          referralTokenAccount: null,
        },
      });
    steps.push({
      label: "Created the curve",
      signature: await send(signer, connection, createConfigTx, [configKp]),
    });
    steps.push({
      label: `Launched the token and bought $${input.devBuyUsdc?.toLocaleString()}`,
      signature: await send(signer, connection, createPoolWithFirstBuyTx, [mintKp]),
    });
  } else {
    const tx = await client.partner.createConfigAndPool(base);
    steps.push({
      label: "Created the token and its USDC curve",
      signature: await send(signer, connection, tx, [configKp, mintKp]),
    });
  }

  /*
   * Record the underlying ON CHAIN.
   *
   * Meteora has nowhere to put it: the pool is token/USDC and knows nothing
   * about AMZN. Without this the association lives only in the browser that
   * made the launch, so every other visitor sees a token with no underlying
   * and a cleared browser loses it outright.
   *
   * `create_market` writes token_mint and pairable into one account anyone
   * can read. It ENFORCES NOTHING about the Meteora pool and is not meant
   * to: peard is the record of what a token was launched on, Meteora is
   * where it trades.
   *
   * Two things make this legal that would not have been obvious:
   *   - the mint authority is Immutable, so `create_market`'s issuer check
   *     passes on the "renounced mint, open to anybody" branch
   *   - Denominated mode requires the quote to be the pinned dollar, which
   *     USDC is
   *
   * Its own transaction, and its own failure. A launch whose pool exists has
   * succeeded even if this does not land; the local record still holds the
   * association, and this can be retried.
   */
  let market: string | null = null;
  try {
    const peard = programFor("peard", signer) as Program;
    const marketPda = peardMarketPda(mintKp.publicKey);
    const sig = await peard.methods
      .createMarket(LAUNCH_FEE_BPS, { denominated: {} })
      .accountsPartial({
        creator: signer.publicKey,
        global: peardGlobalPda(),
        pairable: new PublicKey(input.pairablePda),
        tokenMint: mintKp.publicKey,
        quoteMint: USDC_MINT,
        market: marketPda,
        rewardVault: ata(USDC_MINT, marketPda, TOKEN_PROGRAM),
        tokenProgram: TOKEN_PROGRAM,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    market = marketPda.toBase58();
    steps.push({ label: "Recorded the underlying on chain", signature: sig });
  } catch {
    // Left null. The caller shows the launch as done, because it is.
  }

  return {
    mint: mintKp.publicKey.toBase58(),
    config: configKp.publicKey.toBase58(),
    market,
    steps,
  };
}
