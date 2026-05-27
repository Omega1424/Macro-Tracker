"use client";

import { useState } from "react";

const GLASS_ML  = 200;
const QUICK_ADD = [
  { label: "1 glass", ml: GLASS_ML },
  { label: "+250 ml", ml: 250 },
  { label: "+500 ml", ml: 500 },
];

interface Props {
  waterMl:  number;
  goalMl:   number;
  isFuture: boolean;
  onChange: (ml: number) => void;
}

export default function WaterTracker({ waterMl, goalMl, isFuture, onChange }: Props) {
  const [customOpen,  setCustomOpen]  = useState(false);
  const [customMode,  setCustomMode]  = useState<"glasses" | "ml">("glasses");
  const [customVal,   setCustomVal]   = useState("");

  const pct      = goalMl > 0 ? Math.min(waterMl / goalMl, 1) : 0;
  const pctLabel = goalMl > 0 ? Math.round((waterMl / goalMl) * 100) : 0;
  const glasses  = Math.round(waterMl / GLASS_ML * 10) / 10;  // e.g. 2.5 glasses

  const add    = (ml: number) => !isFuture && onChange(waterMl + ml);
  const remove = (ml: number) => !isFuture && onChange(Math.max(0, waterMl - ml));

  const handleCustomAdd = () => {
    const val = parseFloat(customVal);
    if (isNaN(val) || val <= 0) return;
    const ml = customMode === "glasses" ? val * GLASS_ML : val;
    add(Math.round(ml));
    setCustomVal("");
    setCustomOpen(false);
  };

  return (
    <section
      aria-label="Water intake"
      className="bg-surface border border-border-soft rounded-2xl px-5 py-4
                 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">💧</span>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Water</p>
        </div>
        <span className="text-xs font-medium text-blue-500 tabular">{pctLabel}%</span>
      </div>

      {/* Amount + goal */}
      <div className="flex items-baseline gap-1.5 mb-2">
        <span className="text-xl font-semibold tabular text-text">{waterMl}</span>
        <span className="text-sm text-text-muted">ml</span>
        <span className="text-xs text-text-muted ml-1">({glasses} glasses)</span>
        <span className="text-sm text-text-muted ml-auto">/ {goalMl} ml</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-border-soft overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${pct * 100}%` }}
        />
      </div>

      {/* Quick-add buttons */}
      {!isFuture && (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            {QUICK_ADD.map(({ label, ml }) => (
              <button
                key={label}
                type="button"
                onClick={() => add(ml)}
                className="text-xs px-3 py-1.5 rounded-full border border-blue-500/40
                           text-blue-500 hover:bg-blue-500/10 transition-colors"
              >
                +{label}
              </button>
            ))}

            {/* Custom button */}
            <button
              type="button"
              onClick={() => setCustomOpen((o) => !o)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors
                ${customOpen
                  ? "border-blue-500 bg-blue-500/10 text-blue-500"
                  : "border-border text-text-muted hover:border-blue-500/40 hover:text-blue-500"}`}
            >
              Custom
            </button>

            {/* Minus glass */}
            {waterMl > 0 && (
              <button
                type="button"
                onClick={() => remove(GLASS_ML)}
                className="text-xs px-3 py-1.5 rounded-full border border-border
                           text-text-muted hover:text-text transition-colors ml-auto"
              >
                −1 glass
              </button>
            )}
          </div>

          {/* Custom input panel */}
          {customOpen && (
            <div className="mt-3 p-3 bg-bg rounded-xl border border-border-soft flex flex-col gap-2">
              {/* Mode toggle */}
              <div className="flex gap-1 bg-surface rounded-lg p-0.5">
                {(["glasses", "ml"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => { setCustomMode(mode); setCustomVal(""); }}
                    className={`flex-1 text-xs py-1 rounded-md transition-colors
                      ${customMode === mode
                        ? "bg-bg text-text shadow-sm"
                        : "text-text-muted hover:text-text"}`}
                  >
                    {mode === "glasses" ? "Glasses" : "ml"}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <input
                    type="number"
                    inputMode="decimal"
                    step={customMode === "glasses" ? "0.5" : "50"}
                    min="0"
                    value={customVal}
                    onChange={(e) => setCustomVal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleCustomAdd(); }}
                    placeholder={customMode === "glasses" ? "e.g. 2" : "e.g. 400"}
                    autoFocus
                    className="w-full border border-border rounded-[10px] px-3 py-2 pr-14 text-sm
                               bg-bg text-text placeholder-text-muted focus:outline-none
                               focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted pointer-events-none">
                    {customMode === "glasses" ? "glasses" : "ml"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCustomAdd}
                  disabled={!customVal.trim()}
                  className="px-3 py-2 bg-blue-500 text-white text-sm rounded-[10px]
                             hover:bg-blue-600 disabled:opacity-30 transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Preview */}
              {customVal && !isNaN(parseFloat(customVal)) && parseFloat(customVal) > 0 && (
                <p className="text-xs text-text-muted">
                  = {customMode === "glasses"
                      ? `${Math.round(parseFloat(customVal) * GLASS_ML)} ml`
                      : `${Math.round(parseFloat(customVal) / GLASS_ML * 10) / 10} glasses`}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
