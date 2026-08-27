"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { RANGES, type Candle, type RangeKey } from "@/lib/peard/token-data";

/**
 * The price chart, drawn here from real candles.
 *
 * It replaces a DexScreener iframe that rendered its own toolbar around the
 * words "No data here" for a token that had traded 473 times that day. An
 * embed is somebody else's page inside a box: it cannot be told the app's
 * colours, it cannot be made to fit a 280px panel, and when it fails it
 * fails in a way nothing here can detect or explain.
 *
 * Drawn as an area rather than as candlesticks, because of who this is for.
 * A token an hour old has two or three buckets, and three candlesticks in a
 * wide panel look like a rendering fault; a line through three points looks
 * like a young chart, which is what it is.
 */

const H = 260;
const VOL_H = 30;
const PAD_T = 12;
const PAD_B = 26;
const PAD_R = 78;

const UP = "#7fd396";
const DOWN = "#dd9999";
const GRID = "rgba(255,255,255,.07)";
const AXIS = "#8e9d92";

/** Two decimals everywhere: SVG coordinates from floats differ across
 *  renderers, and rounding once here keeps the paths stable. */
const r2 = (n: number) => Math.round(n * 100) / 100;

function priceLabel(v: number): string {
  if (!Number.isFinite(v)) return "";
  if (v >= 1000) return `$${Math.round(v).toLocaleString()}`;
  if (v >= 1) return `$${v.toFixed(2)}`;
  if (v >= 0.01) return `$${v.toFixed(4)}`;
  return `$${v.toPrecision(3)}`;
}

