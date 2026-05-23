"use client";

import { useState, useEffect, useCallback } from "react";
import type { Food } from "@/lib/foods";
import { calculateNutrition } from "@/lib/foods";

/* ── Types ─────────────────────────────────────────────────── */
interface MealItem {
  uid: string;
  food: Food;
  amount: number;
  nutrition: ReturnType<typeof calculateNutrition>;
}

type MealName = "Breakfast" | "Lunch" | "Dinner" | "Supper";
const MEALS: MealName[] = ["Breakfast", "Lunch", "Dinner", "Supper"];

type MealPlan = Record<MealName, MealItem[]>;

/* ── Macro pill colours ─────────────────────────────────────── */
const MACRO_STYLES = {
  calories: { bg: "bg-orange-50",  text: "text-orange-600",  border: "border-orange-100",  label: "Calories", unit: "kcal" },
  protein:  { bg: "bg-blue-50",    text: "text-blue-600",    border: "border-blue-100",    label: "Protein",  unit: "g"    },
  carbs:    { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", label: "Carbs",    unit: "g"    },
  fat:      { bg: "bg-amber-50",   text: "text-amber-600",   border: "border-amber-100",   label: "Fat",      unit: "g"    },
} as const;

type MacroKey = keyof typeof MACRO_STYLES;

/* ── Helpers ────────────────────────────────────────────────── */
function emptyTotals() {
  return { calories: 0, protein: 0, fat: 0, carbs: 0 };
}

function addTotals(
  a: ReturnType<typeof emptyTotals>,
  b: ReturnType<typeof emptyTotals>,
) {
  return {
    calories: a.calories + b.calories,
    protein:  Math.round((a.protein  + b.protein)  * 10) / 10,
    fat:      Math.round((a.fat      + b.fat)      * 10) / 10,
    carbs:    Math.round((a.carbs    + b.carbs)    * 10) / 10,
  };
}

/* ── Sub-components ─────────────────────────────────────────── */
function MacroPill({ k, value }: { k: MacroKey; value: number }) {
  const s = MACRO_STYLES[k];
  return (
    <div className={`${s.bg} ${s.border} border rounded-xl px-4 py-3 flex flex-col gap-0.5`}>
      <span className={`text-xs font-medium ${s.text} uppercase tracking-wide`}>{s.label}</span>
      <span className="text-xl font-semibold text-gray-900">
        {value.toLocaleString()}
        <span className="text-sm font-normal text-gray-400 ml-1">{s.unit}</span>
      </span>
    </div>
  );
}

function MacroInline({ nutrition }: { nutrition: ReturnType<typeof emptyTotals> }) {
  return (
    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
      <span><span className="font-medium text-orange-500">{nutrition.calories}</span> kcal</span>
      <span><span className="font-medium text-blue-500">{nutrition.protein}g</span> protein</span>
      <span><span className="font-medium text-emerald-500">{nutrition.carbs}g</span> carbs</span>
      <span><span className="font-medium text-amber-500">{nutrition.fat}g</span> fat</span>
    </div>
  );
}

/* ── Meal Card ──────────────────────────────────────────────── */
interface MealCardProps {
  meal: MealName;
  items: MealItem[];
  foods: Food[];
  onAdd: (meal: MealName, foodId: string, amount: number) => void;
  onRemove: (meal: MealName, uid: string) => void;
}

function MealCard({ meal, items, foods, onAdd, onRemove }: MealCardProps) {
  const [selectedId, setSelectedId] = useState("");
  const [amount, setAmount]         = useState<number | "">(100);
  const [search, setSearch]         = useState("");

  const filtered = foods.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()),
  );

  const totals = items.reduce(
    (acc, item) => addTotals(acc, item.nutrition),
    emptyTotals(),
  );

  const selectedFood = foods.find((f) => f.id === selectedId);

  const handleAdd = () => {
    if (!selectedId || !amount) return;
    onAdd(meal, selectedId, Number(amount));
    setSelectedId("");
    setSearch("");
    setAmount(selectedFood ? selectedFood.serving : 100);
  };

  // Update default amount when food changes
  useEffect(() => {
    if (selectedFood) setAmount(selectedFood.serving);
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
      {/* Card header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-gray-800 text-base">{meal}</h2>
          {items.length > 0 && <MacroInline nutrition={totals} />}
        </div>
        {items.length === 0 && (
          <span className="text-xs text-gray-300 mt-0.5">No foods added</span>
        )}
      </div>

      {/* Food items list */}
      {items.length > 0 && (
        <ul className="divide-y divide-gray-50">
          {items.map((item) => (
            <li key={item.uid} className="flex items-center justify-between py-2.5 gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.food.name}</p>
                <p className="text-xs text-gray-400">
                  {item.amount}{item.food.unit} · {item.nutrition.calories} kcal · {item.nutrition.protein}g P · {item.nutrition.carbs}g C · {item.nutrition.fat}g F
                </p>
              </div>
              <button
                onClick={() => onRemove(meal, item.uid)}
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors text-sm"
                aria-label="Remove"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add food section */}
      <div className="flex flex-col gap-2 pt-1 border-t border-gray-50">
        {/* Search input */}
        <input
          type="text"
          placeholder="Search food…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!e.target.value) setSelectedId("");
          }}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition placeholder-gray-300"
        />

        {/* Dropdown results */}
        {search && filtered.length > 0 && !selectedId && (
          <ul className="border border-gray-100 rounded-lg divide-y divide-gray-50 max-h-40 overflow-y-auto shadow-sm">
            {filtered.map((f) => (
              <li key={f.id}>
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setSelectedId(f.id);
                    setSearch(f.name);
                  }}
                >
                  <span className="font-medium text-gray-700">{f.name}</span>
                  <span className="text-gray-400 text-xs ml-2">
                    {f.calories} kcal / {f.serving}{f.unit}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {search && filtered.length === 0 && (
          <p className="text-xs text-gray-300 px-1">No foods found</p>
        )}

        {/* Amount + Add button */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              {selectedFood ? selectedFood.unit : "g"}
            </span>
          </div>
          <button
            onClick={handleAdd}
            disabled={!selectedId || !amount}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────── */
export default function HomePage() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [meals, setMeals] = useState<MealPlan>({
    Breakfast: [],
    Lunch:     [],
    Dinner:    [],
    Supper:    [],
  });

  useEffect(() => {
    fetch("/api/foods")
      .then((r) => r.json())
      .then(setFoods)
      .catch(console.error);
  }, []);

  const handleAdd = useCallback(
    (meal: MealName, foodId: string, amount: number) => {
      const food = foods.find((f) => f.id === foodId);
      if (!food) return;
      const nutrition = calculateNutrition(food, amount);
      setMeals((prev) => ({
        ...prev,
        [meal]: [
          ...prev[meal],
          { uid: `${foodId}-${Date.now()}`, food, amount, nutrition },
        ],
      }));
    },
    [foods],
  );

  const handleRemove = useCallback((meal: MealName, uid: string) => {
    setMeals((prev) => ({
      ...prev,
      [meal]: prev[meal].filter((i) => i.uid !== uid),
    }));
  }, []);

  const daily = MEALS.reduce((acc, meal) => {
    const t = meals[meal].reduce((a, i) => addTotals(a, i.nutrition), emptyTotals());
    return addTotals(acc, t);
  }, emptyTotals());

  return (
    <div className="min-h-screen bg-white">
      {/* ── Header ── */}
      <header className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Macro Tracker</h1>
          <p className="text-xs text-gray-400">Track your daily nutrition</p>
        </div>
        <a
          href="/admin"
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50"
        >
          Admin →
        </a>
      </header>

      {/* ── Daily Totals ── */}
      <div className="border-b border-gray-100 bg-gray-50/60 px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Daily Totals
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(["calories", "protein", "carbs", "fat"] as MacroKey[]).map((k) => (
              <MacroPill key={k} k={k} value={daily[k]} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Meal Cards ── */}
      <main className="px-6 py-6 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        {MEALS.map((meal) => (
          <MealCard
            key={meal}
            meal={meal}
            items={meals[meal]}
            foods={foods}
            onAdd={handleAdd}
            onRemove={handleRemove}
          />
        ))}
      </main>

      {/* ── Footer ── */}
      <footer className="text-center text-xs text-gray-300 py-8">
        Built with ♥ — all macros calculated per serving size
      </footer>
    </div>
  );
}
