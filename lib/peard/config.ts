/**
 * Where this app points, and nothing else.
 *
 * The ansem build resolved every mutable address at runtime from a CosmWasm
 * config registry, so only two things were baked. Solana has no equivalent:
 * a program id IS the deployment, there is nothing to indirect through, and
 * an app that read its own program ids from somewhere else would be trusting
 * a pointer it cannot verify. So the ids are baked, taken straight off the
 * IDLs the programs were built with, and the only knob is the endpoint.
 */

import peardIdl from "./idl/peard.json";
import peardPerpsIdl from "./idl/peard_perps.json";
import peardAmmIdl from "./idl/peard_amm.json";
import devnetUsd from "./devnet-usd.json";

/**
 * Mainnet-beta. peard, peard_amm and peard_vault went up 2026-08-26 and the
 * registry is priced there; devnet still runs the same addresses if you point
 * the RPC at it.
 *
 * peard_perps is NOT on mainnet, so Path A does not exist here and the UI
 * must not offer a perp on this cluster.
 */
export const CLUSTER = "mainnet-beta" as const;

/**
 * The public devnet endpoint rate-limits `getProgramAccounts` hard, which is
 * the one method this app lives on. Override it with a private endpoint and
 * the first paint stops taking twenty seconds.
 */
export const RPC_URL =
  process.env.NEXT_PUBLIC_PEARD_RPC ??
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
  "https://api.mainnet-beta.solana.com";

/** Read off the IDLs rather than typed out, so they cannot drift from a build. */
export const PROGRAM_IDS = {
  pricedin: (peardIdl as { address: string }).address,
  contango: (peardPerpsIdl as { address: string }).address,
  quotebook: (peardAmmIdl as { address: string }).address,
  /** Reserve attestation. NOT deployed, and the UI must not offer it. */
  manifest: "6ps4NbLGcZGW1WWqrp4PsqMCozHied1QGihDzP1A5zv8",
} as const;

/**
 * Collateral on devnet.
 *
 * `pairables/seed.json` names mainnet Circle USDC and is NOT what this
 * cluster uses. The authoritative answer is `Global.usd_mint` on the
 * pricedin and contango deployments, which is read at runtime; this constant
 * is the fallback for a label that has to render before that read lands.
 */
export const DEVNET_USD = devnetUsd as {
  mint: string;
  symbol: string;
  decimals: number;
  cluster: string;
  authority: string;
  note: string;
};

/** Wrapped SOL, and the only two hard-grade quote legs that exist on devnet. */
export const WSOL_MINT = "So11111111111111111111111111111111111111112";
export const EURC_DEVNET_MINT = "HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzpKcFu7uBEDKtr";

/**
 * The pricedin indexer: bun + Express + Postgres, ingesting Anchor events off
 * all three programs.
 *
 * One constant, so pointing this at a deployed host later is one line. It is a
 * local service nobody has deployed yet, so treat "unreachable" as the normal
 * case rather than the exception: `indexer.ts` never throws on a failed read.
 *
 * The split it exists for: CHAIN is authoritative for what is true now
 * (reserves, positions, the registry), and only an INDEX can say what happened.
 * Nothing current-state is read from here.
 */
export const INDEXER_URL = (
  // The service mounts its router at /api (`app.use("/api", router)`), so a
  // base without it 404s every call. The client swallows its own failures, so
  // that read as "the index is online and has nothing", which is a different
  // and much more comfortable claim than "the index was never reached".
  process.env.NEXT_PUBLIC_PRICEDIN_INDEXER ?? "http://localhost:9910/api"
).replace(/\/+$/, "");

/** SSE. Not a websocket, and not the same fallback path as the chain poll. */
export const INDEXER_SSE_URL = `${INDEXER_URL}/sse/feed`;

/** Static assets copied out of the pricedin app: the registry's own prints. */
export const HISTORY_BASE = "/data/history";
export const SEED_URL = "/data/seed.json";
export const SYNTHETIC_URL = "/data/synthetic.json";

export const EXPLORER_BASE = "https://explorer.solana.com";

export function explorerUrl(kind: "address" | "tx", value: string): string {
  const path = kind === "tx" ? "tx" : "address";
  return `${EXPLORER_BASE}/${path}/${value}?cluster=${CLUSTER}`;
}
