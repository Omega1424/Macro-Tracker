"use client";

import { useMemo } from "react";
import type { MacroTotals } from "@/lib/macros";

interface Props {
  totals: MacroTotals;
  size?: number;
}

const RADIUS      = 44;
const STROKE      = 12;
const VIEWBOX     = 120;
const CENTER      = VIEWBOX / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Macro colors for donut segments
const COLORS = {
  protein: "#0EA5E9", // sky-500
  carbs:   "#F59E0B", // amber-500
  fat:     "#EC4899", // pink-500
};

interface Segment {
  key: keyof typeof COLORS;
  calContrib: number;
}

export default function MacroDonut({ totals, size = 120 }: Props) {
  const segments = useMemo<Segment[]>(() => [
    { key: "protein", calContrib: totals.protein * 4 },
    { key: "carbs",   calContrib: totals.carbs   * 4 },
    { key: "fat",     calContrib: totals.fat      * 9 },
  ], [totals]);

  const total = segments.reduce((s, seg) => s + seg.calContrib, 0);
  const isEmpty = total === 0;

  // Build arc data
  const arcs = useMemo(() => {
    if (isEmpty) return [];
    let offset = 0;
    return segments.map((seg) => {
      const pct   = seg.calContrib / total;
      const dash  = pct * CIRCUMFERENCE;
      const gap   = CIRCUMFERENCE - dash;
      const rotation = -90 + (offset / CIRCUMFERENCE) * 360;
      offset += dash;
      return { ...seg, dash, gap, rotation };
    });
  }, [segments, total, isEmpty]);

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        aria-label={`Macro breakdown: ${totals.protein}g protein, ${totals.carbs}g carbs, ${totals.fat}g fat`}
        role="img"
      >
        {/* Track */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="var(--color-surface-2)"
          strokeWidth={STROKE}
        />

        {isEmpty ? (
          /* Empty state ring */
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={STROKE}
            strokeDasharray={`${CIRCUMFERENCE * 0.25} ${CIRCUMFERENCE * 0.75}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
          />
        ) : (
          arcs.map((arc) => (
            <circle
              key={arc.key}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={COLORS[arc.key]}
              strokeWidth={STROKE}
              strokeDasharray={`${arc.dash} ${arc.gap}`}
              strokeLinecap="butt"
              transform={`rotate(${arc.rotation} ${CENTER} ${CENTER})`}
              style={{ transition: "stroke-dasharray 300ms cubic-bezier(0.16,1,0.3,1)" }}
            />
          ))
        )}

        {/* Centre text */}
        <text
          x={CENTER}
          y={CENTER - 6}
          textAnchor="middle"
          dominantBaseline="middle"
          className="tabular"
          style={{
            fontSize: "18px",
            fontWeight: 600,
            fill: "var(--color-text)",
            fontFamily: "var(--font-inter)",
            fontFeatureSettings: '"tnum"',
          }}
        >
          {totals.calories.toLocaleString()}
        </text>
        <text
          x={CENTER}
          y={CENTER + 12}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: "10px",
            fill: "var(--color-text-muted)",
            fontFamily: "var(--font-inter)",
          }}
        >
          kcal
        </text>
      </svg>

      {/* Legend */}
      {!isEmpty && (
        <div className="flex items-center gap-3 text-xs">
          {(["protein", "carbs", "fat"] as const).map((k) => (
            <div key={k} className="flex items-center gap-1.5">
              <span
                className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: COLORS[k] }}
              />
              <span className="text-text-2 capitalize">{k}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
