"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { DaySummary } from "@/app/api/user/meals/month/route";

/* ── Ring geometry ───────────────────────────────────────── */
const SIZE = 44;
const CX   = SIZE / 2;
const R1   = 16;        // outer ring radius
const R2   = 9.5;       // inner (overflow) ring radius
const SW   = 2.8;
const C1   = 2 * Math.PI * R1;
const C2   = 2 * Math.PI * R2;

/* ── Color helpers ───────────────────────────────────────── */
type RGB = [number, number, number];
const DARK_BLUE: RGB = [30,  80, 160];
const GREEN:     RGB = [34, 197,  94];
const YELLOW:    RGB = [250, 204,  21];
const ORANGE:    RGB = [249, 115,  22];
const RED:       RGB = [239,  68,  68];

function lerp(a: RGB, b: RGB, t: number): string {
  const k = Math.max(0, Math.min(1, t));
  return `rgb(${Math.round(a[0]+(b[0]-a[0])*k)},${Math.round(a[1]+(b[1]-a[1])*k)},${Math.round(a[2]+(b[2]-a[2])*k)})`;
}

function ringColor(pct: number): string {
  if (pct <= 1.05) {
    // 5% → dark blue  …  100% → green
    return lerp(DARK_BLUE, GREEN, (pct - 0.05) / 0.95);
  }
  // Over goal: yellow → orange → red
  const t = (pct - 1.05) / 0.75;
  return t < 0.5
    ? lerp(YELLOW, ORANGE, t * 2)
    : lerp(ORANGE, RED, (t - 0.5) * 2);
}

/* ── Single day circle ───────────────────────────────────── */
function DayCircle({
  day, date, calories, goalCalories, isToday, isSelected, isFuture, onClick,
}: {
  day:          number;
  date:         string;
  calories:     number | null;
  goalCalories: number;
  isToday:      boolean;
  isSelected:   boolean;
  isFuture:     boolean;
  onClick:      () => void;
}) {
  const pct     = calories != null && goalCalories > 0 ? calories / goalCalories : null;
  const hasData = pct !== null && pct >= 0.05;

  // Outer ring: capped at 100%
  const baseFill = hasData ? Math.min(pct!, 1) : 0;
  const baseDash = `${baseFill * C1} ${C1}`;

  // Inner overflow ring: only when > 105%, same color
  const overflow     = hasData && pct! > 1.05 ? Math.min(pct! - 1, 1) : 0;
  const overflowDash = `${overflow * C2} ${C2}`;

  // Both rings use same color
  const color = hasData ? ringColor(pct!) : "transparent";

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0 flex-shrink-0 rounded-lg transition-colors
        ${isFuture ? "opacity-30 cursor-default" : "hover:bg-surface-2 cursor-pointer"}
        ${isSelected && !isToday ? "bg-surface-2" : ""}
      `}
      style={{ width: SIZE + 8, paddingTop: 4, paddingBottom: 4 }}
      disabled={isFuture}
    >
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="absolute inset-0">
          {/* Track */}
          <circle
            cx={CX} cy={CX} r={R1}
            fill="none" stroke="currentColor" strokeWidth={SW}
            className="text-border-soft" opacity={0.2}
          />
          {/* Base progress ring (0–100%) */}
          {hasData && (
            <circle
              cx={CX} cy={CX} r={R1}
              fill="none" stroke={color} strokeWidth={SW}
              strokeDasharray={baseDash} strokeLinecap="round"
              transform={`rotate(-90 ${CX} ${CX})`}
            />
          )}
          {/* Overflow ring — inner, same color as outer */}
          {overflow > 0 && (
            <circle
              cx={CX} cy={CX} r={R2}
              fill="none" stroke={color} strokeWidth={SW}
              strokeDasharray={overflowDash} strokeLinecap="round"
              transform={`rotate(-90 ${CX} ${CX})`}
              opacity={0.85}
            />
          )}
        </svg>

        {/* Day number */}
        <span
          className={`absolute inset-0 flex items-center justify-center text-[11px] font-medium
            ${isToday ? "text-accent font-bold" : isSelected ? "text-text" : "text-text-muted"}`}
        >
          {day}
        </span>
      </div>

      {/* Today dot indicator */}
      {isToday && (
        <span className="w-1 h-1 rounded-full bg-accent mt-0.5" />
      )}
    </button>
  );
}

/* ── DayBar ──────────────────────────────────────────────── */
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

interface Props {
  goalCalories:   number;
  selectedDate:   string;
  onSelectDate:   (date: string) => void;
  refreshKey?:    number;
}

export default function DayBar({ goalCalories, selectedDate, onSelectDate, refreshKey }: Props) {
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

  useEffect(() => { load(); }, [load, refreshKey]);

  // Scroll selected date into center
  useEffect(() => {
    if (todayRef.current && scrollRef.current) {
      const el     = todayRef.current;
      const parent = scrollRef.current;
      parent.scrollLeft = el.offsetLeft + el.offsetWidth / 2 - parent.clientWidth / 2;
    }
  }, [summaries]);

  const calMap = Object.fromEntries(summaries.map((s) => [s.date, s.calories]));

  return (
    <div className="bg-surface border border-border-soft rounded-2xl px-4 py-3
                    shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
        {MONTHS[month]} {year}
      </p>

      <div ref={scrollRef} className="overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        <div className="flex gap-0.5 pb-1" style={{ minWidth: "max-content" }}>
          {summaries.map((s) => {
            const dayNum   = parseInt(s.date.split("-")[2]);
            const isToday  = s.date === today;
            const isFuture = s.date > today;

            return (
              <div key={s.date} ref={isToday ? todayRef : undefined}>
                <DayCircle
                  day={dayNum}
                  date={s.date}
                  calories={calMap[s.date] ?? null}
                  goalCalories={goalCalories}
                  isToday={isToday}
                  isSelected={s.date === selectedDate}
                  isFuture={isFuture}
                  onClick={() => !isFuture && onSelectDate(s.date)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
