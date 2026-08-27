import { PublicKey } from "@solana/web3.js";
import { conn } from "./chain";
import { serial } from "./queue";

/**
 * Token-account reads, which is the only way this app can answer "who holds
 * this" without an indexer.
 *
 * Deliberately NOT a `getProgramAccounts` scan of the token program filtered
 * by mint. That is the textbook answer and it is the wrong one here: the
 * public devnet endpoint refuses it outright on the token program, and even
 * where it is allowed it returns every account ever opened for the mint,
 * including the thousands with a zero balance. `getTokenLargestAccounts` is
 * one call, is ranked, and answers the question a holders panel is actually
 * asking. It returns the top 20 and no more, which is a limit worth stating
 * rather than papering over.
 */

/** Classic SPL. Every token launched on quotebook so far is one of these. */
export const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);
/** Token-2022. The hard-grade QUOTE legs live here; the launched tokens do not. */
export const TOKEN_2022_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);

/** The ceiling `getTokenLargestAccounts` imposes, named so a caller can say so. */
export const LARGEST_ACCOUNTS_LIMIT = 20;

export interface HolderRow {
  /** The OWNER wallet, not the token account. */
  owner: string;
  /** Raw base units, as a string, so a u64 does not round on the way out. */
  amount: string;
}

/**
 * The largest holders of a mint, with the pool's own vault taken out.
 *
 * A curve's unsold supply sits in a token account owned by the pool PDA. It
 * is the largest balance by a wide margin and it is not a holder: counting
 * it would draw a distribution chart whose top row is the curve itself.
 */
export async function largestHolders(
  mint: string,
  exclude: string[] = []
): Promise<HolderRow[]> {
  let largest;
  try {
    largest = await serial(() => conn.getTokenLargestAccounts(new PublicKey(mint)));
  } catch {
    return [];
  }
  const accounts = largest.value.filter((a) => a.amount !== "0");
  if (accounts.length === 0) return [];

  // One more call to turn token accounts into the wallets behind them. The
  // panel links each row to an explorer, and linking a token account while
  // calling it a holder sends people to the wrong page.
  let parsed;
  try {
    parsed = await serial(() =>
      conn.getMultipleParsedAccounts(accounts.map((a) => a.address))
    );
  } catch {
    return [];
  }

  const skip = new Set(exclude);
  const rows: HolderRow[] = [];
  accounts.forEach((a, i) => {
    const info = parsed.value[i]?.data;
    const owner =
      info && "parsed" in info
        ? ((info.parsed as { info?: { owner?: string } })?.info?.owner ?? null)
        : null;
    if (!owner || skip.has(owner)) return;
    rows.push({ owner, amount: a.amount });
  });
  return rows;
}

/**
 * A mint's total supply, raw base units, or null when it cannot be read.
 *
 * Null rather than zero: a curve whose supply is unknown and a curve with no
 * supply are different, and only one of them means every holder owns 100%.
 */
export async function mintSupply(mint: string): Promise<bigint | null> {
  try {
    const res = await serial(() => conn.getTokenSupply(new PublicKey(mint)));
    return BigInt(res.value.amount);
  } catch {
    return null;
  }
}

/**
 * When an account was first written, or null when that cannot be established.
 *
 * No account on quotebook, contango or pricedin records its own creation time,
 * so the only evidence is the oldest signature that touched it. That is only
 * KNOWABLE when the whole signature history fits in one page: a full page back
 * means there are older ones this did not see, and the oldest of a truncated
 * list is not a creation time, it is just the oldest thing that fitted.
 *
 * So the check is explicit and the answer is null when it fails. Deliberately
 * one account at a time and never called for a list: fifty of these is fifty
 * round trips, on the endpoint that rate-limits hardest.
 */
export async function firstSeenAt(address: string): Promise<number | null> {
  const LIMIT = 1_000;
  try {
    const sigs = await serial(() =>
      conn.getSignaturesForAddress(new PublicKey(address), { limit: LIMIT })
    );
    if (sigs.length === 0 || sigs.length >= LIMIT) return null;
    const oldest = sigs[sigs.length - 1];
    return oldest.blockTime ?? null;
  } catch {
    return null;
  }
}

export interface OwnedToken {
  mint: string;
  /** Raw base units. */
  amount: string;
  decimals: number;
}

/** Every token balance a wallet holds, both token programs, in two calls. */
export async function ownedTokens(owner: string): Promise<OwnedToken[]> {
  const key = new PublicKey(owner);
  const read = async (programId: PublicKey) => {
    try {
      const res = await serial(() =>
        conn.getParsedTokenAccountsByOwner(key, { programId })
      );
      return res.value;
    } catch {
      return [];
    }
  };
  const [classic, t22] = await Promise.all([
    read(TOKEN_PROGRAM_ID),
    read(TOKEN_2022_PROGRAM_ID),
  ]);
  const out: OwnedToken[] = [];
  for (const acc of [...classic, ...t22]) {
    const info = (acc.account.data as { parsed?: { info?: Record<string, unknown> } })
      .parsed?.info as
      | { mint?: string; tokenAmount?: { amount?: string; decimals?: number } }
      | undefined;
    const amount = info?.tokenAmount?.amount ?? "0";
    if (!info?.mint || amount === "0") continue;
    out.push({
      mint: info.mint,
      amount,
      decimals: info.tokenAmount?.decimals ?? 0,
    });
  }
  return out;
}

/**
 * Which of these mints actually exist on the cluster being read.
 *
 * A hard-grade pairable names an asset by address, and the registry's address
 * is a MAINNET one for most entries. On devnet almost none of them exist, so
 * a pool quoted in one would have no mint for its vault to hold. Checking
 * before offering the launch is the difference between a refusal with a
 * reason and a transaction that fails at the vault.
 *
 * Chunked at 100 because `getMultipleAccountsInfo` caps there and web3.js
 * throws rather than paging, which is the same edge the crank, the indexer
 * and the metadata reader all had to learn separately.
 */
export async function assetMintsPresent(mints: string[]): Promise<Set<string>> {
  const want = [...new Set(mints.filter(Boolean))];
  const found = new Set<string>();
  for (let i = 0; i < want.length; i += 100) {
    const slice = want.slice(i, i + 100);
    let keys: PublicKey[];
    try {
      keys = slice.map((m) => new PublicKey(m));
    } catch {
      continue; // an unparseable address is not a mint that exists
    }
    try {
      const infos = await conn.getMultipleAccountsInfo(keys);
      infos.forEach((info, n) => {
        // Owned by a token program, not merely present. A system account at
        // that address is not a mint.
        if (
          info &&
          (info.owner.equals(TOKEN_PROGRAM_ID) || info.owner.equals(TOKEN_2022_PROGRAM_ID))
        ) {
          found.add(slice[n]);
        }
      });
    } catch {
      // An unreachable endpoint is not evidence of absence. Nothing is added,
      // so the caller refuses the launch rather than offering a broken one.
    }
  }
  return found;
}
