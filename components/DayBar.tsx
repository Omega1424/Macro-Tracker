"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { DaySummary } from "@/app/api/user/meals/month/route";

/* ── Ring geometry ───────────────────────────────────────── */
const SIZE   = 44;
const CX     = SIZE / 2;
const R1     = 16;   // outer ring radius
const R2     = 9.5;  // inner (overflow) ring radius
const SW     = 2.8;  // stroke width
const C1     = 2 * Math.PI * R1;
const C2     = 2 * Math.PI * R2;

/* ── Color helpers ───────────────────────────────────────── */
type RGB = [number, number, number];

const DARK_BLUE: RGB = [30,  80, 160];
const GREEN:     RGB = [34, 197,  94];
const YELLOW:    RGB = [250, 204, 21];
const ORANGE:    RGB = [249, 115,  22];
const RED:       RGB = [239,  68,  68];

function lerp(a: RGB, b: RGB, t: number): string {
  const k = Math.max(0, Math.min(1, t));
  return `rgb(${Math.round(a[0]+(b[0]-a[0])*k)},${Math.round(a[1]+(b[1]-a[1])*k)},${Math.round(a[2]+(b[2]-a[2])*k)})`;
}

function ringColor(pct: number): string {
  if (pct <= 1.05) {
    // 5% → dark blue … 100% → green
    return lerp(DARK_BLUE, GREEN, (pct - 0.05) / 0.95);
  }
  // Over: 105% yellow … 150% orange … 200%+ red
  const t = (pct - 1.05) / 0.75;
  return t < 0.5
    ? lerp(YELLOW, ORANGE, t * 2)
    : lerp(ORANGE, RED, (t - 0.5) * 2);
}

/* ── Single day circle ───────────────────────────────────── */
function DayCircle({
  day, calories, goalCalories, isToday, isFuture,
}: {
  day:          number;
  calories:     number | null;
  goalCalories: number;
  isToday:      boolean;
  isFuture:     boolean;
}) {
  const pct    = calories != null && goalCalories > 0 ? calories / goalCalories : null;
  const hasData = pct !== null && pct >= 0.05;

  // Base ring fill (0 → 100%)
  const baseFill   = hasData ? Math.min(pct!, 1) : 0;
  const baseDash   = `${baseFill * C1} ${C1}`;

  // Overflow ring (when > 100%)
  const overflow     = hasData && pct! > 1.05 ? Math.min(pct! - 1, 1) : 0;
  const overflowDash = `${overflow * C2} ${C2}`;

  const color = hasData ? ringColor(pct!) : "transparent";

  return (
    <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
      <div
        className={`relative rounded-full transition-all ${
          isToday ? "ring-2 ring-accent ring-offset-1 ring-offset-bg" : ""
        } ${isFuture ? "opacity-30" : ""}`}
        style={{ width: SIZE, height: SIZE }}
      >
        <svg width={SIZE} height={SIZE} className="absolute inset-0">
          {/* Track */}
          <circle
            cx={CX} cy={CX} r={R1}
            fill="none"
            stroke="currentColor"
            strokeWidth={SW}
            className="text-border-soft"
            opacity={0.3}
          />

          {/* Base progress ring */}
          {hasData && (
            <circle
              cx={CX} cy={CX} r={R1}
              fill="none"
              stroke={color}
              strokeWidth={SW}
              strokeDasharray={baseDash}
              strokeLinecap="round"
              transform={`rotate(-90 ${CX} ${CX})`}
            />
          )}

          {/* Overflow ring (inner, shown when over goal) */}
          {overflow > 0 && (
            <circle
              cx={CX} cy={CX} r={R2}
              fill="none"
              stroke={color}
              strokeWidth={SW}
              strokeDasharray={overflowDash}
              strokeLinecap="round"
              transform={`rotate(-90 ${CX} ${CX})`}
              opacity={0.85}
            />
          )}
        </svg>

        {/* Day number */}
        <span
          className={`absolute inset-0 flex items-center justify-center text-[11px] font-medium
            ${isToday ? "text-accent" : calories !== null ? "text-text" : "text-text-muted"}`}
        >
          {day}
        </span>
      </div>

      {/* Calorie label under circle — only if has data */}
      {calories !== null && !isFuture && (
        <span className="text-[9px] text-text-muted tabular leading-none">
          {calories >= 1000 ? `${(calories / 1000).toFixed(1)}k` : calories}
        </span>
      )}
    </div>
  );
}

/* ── Month label ─────────────────────────────────────────── */
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ── DayBar ──────────────────────────────────────────────── */
interface Props {
  goalCalories: number;
}

export default function DayBar({ goalCalories }: Props) {
  const [summaries, setSummaries] = useState<DaySummary[]>([]);
  const todayRef  = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().split("T")[0];
  const now   = new Date();
  const year  = now.getUTCFullYear();
  const month = now.getUTCMonth();

  const load = useCallback(() => {
    fetch("/api/user/meals/month")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setSummaries(data); })
      .catch(console.error);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-scroll today into center
  useEffect(() => {
    if (todayRef.current && scrollRef.current) {
      const el       = todayRef.current;
      const parent   = scrollRef.current;
      const elCenter = el.offsetLeft + el.offsetWidth / 2;
      parent.scrollLeft = elCenter - parent.clientWidth / 2;
    }
  }, [summaries]);

  const calMap = Object.fromEntries(summaries.map((s) => [s.date, s.calories]));

  return (
    <div className="bg-surface border border-border-soft rounded-2xl px-4 py-3
                    shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
        {MONTHS[month]} {year}
      </p>

      {/* Scrollable strip */}
      <div
        ref={scrollRef}
        className="overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="flex gap-2 pb-1" style={{ minWidth: "max-content" }}>
          {summaries.map((s) => {
            const dayNum  = parseInt(s.date.split("-")[2]);
            const isToday = s.date === today;
            const isFuture = s.date > today;

            return (
              <div key={s.date} ref={isToday ? todayRef : undefined}>
                <DayCircle
                  day={dayNum}
                  calories={calMap[s.date] ?? null}
                  goalCalories={goalCalories}
                  isToday={isToday}
                  isFuture={isFuture}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 pt-2 border-t border-border-soft">
        <LegendItem color="rgb(30,80,160)" label="Far under" />
        <LegendItem color="rgb(34,197,94)" label="On target" />
        <LegendItem color="rgb(250,204,21)" label="Over" />
        <LegendItem color="rgb(239,68,68)" label="Way over" />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
      <span className="text-[10px] text-text-muted">{label}</span>
    </div>
  );
}
