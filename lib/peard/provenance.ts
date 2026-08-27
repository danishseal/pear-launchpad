import type { Pairable } from "./chain";
import devnetUsd from "./devnet-usd.json";

/**
 * Where a number on screen actually came from.
 *
 * This file exists because of one failure mode, and it is the only one in
 * the product that cannot be argued down: a price somebody typed into a
 * config file, rendered in the same styling as a price a market made. Every
 * other honesty rule here is about precision. This one is about whether the
 * screen is lying.
 *
 * The registry's own `resolver` field does NOT catch it. Thirteen of the
 * fifteen manual attestations in `relayer/config/relayer.yaml` are registered
 * as `http` pairables and the other two as `optimistic`, so they read as
 * feed-backed in the table while carrying a hand-typed number on chain. The
 * check that does catch it is the one done here: compare the on-chain TWAP
 * against the figure in the operator's config, and say so when they are the
 * same number.
 */

/**
 * The `manual:` block of `relayer/config/relayer.yaml`, mirrored.
 *
 * Mirrored rather than parsed: the app is a static bundle with no YAML
 * dependency and no backend to ask, and adding either to read fifteen lines
 * would be worse than copying them.
 *
 * STALE as of 2026-08-25: `relayer/config/relayer.yaml` now carries fifteen
 * manual entries, not the twenty below. `EGGS-DOZ`, `MILK-GAL`, `GAS-GAL`,
 * `COPPER-LB` and `MRBEAST-SUBS` moved to live keyless feeds that day and
 * should come out of this table.
 *
 * Drift is handled rather than assumed away, which is why the five extra rows
 * are wrong rather than dangerous. Nothing below is asserted as the on-chain
 * price: it is compared to the on-chain price, and the badge says which of the
 * two cases holds. A stale entry here therefore degrades to the weaker "an
 * attestation is configured" claim rather than to a false one.
 */
export const MANUAL: Record<string, { value: number; asOf: string }> = {
  "COKE-20OZ": { value: 2.49, asOf: "2026-08-17" },
  "EGGS-DOZ": { value: 3.2, asOf: "2026-08-17" },
  "MILK-GAL": { value: 4.05, asOf: "2026-08-17" },
  "GAS-GAL": { value: 3.12, asOf: "2026-08-17" },
  "NATGAS-MMBTU": { value: 2.68, asOf: "2026-08-17" },
  "COPPER-LB": { value: 6.64, asOf: "2026-08-17" },
  "HOME-US-MED": { value: 419200, asOf: "2026-08-17" },
  "PEAR-EA": { value: 0.6, asOf: "2026-08-17" },
  "BIGMAC-US": { value: 5.69, asOf: "2026-08-18" },
  "BIGMAC-CH": { value: 8.17, asOf: "2026-08-18" },
  "RAMEN-PK": { value: 0.44, asOf: "2026-08-17" },
  "RICE-20LB": { value: 19.98, asOf: "2026-08-17" },
  "RENT-NYC-1BR": { value: 4300, asOf: "2026-08-17" },
  "TUITION-IVY": { value: 67000, asOf: "2026-08-17" },
  "NETFLIX-MO": { value: 17.99, asOf: "2026-08-17" },
  "BOXOFFICE-1": { value: 42000000, asOf: "2026-08-17" },
  "PSA10-CHARIZARD": { value: 8500, asOf: "2026-08-17" },
  "OPENAI-VAL": { value: 300000000000, asOf: "2026-08-17" },
  "DRAKE-LISTENERS": { value: 78000000, asOf: "2026-08-17" },
  "MRBEAST-SUBS": { value: 425000000, asOf: "2026-08-17" },
};

export type ProvenanceKind = "pinned" | "typed" | "attested";

export interface Provenance {
  kind: ProvenanceKind;
  /** Short enough for a table cell. */
  tag: string;
  /** The whole claim, in one sentence, for a tooltip or a note. */
  why: string;
}

/** Same number, allowing for the round trip through USD e6 and a float. */
function same(a: number, b: number): boolean {
  if (b === 0) return a === 0;
  return Math.abs(a - b) <= Math.abs(b) * 1e-9;
}

/**
 * The provenance badge for a pairable's price, or null when it is a feed.
 *
 * Three outcomes, in descending order of how much they should worry you:
 *
 *   pinned    the registry resolves it to a constant, by design
 *   typed     the on-chain price IS the operator's typed figure, today
 *   attested  a typed figure is wired as a source; the print is not it
 */
export function priceProvenance(p: Pairable): Provenance | null {
  if (p.resolver === "pinned") {
    return {
      kind: "pinned",
      tag: "pinned",
      why: "Pinned resolver: the registry answers with a constant. No source is read, and the number moves only when somebody edits the entry.",
    };
  }
  const m = MANUAL[p.id];
  if (!m) return null;
  const typed = `$${m.value.toLocaleString("en-US")} per ${p.unit}, dated ${m.asOf}`;
  if (p.price > 0 && same(p.price, m.value)) {
    return {
      kind: "typed",
      tag: "typed",
      why: `The price on chain is exactly the figure an operator typed into relayer/config/relayer.yaml: ${typed}. It is an attestation about the world, not a quote from a market.`,
    };
  }
  return {
    kind: "attested",
    tag: "attested",
    why: `A hand-typed attestation is wired as a source for this pairable (${typed}), and the current print is not it, so something live is answering as well.`,
  };
}

/* --------------------------------------------------------------- stand-ins */

export interface StandIn {
  symbol: string;
  why: string;
}

/**
 * Mints that look like money and are not.
 *
 * `pairables/devnet-usd.json` is the file that made this necessary: devnet
 * has no USDC, so the quote leg on that cluster is a token whose mint
 * authority we hold. Every dollar figure on a devnet market is denominated
 * in something we can print, and the file itself says the UI has to say so
 * rather than showing a dollar sign.
 */
export const STAND_INS: Record<string, StandIn> = {
  [devnetUsd.mint]: {
    symbol: devnetUsd.symbol,
    why: `${devnetUsd.symbol} is a stand-in for USDC on ${devnetUsd.cluster}, minted by this project because devnet has no USDC. Its supply is printable, so every dollar figure quoted against it is a dollar figure in a token we can create at will.`,
  },
  So11111111111111111111111111111111111111112: {
    symbol: "wSOL",
    why: "Wrapped SOL. A real asset and a real quote leg, but not a dollar: figures denominated in it move with SOL.",
  },
};

/** The stand-in warning for a mint, or null when the mint is what it claims. */
export function standIn(mint: string | null | undefined): StandIn | null {
  if (!mint) return null;
  const s = STAND_INS[mint];
  // wSOL is a real asset, so it is described but never flagged as a fake
  // dollar. Only mints this project can print are the honesty problem.
  return s && mint === devnetUsd.mint ? s : null;
}

/** Symbol for a mint we recognise, else null. Never guessed from anything. */
export function mintSymbol(mint: string): string | null {
  if (STAND_INS[mint]) return STAND_INS[mint].symbol;
  if (mint === "HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzpKcFu7uBEDKtr") return "EURC";
  if (mint === "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v") return "USDC";
  return null;
}
