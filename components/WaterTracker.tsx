"use client";

const QUICK_ADD = [250, 500, 750]; // ml buttons

interface Props {
  waterMl:   number;       // current intake for the day
  goalMl:    number;       // daily goal from settings
  isFuture:  boolean;
  onChange:  (ml: number) => void;
}

export default function WaterTracker({ waterMl, goalMl, isFuture, onChange }: Props) {
  const pct     = goalMl > 0 ? Math.min(waterMl / goalMl, 1) : 0;
  const pctLabel = goalMl > 0 ? Math.round((waterMl / goalMl) * 100) : 0;

  const add    = (ml: number) => !isFuture && onChange(waterMl + ml);
  const remove = (ml: number) => !isFuture && onChange(Math.max(0, waterMl - ml));

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
        <span className="text-sm text-text-muted">/ {goalMl} ml</span>
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
        <div className="flex items-center gap-2 flex-wrap">
          {QUICK_ADD.map((ml) => (
            <button
              key={ml}
              type="button"
              onClick={() => add(ml)}
              className="text-xs px-3 py-1.5 rounded-full border border-blue-500/40
                         text-blue-500 hover:bg-blue-500/10 transition-colors"
            >
              +{ml} ml
            </button>
          ))}
          {waterMl > 0 && (
            <button
              type="button"
              onClick={() => remove(250)}
              className="text-xs px-3 py-1.5 rounded-full border border-border
                         text-text-muted hover:text-text hover:border-border transition-colors ml-auto"
            >
              −250 ml
            </button>
          )}
        </div>
      )}
    </section>
  );
}
