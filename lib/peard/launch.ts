/**
 * Path B, the token launch, in the order the programs require.
 *
 * `transactions.ts` has claimed since the browser flow landed that this
 * module exists and that `create_market`, `create_pool` and `set_pool` are
 * wired. It did not exist. Meanwhile the wizard's review step printed "Not
 * wired in this build". The two disagreed and the map was the one lying,
 * which is worse than the gap: a WIRED entry reading `null` is what every
 * caller checks before enabling a button.
 *
 * Mirrors `~/pricedin/scripts/launch.ts`, which is the reference
 * implementation and has been run against devnet. Where the two differ it is
 * because the script has a filesystem keypair and `@solana/spl-token`, and
 * this has a browser wallet and neither.
 *
 * THE ORDER IS NOT A PREFERENCE.
 *
 *   1. the mint          nothing can reference a token that does not exist
 *   2. supply to creator create_pool moves it onto the curve from here
 *   3. create_market     MUST precede the pool: the pool's `claim_fees` pays
 *                        into the market's reward vault, and `create_market`
 *                        is what creates that account. A pool built first
 *                        has a fee route pointing at nothing.
 *   4. create_pool       `fee_claimer` is the MARKET PDA, not its vault.
 *                        That address is the entire integration between the
 *                        two programs; neither CPIs into the other.
 *   5. set_pool          records the venue on the market, as PeardAmm
 *   6. revoke mint       last, because `create_market` requires the creator
 *                        to be the mint authority
 *
 * Sent as separate transactions rather than one. Every account is a PDA or a
 * deterministic ATA, so a run that dies halfway can be re-run and each step
 * that already landed refuses or no-ops rather than duplicating. One
 * transaction would be atomic but would also exceed the size limit and give
 * the user a single opaque failure for six different reasons.
 */
import { BN, Program } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM,
  ata,
  bn,
  connection,
  createAtaIdempotentIx,
  type PeardSigner,
  PROGRAM_ID,
  programFor,
  tokenProgramFor,
} from "./tx";

/** Classic SPL. The launched token is ours and wants no extensions. */
export const TOKEN_PROGRAM = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

/** A `Mint` with no extensions is exactly 82 bytes. */
const MINT_SIZE = 82;

/** Six decimals, matching every other launched token in this registry. */
export const LAUNCH_DECIMALS = 6;

/** Whole tokens minted at launch. */
export const DEFAULT_SUPPLY = 1_000_000_000;

/**
 * Nine tenths onto the curve, a tenth kept back.
 *
 * The same split `scripts/launch.ts` uses. Worth stating rather than
 * inlining: it is the creator's retained float and it is visible on chain
 * from the first block, so it should not read as an accident.
 */
const ON_CURVE_NUMERATOR = 9n;
const ON_CURVE_DENOMINATOR = 10n;

/** Opening value of the curve, in dollars, before it trades. */
export const DEFAULT_FDV_USD = 50_000;

/** 1% a side, the launch default. */
export const DEFAULT_FEE_BPS = 100;

const USD_ONE = 1_000_000;

export interface LaunchStep {
  /** Shown to a person, in order. */
  label: string;
  signature: string;
}

export interface LaunchResult {
  tokenMint: string;
  market: string;
  pool: string;
  steps: LaunchStep[];
}

/**
 * Which leg the curve is quoted in.
 *
 *   native        the pairable's own tokenised asset. The vault holds the
 *                 real thing, so "priced in Microsoft" is custody rather
 *                 than a label. Requires hard grade; the program enforces
 *                 `pairable.asset_mint == quote_mint`.
 *
 *   denominated   USDC. The pool is token/USDC and the pairable is the
 *                 CONTRACT the reward ledger denominates against:
 *                 `units_from_usdc` converts fees at the underlying's own
 *                 price, so holders are still owed units of the thing.
 *
 * Denominated is what makes the index-grade half of the registry launchable
 * at all. There is no tokenised apple and no tokenised count of Drake's
 * listeners, so there is nothing to put in a quote vault; USDC is. The
 * program requires only that the quote mint is the pinned dollar, and does
 * not check the grade.
 *
 * The honest difference, worth saying on the page rather than here alone:
 * a native pool holds the underlying and a denominated one does not. The
 * price a denominated token quotes is dollars, and the underlying enters
 * through the rewards rather than through the curve.
 */
export type QuoteMode = "native" | "denominated";

export interface LaunchInput {
  /** The pairable PDA this launch is priced in. */
  pairablePda: string;
  /** Its `asset_mint`. Required for native mode, ignored for denominated. */
  assetMint: string | null;
  mode: QuoteMode;
  /** Its `price_twap`, USD at 6dp. Used only to size the opening curve. */
  priceE6: bigint;
  fdvUsd?: number;
  feeBps?: number;
  supply?: number;
}

/* ------------------------------------------------------- SPL, by hand */

/**
 * The three token instructions this needs, encoded here.
 *
 * `@solana/spl-token` is not a dependency and `transactions.ts` already made
 * the same call for `ata` and the idempotent create: pulling in the largest
 * package in the bundle for three fixed byte layouts is not a trade worth
 * making. Each layout is from the SPL token program's own instruction enum.
 */