function timeLabel(t: number, range: RangeKey): string {
  const d = new Date(t * 1000);
  if (range === "ALL") return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (range === "1W") return d.toLocaleDateString(undefined, { weekday: "short" });
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function PriceChart({
  candles,
  range,
  onRange,
  state,
}: {
  candles: Candle[];
  range: RangeKey;
  onRange: (r: RangeKey) => void;
  /** What to say when there is nothing to draw. */
  state: { loading: boolean; awaiting: boolean; source: string | null };
}) {
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  // Gradients are referenced by id, and two charts on one page must not
  // share one. `useId` is stable across renders and unique per instance,
  // which a random value read during render is neither.
  const gradId = `pc-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    setW(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  // A single candle is a real answer for a token minutes old. Doubling it
  // gives the line two endpoints to run between and reads as flat, which is
  // exactly what one bucket means.
  const pts = useMemo(
    () => (candles.length === 1 ? [candles[0], candles[0]] : candles),
    [candles]
  );

  const geom = useMemo(() => {
    if (w === 0 || pts.length < 2) return null;
    const plotW = w - PAD_R;
    const plotH = H - PAD_T - PAD_B - VOL_H;

    const lows = pts.map((c) => c.l).filter((n) => n > 0);
    const highs = pts.map((c) => c.h).filter((n) => n > 0);
    let lo = Math.min(...lows);
    let hi = Math.max(...highs);
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) return null;
    if (hi === lo) { hi = lo * 1.005; lo = lo * 0.995; }
    const pad = (hi - lo) * 0.12;
    hi += pad;
    // Clamped, because a price cannot be negative and an axis that says it
    // can is worse than a slightly tighter one. A 30x range over the session
    // made the bottom gridline read "$-0.00000972".
    lo = Math.max(lo - pad, lo * 0.5, 0);

    const x = (i: number) => r2((i / (pts.length - 1)) * plotW);
    const y = (v: number) => r2(PAD_T + plotH - ((v - lo) / (hi - lo)) * plotH);

    const line = pts.map((c, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(c.c)}`).join(" ");
    const area = `${line} L${x(pts.length - 1)},${r2(PAD_T + plotH)} L${x(0)},${r2(PAD_T + plotH)} Z`;

    const maxVol = Math.max(...pts.map((c) => c.v), 1);
    const barW = Math.max(1, r2((plotW / pts.length) * 0.62));
    const volTop = PAD_T + plotH + 14;

    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
      v: lo + (hi - lo) * (1 - f),
      y: r2(PAD_T + plotH * f),
    }));

    return { plotW, plotH, lo, hi, x, y, line, area, maxVol, barW, volTop, ticks };
  }, [w, pts]);

  const first = pts[0]?.c ?? 0;
  const last = pts[pts.length - 1]?.c ?? 0;
  const rising = last >= first;
  const stroke = rising ? UP : DOWN;

  const active = hover !== null && geom ? pts[hover] : null;

  return (
    <div className="pc">
      <div className="pc-periods" role="tablist" aria-label="Chart range">
        {(Object.keys(RANGES) as RangeKey[]).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={k === range}
            className={k === range ? "active" : ""}
            onClick={() => onRange(k)}
          >
            {RANGES[k].label}
          </button>
        ))}
      </div>

      <div className="pc-box" ref={box}>
        {geom ? (
          <svg
            width={w}
            height={H}
            role="img"
            aria-label={`Price over the last ${RANGES[range].label}, ${priceLabel(last)} now, ${rising ? "up" : "down"} over the range`}
            onMouseLeave={() => setHover(null)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const rel = e.clientX - rect.left;
              if (rel > geom.plotW) { setHover(null); return; }
              const i = Math.round((rel / geom.plotW) * (pts.length - 1));
              setHover(Math.max(0, Math.min(pts.length - 1, i)));
            }}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity="0.34" />
                <stop offset="100%" stopColor={stroke} stopOpacity="0" />
              </linearGradient>
            </defs>

            {geom.ticks.map((t, i) => (
              <g key={i}>
                <line x1="0" y1={t.y} x2={geom.plotW} y2={t.y} stroke={GRID} strokeWidth="1" />
                <text x={geom.plotW + 8} y={t.y + 4} fill={AXIS} fontSize="10" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {priceLabel(t.v)}
                </text>
              </g>
            ))}

            <path d={geom.area} fill={`url(#${gradId})`} />
            <path d={geom.line} fill="none" stroke={stroke} strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />

            {pts.map((c, i) => {
              const h = r2(Math.max(1, (c.v / geom.maxVol) * VOL_H));
              return (
                <rect
                  key={i}
                  x={r2(geom.x(i) - geom.barW / 2)}
                  y={r2(geom.volTop + VOL_H - h)}
                  width={geom.barW}
                  height={h}
                  fill={c.c >= c.o ? UP : DOWN}
                  opacity={hover === i ? 0.85 : 0.45}
                />
              );
            })}

            <circle cx={geom.x(pts.length - 1)} cy={geom.y(last)} r="3.5" fill={stroke} />

            {active && hover !== null ? (
              <g pointerEvents="none">
                <line x1={geom.x(hover)} y1={PAD_T} x2={geom.x(hover)} y2={r2(PAD_T + geom.plotH)} stroke="rgba(255,255,255,.28)" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx={geom.x(hover)} cy={geom.y(active.c)} r="4" fill={stroke} stroke="#1b241d" strokeWidth="2" />
              </g>
            ) : null}

            <text x="0" y={H - 6} fill={AXIS} fontSize="10">{timeLabel(pts[0].t, range)}</text>
            <text x={geom.plotW} y={H - 6} fill={AXIS} fontSize="10" textAnchor="end">
              {timeLabel(pts[pts.length - 1].t, range)}
            </text>
          </svg>
        ) : (
          <div className="pc-empty">
            <span>
              {state.awaiting
                ? "Not launched yet"
                : state.loading
                  ? "Reading the market"
                  : "No trades yet"}
            </span>
            <p>
              {state.awaiting
                ? "Nothing is deployed at this address. The chart starts drawing itself the moment it is."
                : state.loading
                  ? "Fetching price history."
                  : "The token exists and nothing has traded yet. The first trade draws the first point."}
            </p>
          </div>
        )}

        {active ? (
          <div className="pc-tip" style={{ left: Math.min(Math.max(0, geom!.x(hover!) - 60), Math.max(0, w - PAD_R - 120)) }}>
            <b>{priceLabel(active.c)}</b>
            <span>{new Date(active.t * 1000).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            <span>vol {active.v >= 1000 ? `$${(active.v / 1000).toFixed(1)}K` : `$${active.v.toFixed(0)}`}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
