"use client";

import { useMemo } from "react";
import type { Food } from "@/lib/foods";
import type { MacroTotals } from "@/lib/macros";
import { addTotals, emptyTotals } from "@/lib/macros";
import FoodSearch from "./FoodSearch";
import { calculateNutrition } from "@/lib/foods";

export interface MealItem {
  uid:       string;
  food:      Food;
  amount:    number;
  nutrition: MacroTotals;
}

interface Props {
  meal:     string;
  items:    MealItem[];
  foods:    Food[];
  onAdd:    (food: Food, amount: number) => void;
  onRemove: (uid: string) => void;
  onAddNewFood: (prefill: string) => void;
}

export default function MealCard({ meal, items, foods, onAdd, onRemove, onAddNewFood }: Props) {
  const totals = useMemo(
    () => items.reduce((acc, item) => addTotals(acc, item.nutrition), emptyTotals()),
    [items],
  );

  return (
    <div className="bg-surface border border-border-soft rounded-2xl
                    shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]
                    transition-shadow duration-200">

      {/* Card header */}
      <div className="px-5 pt-5 pb-4 border-b border-border-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text">{meal}</h2>
          {items.length > 0 && (
            <span className="tabular text-xs text-text-muted font-medium">
              {totals.calories.toLocaleString()} kcal
            </span>
          )}
        </div>

        {/* Macro pills */}
        {items.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            <MacroPill label="P" value={totals.protein} color="text-sky-600 dark:text-sky-400" />
            <MacroPill label="C" value={totals.carbs}   color="text-amber-600 dark:text-amber-400" />
            <MacroPill label="F" value={totals.fat}     color="text-pink-600 dark:text-pink-400" />
          </div>
        )}
      </div>

      {/* Food items */}
      <div className="px-5 py-3">
        {items.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-4">
            No foods yet — add one below
          </p>
        ) : (
          <ul className="divide-y divide-border-soft">
            {items.map((item) => (
              <FoodRow
                key={item.uid}
                item={item}
                onRemove={() => onRemove(item.uid)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Add food */}
      <div className="px-5 pb-5">
        <FoodSearch
          foods={foods}
          onSelect={(food, amount) => onAdd(food, amount)}
          onAddNew={onAddNewFood}
        />
      </div>
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────────── */
function MacroPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span className={`text-xs tabular font-medium ${color}`}>
      {label} {value.toLocaleString()}g
    </span>
  );
}

function FoodRow({ item, onRemove }: { item: MealItem; onRemove: () => void }) {
  return (
    <li className="flex items-center justify-between py-2.5 gap-3 group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text truncate">{item.food.name}</p>
        <p className="text-xs text-text-muted tabular">
          {item.amount}{item.food.unit}
          <span className="mx-1.5 text-border">·</span>
          <span className="text-text-2">{item.nutrition.calories} kcal</span>
          <span className="mx-1.5 text-border">·</span>
          {item.nutrition.protein}g P · {item.nutrition.carbs}g C · {item.nutrition.fat}g F
        </p>
      </div>
      <button
        onClick={onRemove}
        aria-label={`Remove ${item.food.name}`}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg
                   text-text-muted opacity-0 group-hover:opacity-100 focus:opacity-100
                   hover:text-danger hover:bg-danger/10 transition-all duration-150 focus-accent text-xs"
      >
        ✕
      </button>
    </li>
  );
}

/* ── Re-export helper for page ──────────────────────────── */
export function makeMealItem(food: Food, amount: number): MealItem {
  return {
    uid:       `${food.id}-${Date.now()}-${Math.random()}`,
    food,
    amount,
    nutrition: calculateNutrition(food, amount),
  };
}
