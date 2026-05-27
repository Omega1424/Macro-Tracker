"use client";

import MacroDonut from "./MacroDonut";
import ProgressBar from "./ProgressBar";
import type { MacroTotals } from "@/lib/macros";
import type { Goals } from "@/lib/storage";

interface Props {
  totals: MacroTotals;
  goals:  Goals;
}

export default function DailySummary({ totals, goals }: Props) {
  const caloriesPct = goals.calories > 0
    ? Math.min(Math.round((totals.calories / goals.calories) * 100), 100)
    : 0;

  return (
    <section
      aria-label="Daily nutrition summary"
      className="bg-surface border border-border-soft rounded-2xl p-5
                 shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden"
    >
      {/* Section label */}
      <div className="flex items-center gap-1.5 mb-4">
        <span className="text-base leading-none">🍽️</span>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Nutrition</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Left: Donut */}
        <div className="flex justify-center sm:flex-shrink-0">
          <MacroDonut totals={totals} size={120} />
        </div>

        {/* Right: Progress */}
        <div className="flex-1 flex flex-col gap-3 justify-center">
          {/* Calories headline */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-semibold tabular text-text tracking-tight">
              {totals.calories.toLocaleString()}
            </span>
            <span className="text-sm text-text-muted">
              / {goals.calories.toLocaleString()} kcal
            </span>
            {goals.calories > 0 && (
              <span className="text-xs font-medium text-accent ml-auto">
                {caloriesPct}%
              </span>
            )}
          </div>

          {/* Progress bars */}
          <div className="flex flex-col gap-3">
            <ProgressBar
              label="Calories"
              value={totals.calories}
              goal={goals.calories}
              unit=" kcal"
              color="bg-slate-500 dark:bg-slate-400"
            />
            <ProgressBar
              label="Protein"
              value={totals.protein}
              goal={goals.protein}
              unit="g"
              color="bg-sky-500 dark:bg-sky-400"
            />
            <ProgressBar
              label="Carbs"
              value={totals.carbs}
              goal={goals.carbs}
              unit="g"
              color="bg-amber-500 dark:bg-amber-400"
            />
            <ProgressBar
              label="Fat"
              value={totals.fat}
              goal={goals.fat}
              unit="g"
              color="bg-pink-500 dark:bg-pink-400"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
