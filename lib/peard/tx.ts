/**
 * The write side: signing, programs, and the two token-program derivations.
 *
 * Reads do not come through here. `chain.ts` decodes with a bare
 * `BorshAccountsCoder` so the app can read without a wallet, and the two
 * paths spell the same IDL differently:
 *
 *     coder.decode("Pairable", data).price_twap      PascalCase, snake_case
 *     program.account.pairable.fetch(pda).priceTwap  camelCase, camelCase
 *
 * Same file, two conventions, and the only warning either gives when you mix
 * them up is `undefined` at runtime: no throw, no type error, just a number
 * that quietly is not there. Reads stay on the coder, `Program` builds
 * transactions and nothing else.
 */
import { AnchorProvider, BN, Program } from "@coral-xyz/anchor";
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  type Transaction,
  type VersionedTransaction,
} from "@solana/web3.js";
import { conn } from "./chain";
import peardIdl from "./idl/peard.json";
import peardAmmIdl from "./idl/peard_amm.json";
import peardPerpsIdl from "./idl/peard_perps.json";

type Signable = Transaction | VersionedTransaction;

export interface PeardSigner {
  publicKey: PublicKey;
  signTransaction<T extends Signable>(tx: T): Promise<T>;
  signAllTransactions<T extends Signable>(txs: T[]): Promise<T[]>;
}

export const connection = conn;

export type Venue = "peard" | "peard_amm" | "peard_perps";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IDL: Record<Venue, any> = {
  peard: peardIdl,
  peard_amm: peardAmmIdl,
  peard_perps: peardPerpsIdl,
};

/** Off the IDLs rather than typed out, so they cannot drift from a build. */
export const PROGRAM_ID: Record<Venue, PublicKey> = {
  peard: new PublicKey((peardIdl as { address: string }).address),
  peard_amm: new PublicKey((peardAmmIdl as { address: string }).address),
  peard_perps: new PublicKey((peardPerpsIdl as { address: string }).address),
};

export const ASSOCIATED_TOKEN_PROGRAM = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

export function programFor(venue: Venue, signer: PeardSigner): Program {
  // `processed` would let the UI move sooner and lie sooner. Reads are
  // `confirmed`, and a write resolving ahead of them lands the user on a page
  // that does not show what they just did.
  const provider = new AnchorProvider(
    connection,
    signer as unknown as AnchorProvider["wallet"],
    { commitment: "confirmed" }
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Program(IDL[venue] as any, provider);
}

/** u64/u128 arguments cross the wire as BN, which takes a string losslessly. */
export const bn = (v: bigint) => new BN(v.toString());

/**
 * The associated token account, derived rather than imported.
 *
 * `@solana/spl-token` is not a dependency and pulling it in for one
 * `findProgramAddressSync` would be the largest package in the bundle for
 * three lines of arithmetic. The token program is an ARGUMENT because half
 * the quote assets peard cares about are Token-2022, and deriving over the
 * wrong one addresses an account that exists nowhere.
 */
export function ata(mint: PublicKey, owner: PublicKey, tokenProgram: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), tokenProgram.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM
  )[0];
}

/**
 * Create an ATA if it is not there, and do nothing if it is.
 *
 * Instruction 1 of the associated-token program is CreateIdempotent, which is
 * why this can be prepended unconditionally: a first-time holder has no
 * account for the token, and a repeat one must not pay for a second.
 */
export function createAtaIdempotentIx(
  payer: PublicKey,
  owner: PublicKey,
  mint: PublicKey,
  tokenProgram: PublicKey
): TransactionInstruction {
  return new TransactionInstruction({
    programId: ASSOCIATED_TOKEN_PROGRAM,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: ata(mint, owner, tokenProgram), isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: tokenProgram, isSigner: false, isWritable: false },
    ],
    data: Buffer.from([1]),
  });
}

/** Which token program issued a mint. Read, never assumed. */
export async function tokenProgramFor(mint: PublicKey): Promise<PublicKey> {
  const info = await connection.getAccountInfo(mint);
  if (!info) throw new Error(`the mint ${mint.toBase58()} does not exist on this cluster`);
  return info.owner;
}
