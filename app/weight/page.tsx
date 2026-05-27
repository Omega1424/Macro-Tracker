"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter }  from "next/navigation";
import Link           from "next/link";
import { useTheme }   from "@/lib/theme";
import ThemeToggle    from "@/components/ThemeToggle";

interface WeightEntry { date: string; kg: number; }

/* ── SVG line chart ─────────────────────────────────────── */
const VW   = 800;
const VH   = 220;
const PAD  = { top: 16, right: 16, bottom: 36, left: 48 };
const INNER_W = VW - PAD.left - PAD.right;
const INNER_H = VH - PAD.top  - PAD.bottom;

function smoothPath(pts: [number, number][]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0][0]} ${pts[0][1]}`;
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[Math.max(i - 1, 0)];
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[i + 1];
    const [x3, y3] = pts[Math.min(i + 2, pts.length - 1)];
    const cp1x = x1 + (x2 - x0) / 6;
    const cp1y = y1 + (y2 - y0) / 6;
    const cp2x = x2 - (x3 - x1) / 6;
    const cp2y = y2 - (y3 - y1) / 6;
    d += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${x2} ${y2}`;
  }
  return d;
}

function WeightChart({ entries }: { entries: WeightEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-text-muted">
        <span className="text-4xl mb-3">⚖️</span>
        <p className="text-sm">No weight entries yet.</p>
        <p className="text-xs mt-1">Log your weight on the main page.</p>
      </div>
    );
  }

  const weights = entries.map((e) => e.kg);
  const minW    = Math.min(...weights);
  const maxW    = Math.max(...weights);
  const range   = Math.max(maxW - minW, 2);   // avoid division by zero
  const padded  = { min: minW - range * 0.15, max: maxW + range * 0.15 };

  const toX = (i: number) =>
    entries.length === 1
      ? PAD.left + INNER_W / 2
      : PAD.left + (i / (entries.length - 1)) * INNER_W;

  const toY = (kg: number) =>
    PAD.top + INNER_H - ((kg - padded.min) / (padded.max - padded.min)) * INNER_H;

  const pts: [number, number][] = entries.map((e, i) => [toX(i), toY(e.kg)]);
  const linePath = smoothPath(pts);

  // Closed fill path (line + bottom border)
  const fillPath = entries.length > 1
    ? `${linePath} L ${pts[pts.length - 1][0]} ${PAD.top + INNER_H} L ${pts[0][0]} ${PAD.top + INNER_H} Z`
    : "";

  // Y-axis tick labels (3–4 ticks)
  const ticks = 4;
  const yTicks = Array.from({ length: ticks }, (_, i) => {
    const kg = padded.min + ((padded.max - padded.min) * i) / (ticks - 1);
    return { kg, y: toY(kg) };
  });

  // X-axis labels: show every Nth to avoid crowding
  const maxLabels = 7;
  const step = Math.max(1, Math.ceil(entries.length / maxLabels));
  const xLabels = entries
    .filter((_, i) => i % step === 0 || i === entries.length - 1)
    .map((e, _, arr) => {
      const idx = entries.indexOf(e);
      return { x: toX(idx), label: formatShortDate(e.date) };
    });

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      className="w-full h-auto"
      style={{ overflow: "visible" }}
      aria-label="Weight progress chart"
    >
      <defs>
        <linearGradient id="wfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="var(--color-accent, #22c55e)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--color-accent, #22c55e)" stopOpacity="0"   />
        </linearGradient>
        {/* Subtle grid line color */}
      </defs>

      {/* Horizontal grid lines */}
      {yTicks.map(({ y }, i) => (
        <line key={i} x1={PAD.left} x2={PAD.left + INNER_W} y1={y} y2={y}
          stroke="currentColor" strokeWidth={0.5} className="text-border-soft" opacity={0.4} />
      ))}

      {/* Y-axis labels */}
      {yTicks.map(({ kg, y }, i) => (
        <text key={i} x={PAD.left - 6} y={y + 4} textAnchor="end"
          className="fill-current text-text-muted" fontSize={11} fontFamily="inherit">
          {kg.toFixed(1)}
        </text>
      ))}

      {/* X-axis labels */}
      {xLabels.map(({ x, label }, i) => (
        <text key={i} x={x} y={VH - 4} textAnchor="middle"
          className="fill-current text-text-muted" fontSize={10} fontFamily="inherit">
          {label}
        </text>
      ))}

      {/* Fill */}
      {fillPath && (
        <path d={fillPath} fill="url(#wfill)" />
      )}

      {/* Line */}
      {entries.length > 1 && (
        <path d={linePath} fill="none"
          stroke="var(--color-accent, #22c55e)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      )}

      {/* Dots */}
      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={5} fill="var(--color-accent, #22c55e)" opacity={0.9} />
          <circle cx={x} cy={y} r={3} fill="var(--color-bg, #0f0f0f)" />
          <title>{entries[i].date}: {entries[i].kg} kg</title>
        </g>
      ))}
    </svg>
  );
}

