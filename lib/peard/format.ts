/**
 * Formatting rules, in one place.
 *
 * The product's whole job is showing one number denominated in another, and
 * those numbers span fourteen orders of magnitude - $0.44 for a pack of
 * ramen, $350bn for SpaceX. So nothing here formats by a fixed decimal
 * count; everything picks precision from the value's own size.
 */

/** A quantity, with precision chosen from its magnitude. */
export function qty(n: number, maxSig = 4): string {
  if (!Number.isFinite(n)) return "-";
  const a = Math.abs(n);
  if (a === 0) return "0";
  if (a >= 1e12) return `${trim(n / 1e12)}T`;
  if (a >= 1e9) return `${trim(n / 1e9)}B`;
  if (a >= 1e6) return `${trim(n / 1e6)}M`;
  if (a >= 1e4) return Math.round(n).toLocaleString("en-US");
  if (a >= 1) return trim(n, 2);
  // Below a dollar the leading zeros are the information, so keep enough
  // significant figures rather than a fixed number of decimals.
  const lead = Math.floor(Math.log10(a));
  return trim(n, Math.min(12, -lead + maxSig - 1));
}

function trim(n: number, dp = 2): string {
  return n
    .toFixed(dp)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
}

/**
 * Money.
 *
 * Two rules that a fixed decimal count gets wrong in opposite directions.
 * Above a dollar, cents are always shown - trimming $126.50 to "$126.5"
 * reads as a truncation bug in a column of money. Below a dollar, four
 * decimals is not enough: a token at $0.00005 renders as "$0.0001", which is
 * off by a factor of two and looks authoritative while being wrong. So small
 * amounts get significant figures instead.
 */
export function usd(n: number): string {
  if (!Number.isFinite(n)) return "-";
  const a = Math.abs(n);
  if (a >= 1e9) return `$${trim(n / 1e9)}B`;
  if (a >= 1e6) return `$${trim(n / 1e6)}M`;
  if (a >= 1000) return `$${Math.round(n).toLocaleString("en-US")}`;
  if (a >= 1) return `$${n.toFixed(2)}`;
  if (a === 0) return "$0";
  // Below a dollar, significant figures rather than fixed places, so a token
  // worth $0.00005 does not render as $0.0001. But never fewer than two
  // places: sixty cents is "$0.60", and "$0.6" reads like a rounding error
  // in a column of prices.
  const lead = Math.floor(Math.log10(a));
  const places = Math.max(2, Math.min(12, -lead + 2));
  const out = trim(n, places);
  return `$${out.includes(".") && out.split(".")[1].length === 1 ? `${out}0` : out}`;
}

/** "1 push", "3 pushes". */
export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;
}

export function pct(n: number, dp = 1): string {
  return `${(n * 100).toFixed(dp)}%`;
}

export function bps(n: number): string {
  return `${Math.round(n)}bps`;
}

/** "4m", "3h", "2d" - short enough for a table cell. */
export function ago(ts: number, now = Date.now() / 1000): string {
  if (!ts) return "never";
  const s = Math.max(0, now - ts);
  if (s < 60) return `${Math.round(s)}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}

export function date(ts: number): string {
  if (!ts) return "-";
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

export function short(addr: string, n = 4): string {
  return `${addr.slice(0, n)}…${addr.slice(-n)}`;
}
