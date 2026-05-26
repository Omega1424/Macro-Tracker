"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import type { Food } from "@/lib/foods";
import type { MacroTotals } from "@/lib/macros";
import { addTotals, emptyTotals } from "@/lib/macros";
import FoodSearch from "./FoodSearch";
import { calculateNutrition } from "@/lib/foods";

/* ── Types ───────────────────────────────────────────────── */

export interface MealItem {
  uid:       string;
  food:      Food;
  amount:    number;
  nutrition: MacroTotals;
}

export interface Meal {
  id:    string;
  name:  string;
  items: MealItem[];
}

interface Props {
  meal:         Meal;
  foods:        Food[];
  onAdd:        (food: Food, amount: number) => void;
  onRemove:     (uid: string) => void;
  onEditItem:   (uid: string, food: Food, amount: number) => void;
  onRename:     (name: string) => void;
  onRemoveMeal: () => void;
  onAddNewFood: (prefill: string) => void;
}

/* ── Component ───────────────────────────────────────────── */

export default function MealCard({
  meal, foods, onAdd, onRemove, onEditItem, onRename, onRemoveMeal, onAddNewFood,
}: Props) {
  const [editingName, setEditingName] = useState(false);
  const [nameVal,     setNameVal]     = useState(meal.name);
  const [editingUid,  setEditingUid]  = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // Sync nameVal if meal.name changes externally
  useEffect(() => { setNameVal(meal.name); }, [meal.name]);

  useEffect(() => {
    if (editingName) nameRef.current?.focus();
  }, [editingName]);

  const totals = useMemo(
    () => meal.items.reduce((acc, item) => addTotals(acc, item.nutrition), emptyTotals()),
    [meal.items],
  );

  const commitName = () => {
    const trimmed = nameVal.trim();
    if (trimmed) onRename(trimmed);
    else setNameVal(meal.name);
    setEditingName(false);
  };

  return (
    <div className="bg-surface border border-border-soft rounded-2xl
                    shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]
                    transition-shadow duration-200">

      {/* Card header */}
      <div className="px-5 pt-5 pb-4 border-b border-border-soft">
        <div className="flex items-center justify-between gap-2">
          {editingName ? (
            <input
              ref={nameRef}
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); commitName(); }
                if (e.key === "Escape") { setNameVal(meal.name); setEditingName(false); }
              }}
              className="text-sm font-semibold bg-transparent border-b border-accent outline-none
                         text-text flex-1 min-w-0"
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="text-sm font-semibold text-text hover:text-accent transition-colors
                         flex items-center gap-1.5 group"
              title="Click to rename"
            >
              {meal.name}
              <span className="text-text-muted opacity-0 group-hover:opacity-100 text-xs transition-opacity">✎</span>
            </button>
          )}

          <div className="flex items-center gap-2 flex-shrink-0">
            {meal.items.length > 0 && (
              <span className="tabular text-xs text-text-muted font-medium">
                {totals.calories.toLocaleString()} kcal
              </span>
            )}
            <button
              onClick={() => {
                if (meal.items.length > 0 && !confirm(`Remove "${meal.name}" and all its items?`)) return;
                onRemoveMeal();
              }}
              className="text-xs text-text-muted hover:text-danger transition-colors opacity-0
                         group-hover:opacity-100 hover:opacity-100 px-1"
              title="Remove meal"
            >
              ✕
            </button>
          </div>
        </div>

        {meal.items.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            <MacroPill label="P" value={totals.protein} color="text-sky-600 dark:text-sky-400" />
            <MacroPill label="C" value={totals.carbs}   color="text-amber-600 dark:text-amber-400" />
            <MacroPill label="F" value={totals.fat}     color="text-pink-600 dark:text-pink-400" />
          </div>
        )}
      </div>

      {/* Food items */}
      <div className="px-5 py-3">
        {meal.items.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-4">
            No foods yet — add one below
          </p>
        ) : (
          <ul className="divide-y divide-border-soft">
            {meal.items.map((item) =>
              editingUid === item.uid ? (
                <li key={item.uid} className="py-3">
                  <p className="text-xs text-text-muted mb-2">Editing — search a new food or adjust amount</p>
                  <FoodSearch
                    foods={foods}
                    initialFood={item.food}
                    initialAmount={item.amount}
                    submitLabel="Save"
                    onSelect={(food, amount) => {
                      onEditItem(item.uid, food, amount);
                      setEditingUid(null);
                    }}
                    onAddNew={(name) => { onAddNewFood(name); setEditingUid(null); }}
                  />
                  <button
                    onClick={() => setEditingUid(null)}
                    className="mt-2 text-xs text-text-muted hover:text-text transition-colors"
                  >
                    Cancel
                  </button>
                </li>
              ) : (
                <FoodRow
                  key={item.uid}
                  item={item}
                  onEdit={() => setEditingUid(item.uid)}
                  onRemove={() => { onRemove(item.uid); setEditingUid(null); }}
                />
              )
            )}
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

/* ── Helpers ─────────────────────────────────────────────── */

function MacroPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span className={`text-xs tabular font-medium ${color}`}>
      {label} {value.toLocaleString()}g
    </span>
  );
}

function FoodRow({
  item, onEdit, onRemove,
}: {
  item:     MealItem;
  onEdit:   () => void;
  onRemove: () => void;
}) {
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
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          aria-label={`Edit ${item.food.name}`}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-text-muted
                     hover:text-accent hover:bg-accent-surface transition-all text-xs focus-accent"
        >
          ✎
        </button>
        <button
          onClick={onRemove}
          aria-label={`Remove ${item.food.name}`}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-text-muted
                     hover:text-danger hover:bg-danger/10 transition-all text-xs focus-accent"
        >
          ✕
        </button>
      </div>
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