function formatShortDate(date: string) {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatDate(date: string) {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

/* ── Page ───────────────────────────────────────────────── */
export default function WeightPage() {
  const { data: session, status } = useSession();
  const { pref: themePref, cycle: cycleTheme } = useTheme();
  const router = useRouter();

  const [entries,  setEntries]  = useState<WeightEntry[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const load = useCallback(() => {
    fetch("/api/user/weight")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => { setEntries(data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { if (status === "authenticated") load(); }, [status, load]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <span className="text-sm text-text-muted animate-pulse">Loading…</span>
      </div>
    );
  }

  const sorted  = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const latest  = sorted[sorted.length - 1];
  const first   = sorted[0];
  const change  = latest && first && latest !== first ? latest.kg - first.kg : null;

  /* 30-day subset for graph, full list for table */
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 89);
  const cutoffStr = cutoff.toISOString().split("T")[0];
  const chartEntries = sorted.filter((e) => e.date >= cutoffStr);

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-md border-b border-border-soft px-4 sm:px-6">
        <div className="max-w-3xl mx-auto h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-text-muted hover:text-text transition-colors text-sm">
              ← Back
            </Link>
            <span className="text-text-muted">·</span>
            <span className="text-sm font-semibold text-text">⚖️ Weight Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle pref={themePref} onCycle={cycleTheme} />
            {session?.user?.email && (
              <span className="hidden sm:inline text-xs text-text-muted truncate max-w-[120px]">
                {session.user.email}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">

        {/* Summary stats */}
        {sorted.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard label="Current" value={`${latest.kg} kg`} sub={formatShortDate(latest.date)} />
            {first !== latest && (
              <StatCard label="Starting" value={`${first.kg} kg`} sub={formatShortDate(first.date)} />
            )}
            {change !== null && (
              <StatCard
                label="Total change"
                value={`${change > 0 ? "+" : ""}${change.toFixed(1)} kg`}
                sub={`over ${sorted.length} entries`}
                accent={change < 0 ? "text-accent" : change > 0 ? "text-orange-400" : "text-text-muted"}
              />
            )}
          </div>
        )}

        {/* Chart */}
        <div className="bg-surface border border-border-soft rounded-2xl p-5
                        shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              {chartEntries.length > 0
                ? `Last ${chartEntries.length === sorted.length ? sorted.length : "90 days"}`
                : "All time"}
            </p>
            <span className="text-xs text-text-muted">{sorted.length} entries</span>
          </div>
          <WeightChart entries={chartEntries.length > 0 ? chartEntries : sorted} />
        </div>

        {/* Log table */}
        {sorted.length > 0 && (
          <div className="bg-surface border border-border-soft rounded-2xl overflow-hidden
                          shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="px-5 py-3 border-b border-border-soft">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">History</p>
            </div>
            <div className="divide-y divide-border-soft max-h-80 overflow-y-auto">
              {[...sorted].reverse().map((e) => (
                <div key={e.date} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-text-muted">{formatDate(e.date)}</span>
                  <span className="text-sm font-medium tabular text-text">{e.kg} kg</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, sub, accent }: {
  label: string; value: string; sub: string; accent?: string;
}) {
  return (
    <div className="bg-surface border border-border-soft rounded-2xl px-4 py-3
                    shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className={`text-lg font-semibold tabular ${accent ?? "text-text"}`}>{value}</p>
      <p className="text-xs text-text-muted mt-0.5">{sub}</p>
    </div>
  );
}