function initializeMint2Ix(mint: PublicKey, authority: PublicKey): TransactionInstruction {
  // tag 20, decimals u8, mint authority 32, freeze authority option 1 + 32
  const data = new Uint8Array(1 + 1 + 32 + 1 + 32);
  data[0] = 20;
  data[1] = LAUNCH_DECIMALS;
  data.set(authority.toBytes(), 2);
  // No freeze authority, ever. A launched token whose issuer can freeze a
  // holder is not one a curve should be quoting.
  data[34] = 0;
  return new TransactionInstruction({
    programId: TOKEN_PROGRAM,
    keys: [{ pubkey: mint, isSigner: false, isWritable: true }],
    data: data as unknown as Buffer,
  });
}

function mintToIx(
  mint: PublicKey,
  dest: PublicKey,
  authority: PublicKey,
  amount: bigint
): TransactionInstruction {
  const data = new Uint8Array(1 + 8);
  data[0] = 7;
  // A u64, written a byte at a time.
  //
  // NOT `Buffer.writeBigUInt64LE`, which is what shipped first and threw
  // "data.writeBigUInt64LE is not a function" on the first launch anybody
  // tried. Node's Buffer has the BigInt methods; the polyfill web3.js pulls
  // into a browser bundle does not, so this passed every test that ran under
  // Node and failed for every real user.
  let v = amount;
  for (let i = 0; i < 8; i++) {
    data[1 + i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return new TransactionInstruction({
    programId: TOKEN_PROGRAM,
    keys: [
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: dest, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: false },
    ],
    data: data as unknown as Buffer,
  });
}

/**
 * Drop the mint authority permanently.
 *
 * Minting more would NOT move the pool price, because reserves are stored
 * rather than measured. It would dilute every holder's pro-rata share of the
 * reward accumulator, which is the part nobody watching the chart would see.
 */
function revokeMintAuthorityIx(mint: PublicKey, authority: PublicKey): TransactionInstruction {
  // tag 6, authority type u8 (0 = MintTokens), new authority option 1
  const data = new Uint8Array([6, 0, 0]);
  return new TransactionInstruction({
    programId: TOKEN_PROGRAM,
    keys: [
      { pubkey: mint, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: false },
    ],
    data: data as unknown as Buffer,
  });
}

/* ------------------------------------------------------------------ PDAs */

/** A PDA seed. TextEncoder is native; `Buffer.from` is the shim. */
const seed = (s: string) => new TextEncoder().encode(s);

export function peardMarketPda(tokenMint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [seed("market"), tokenMint.toBytes()],
    PROGRAM_ID.peard
  )[0];
}

export function peardPoolPda(tokenMint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [seed("pool"), tokenMint.toBytes()],
    PROGRAM_ID.peard_amm
  )[0];
}

export function peardGlobalPda(): PublicKey {
  return PublicKey.findProgramAddressSync(
    [seed("global")],
    PROGRAM_ID.peard
  )[0];
}

/* ------------------------------------------------------------- the curve */

/**
 * `virtual_quote`, in the QUOTE MINT'S BASE UNITS.
 *
 * Not dollars, and not a constant number of decimals. In Native mode one
 * unit IS a whole quote token, so this is the opening value of the curve
 * expressed in that asset. The decimals come off the mint every time because
 * the tokenised assets are not uniform: PAXG is 6dp and the xStocks are 8,
 * and assuming either is a hundredfold error that still looks like a price.
 */
export function virtualQuoteFor(
  fdvUsd: number,
  priceE6: bigint,
  quoteDecimals: number
): bigint {
  if (priceE6 <= 0n) {
    throw new Error("this underlying has no price, so a curve cannot be sized against it");
  }
  const price = Number(priceE6) / USD_ONE;
  const v = BigInt(Math.round((fdvUsd / price) * 10 ** quoteDecimals));
  if (v <= 0n) throw new Error("the opening curve rounds to zero against this price");
  if (v > 18_446_744_073_709_551_615n) {
    throw new Error("the opening curve does not fit the u64 the pool stores it in");
  }
  return v;
}

/* ------------------------------------------------------------------ send */

async function send(
  signer: PeardSigner,
  ixs: TransactionInstruction[],
  extra: Keypair[] = []
): Promise<string> {
  const tx = new Transaction().add(...ixs);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = signer.publicKey;
  // The mint is a client-generated keypair, so it signs for its own
  // creation. Partial-sign BEFORE the wallet: a wallet that rewrites the
  // message would invalidate a signature added after it.
  if (extra.length) tx.partialSign(...extra);
  const signed = await signer.signTransaction(tx);
  const sig = await connection.sendRawTransaction(signed.serialize(), {
    skipPreflight: false,
  });
  await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
  return sig;
}

/* ------------------------------------------------------------------ Path B */

