/* eslint-disable @typescript-eslint/no-explicit-any --
 * The one `any` is the caught error in `isRateLimit`, which may be anything a
 * fetch, an RPC client or a rejected promise threw. */
/**
 * One `getProgramAccounts` at a time, with a gap between them.
 *
 * The app makes seven filtered scans across three programs and it makes them
 * on whatever RPC the URL names. Fired together against the public devnet
 * endpoint they come back as `429 Too many requests for a specific RPC call`
 * - a per-method limit, and `getProgramAccounts` is the method it is
 * strictest about. React's StrictMode doubles them again in development, so
 * a first paint was reliably firing eighteen scans inside one tick and the
 * registry rendered "cannot reach the cluster" against a cluster that was
 * fine.
 *
 * A queue rather than a cache: the point of this app is that what it draws
 * is chain state at a block, so the fix has to be to ask more politely, not
 * to ask less often and show something older than it claims.
 */

const GAP_MS = 250;

let tail: Promise<unknown> = Promise.resolve();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const isRateLimit = (e: any) =>
  /429|too many requests/i.test(e?.message ?? String(e ?? ""));

/**
 * Queue a call, and retry it once if the endpoint says it is being asked too
 * often. One retry, not a loop: past that the answer is a better RPC, and a
 * UI that silently retries forever is a UI that never reports the outage.
 */
export function serial<T>(fn: () => Promise<T>): Promise<T> {
  const run = tail.then(async () => {
    try {
      return await fn();
    } catch (e) {
      if (!isRateLimit(e)) throw e;
      await sleep(600);
      return await fn();
    } finally {
      await sleep(GAP_MS);
    }
  });
  // The shared tail must never hold a rejection, or one failed scan would
  // reject every call queued behind it.
  tail = run.catch(() => undefined);
  return run;
}

/**
 * One in-flight load per key, shared by everybody who asks for it.
 *
 * StrictMode mounts every effect twice in development, so the first paint
 * fired two identical sweeps across three programs and doubled the traffic
 * that trips the limit above. In production it does the other half of the
 * job: a poll that has not come back yet is not started again by the next
 * tick of the interval.
 */
const inflight = new Map<string, Promise<unknown>>();

export function share<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hit = inflight.get(key) as Promise<T> | undefined;
  if (hit) return hit;
  const run = fn().finally(() => inflight.delete(key));
  inflight.set(key, run);
  return run;
}
