@AGENTS.md

# Who is working on what

Several Claude instances run on this machine at once. Add your row before you
write a file, not when you finish.

| Since | Instance | Files | Notes |
|---|---|---|---|
| 2026-08-27 | peard-launch | `lib/peard/official.ts`, `lib/peard/ohlc.ts`, `lib/peard/jupiter.ts`, `lib/peard/launches.ts`, `app/page.tsx`, `app/token/[symbol]/*`, `app/globals.css` | pearD launch tracker, real chart, buy/sell panel |

## Ports

This app dev-serves on **3200**. `lsof -ti :3200` before binding; 3000 is not
assumed free and 8899/8999/8799 belong to other trees.

## Two things that will bite you

**`NEXT_PUBLIC_*` is inlined into the client bundle.** The Helius key in the
untracked `.env.local` ships to every visitor once this is built and hosted.
Restrict it by origin or proxy the reads before any public deploy.

**Reads and writes spell the same IDL differently.** `chain.ts` decodes with a
bare `BorshAccountsCoder` (PascalCase account names, snake_case fields);
`tx.ts` builds through `Program` (camelCase both). Mixing them gives you
`undefined` at runtime with no throw and no type error.