export async function launchToken(
  signer: PeardSigner,
  input: LaunchInput
): Promise<LaunchResult> {
  const me = signer.publicKey;
  const pairable = new PublicKey(input.pairablePda);
  const denominated = input.mode === "denominated";

  // The dollar mint is READ off the deployment rather than assumed: devnet
  // runs a stand-in whose authority we hold and mainnet runs Circle's, so a
  // hardcoded address is wrong on exactly one cluster and silently.
  const peardRead = programFor("peard", signer) as Program;
  const globalPda = peardGlobalPda();
  const g = (await (
    peardRead.account as unknown as Record<string, { fetch(a: PublicKey): Promise<unknown> }>
  ).global.fetch(globalPda)) as { usdMint: PublicKey };

  if (!denominated && !input.assetMint) {
    throw new Error("a native launch needs the underlying's asset mint, and this one has none");
  }
  const asset = new PublicKey(denominated ? g.usdMint : input.assetMint!);
  const fdvUsd = input.fdvUsd ?? DEFAULT_FDV_USD;
  const feeBps = input.feeBps ?? DEFAULT_FEE_BPS;

  // Which token program issued the asset is READ, never assumed: the
  // associated-token address is derived over it, so guessing addresses an
  // account that exists nowhere and the failure is an opaque one.
  const assetInfo = await connection.getAccountInfo(asset);
  if (!assetInfo) {
    throw new Error(
      denominated
        ? "the dollar mint this deployment names does not exist on this cluster"
        : "the asset mint this underlying names does not exist on this cluster"
    );
  }
  const assetProgram = await tokenProgramFor(asset);
  // Decimals off the mint account: byte 44 of a `Mint`, extensions or not.
  const quoteDecimals = assetInfo.data[44];
  if (!Number.isInteger(quoteDecimals)) {
    throw new Error("could not read the asset mint's decimals");
  }

  const supply = BigInt(input.supply ?? DEFAULT_SUPPLY) * 10n ** BigInt(LAUNCH_DECIMALS);
  const onCurve = (supply * ON_CURVE_NUMERATOR) / ON_CURVE_DENOMINATOR;
  const virtualQuote = virtualQuoteFor(fdvUsd, input.priceE6, quoteDecimals);

  const mintKp = Keypair.generate();
  const tokenMint = mintKp.publicKey;
  const market = peardMarketPda(tokenMint);
  const pool = peardPoolPda(tokenMint);
  const creatorBase = ata(tokenMint, me, TOKEN_PROGRAM);

  const peard = peardRead;
  const amm = programFor("peard_amm", signer) as Program;
  const steps: LaunchStep[] = [];

  // 1 + 2. The mint, and the whole supply into the creator's account.
  const rent = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
  steps.push({
    label: "Created the token and minted its supply",
    signature: await send(
      signer,
      [
        SystemProgram.createAccount({
          fromPubkey: me,
          newAccountPubkey: tokenMint,
          lamports: rent,
          space: MINT_SIZE,
          programId: TOKEN_PROGRAM,
        }),
        initializeMint2Ix(tokenMint, me),
        createAtaIdempotentIx(me, me, tokenMint, TOKEN_PROGRAM),
        mintToIx(tokenMint, creatorBase, me, supply),
      ],
      [mintKp]
    ),
  });

  // 3. Before the pool, always. The pool's fee route pays into an account
  //    this instruction creates.
  steps.push({
    label: "Opened the market on the registry",
    signature: await peard.methods
      .createMarket(feeBps, denominated ? { denominated: {} } : { native: {} })
      .accountsPartial({
        creator: me,
        global: globalPda,
        pairable,
        tokenMint,
        quoteMint: asset,
        market,
        rewardVault: ata(asset, market, assetProgram),
        tokenProgram: assetProgram,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM,
        systemProgram: SystemProgram.programId,
      })
      .rpc(),
  });

  // 4. `feeClaimer` is the MARKET PDA, not its vault. That one address is
  //    the whole integration between the two programs.
  steps.push({
    label: "Stood up the curve",
    signature: await amm.methods
      .createPool(feeBps, bn(virtualQuote), bn(onCurve))
      .accountsPartial({
        creator: me,
        baseMint: tokenMint,
        quoteMint: asset,
        feeClaimer: market,
        pool,
        baseVault: ata(tokenMint, pool, TOKEN_PROGRAM),
        quoteVault: ata(asset, pool, assetProgram),
        creatorBase,
        baseTokenProgram: TOKEN_PROGRAM,
        quoteTokenProgram: assetProgram,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM,
        systemProgram: SystemProgram.programId,
      })
      .rpc(),
  });

  // 5 + 6. Record the venue, then drop the mint authority. The revoke is
  //        last because `create_market` requires the creator to still hold
  //        it, and doing it earlier fails that check rather than this one.
  steps.push({
    label: "Named the venue and dropped the mint authority",
    signature: await send(signer, [
      await peard.methods
        .setPool(pool, { peardAmm: {} })
        .accountsPartial({ creator: me, market })
        .instruction(),
      revokeMintAuthorityIx(tokenMint, me),
    ]),
  });

  return {
    tokenMint: tokenMint.toBase58(),
    market: market.toBase58(),
    pool: pool.toBase58(),
    steps,
  };
}
