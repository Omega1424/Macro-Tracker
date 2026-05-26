"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import type { Food } from "@/lib/foods";
import type { MacroTotals } from "@/lib/macros";
import { addTotals, emptyTotals } from "@/lib/macros";
import type { Goals } from "@/lib/storage";
import { DEFAULT_GOALS } from "@/lib/storage";
import { getHashPlan, setHashPlan, clearHashPlan } from "@/lib/share";
import { useTheme } from "@/lib/theme";

import Header       from "@/components/Header";
import DailySummary from "@/components/DailySummary";
import MealCard, { type Meal, type MealItem, makeMealItem } from "@/components/MealCard";
import GoalsDrawer   from "@/components/GoalsDrawer";
import AddFoodModal  from "@/components/AddFoodModal";

/* ─────────────────────────────────────────────────────────── */

const PRESET_MEAL_NAMES = ["Breakfast", "Lunch", "Dinner", "Supper", "Snack", "Pre-workout", "Post-workout"];

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emptyPlan(): Meal[] {
  return [{ id: genId(), name: "Breakfast", items: [] }];
}

/** Convert old Record<string, MealItem[]> format OR validate new Meal[] format */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateMeals(data: any): Meal[] {
  if (!data) return emptyPlan();
  // New format: array with id/name/items
  if (Array.isArray(data)) {
    if (data.length === 0) return emptyPlan();
    if (data[0]?.id && data[0]?.name && Array.isArray(data[0]?.items)) return data as Meal[];
  }
  // Old format: plain object { Breakfast: [], Lunch: [], ... }
  if (typeof data === "object") {
    const meals: Meal[] = Object.entries(data)
      .filter(([, items]) => Array.isArray(items))
      .map(([name, items]) => ({ id: genId(), name, items: items as MealItem[] }));
    return meals.length > 0 ? meals : emptyPlan();
  }
  return emptyPlan();
}

/* ─────────────────────────────────────────────────────────── */

export default function HomePage() {
  const { data: session, status } = useSession({ required: true });
  const { pref: themePref, cycle: cycleTheme } = useTheme();

  const [foods,        setFoods]        = useState<Food[]>([]);
  const [meals,        setMeals]        = useState<Meal[]>(emptyPlan());
  const [goals,        setGoals]        = useState<Goals>(DEFAULT_GOALS);
  const [hydrated,     setHydrated]     = useState(false);
  const [goalsOpen,    setGoalsOpen]    = useState(false);
  const [addFoodOpen,  setAddFoodOpen]  = useState(false);
  const [addPrefill,   setAddPrefill]   = useState("");
  const [shareMsg,     setShareMsg]     = useState("");
  // Add-meal panel
  const [addingMeal,   setAddingMeal]   = useState(false);
  const [customName,   setCustomName]   = useState("");
  const customInputRef = useRef<HTMLInputElement>(null);

  const saveMealsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Load foods ── */
  useEffect(() => {
    fetch("/api/foods")
      .then((r) => r.json())
      .then((data: Food[]) => setFoods(data))
      .catch(console.error);
  }, []);

  /* ── Load user meals + goals ── */
  useEffect(() => {
    if (status !== "authenticated") return;

    const fromHash = getHashPlan<Meal[]>();
    if (fromHash) {
      setMeals(migrateMeals(fromHash));
      setHydrated(true);
      return;
    }

    Promise.all([
      fetch("/api/user/meals").then((r) => r.ok ? r.json() : null),
      fetch("/api/user/goals").then((r) => r.ok ? r.json() : null),
    ]).then(([savedMeals, savedGoals]) => {
      if (savedMeals) setMeals(migrateMeals(savedMeals));
      if (savedGoals) setGoals({ ...DEFAULT_GOALS, ...savedGoals });
      setHydrated(true);
    }).catch(() => setHydrated(true));
  }, [status]);

  /* ── Persist meals (debounced) ── */
  useEffect(() => {
    if (!hydrated || status !== "authenticated") return;
    setHashPlan(meals);
    if (saveMealsTimer.current) clearTimeout(saveMealsTimer.current);
    saveMealsTimer.current = setTimeout(() => {
      fetch("/api/user/meals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(meals),
      }).catch(console.error);
    }, 800);
  }, [meals, hydrated, status]);

  /* ── Persist goals ── */
  useEffect(() => {
    if (!hydrated || status !== "authenticated") return;
    fetch("/api/user/goals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(goals),
    }).catch(console.error);
  }, [goals, hydrated, status]);

  /* ── Daily totals ── */
  const daily: MacroTotals = meals.reduce((acc, meal) => {
    const t = meal.items.reduce((a, item) => addTotals(a, item.nutrition), emptyTotals());
    return addTotals(acc, t);
  }, emptyTotals());

  /* ── Meal item handlers ── */
  const handleAdd = useCallback((mealId: string, food: Food, amount: number) => {
    setMeals((prev) => prev.map((m) =>
      m.id === mealId ? { ...m, items: [...m.items, makeMealItem(food, amount)] } : m
    ));
  }, []);

  const handleRemove = useCallback((mealId: string, uid: string) => {
    setMeals((prev) => prev.map((m) =>
      m.id === mealId ? { ...m, items: m.items.filter((i) => i.uid !== uid) } : m
    ));
  }, []);

  const handleEditItem = useCallback((mealId: string, uid: string, food: Food, amount: number) => {
    setMeals((prev) => prev.map((m) =>
      m.id === mealId
        ? { ...m, items: m.items.map((i) => i.uid === uid ? makeMealItem(food, amount) : i) }
        : m
    ));
  }, []);

  /* ── Meal management handlers ── */
  const handleRenameMeal = useCallback((mealId: string, name: string) => {
    setMeals((prev) => prev.map((m) => m.id === mealId ? { ...m, name } : m));
  }, []);

  const handleRemoveMeal = useCallback((mealId: string) => {
    setMeals((prev) => prev.filter((m) => m.id !== mealId));
  }, []);

  const handleAddMeal = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setMeals((prev) => [...prev, { id: genId(), name: trimmed, items: [] }]);
    setAddingMeal(false);
    setCustomName("");
  };

  const handleReset = () => {
    if (!confirm("Clear today's meal plan?")) return;
    const empty = emptyPlan();
    setMeals(empty);
    clearHashPlan();
    fetch("/api/user/meals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(empty),
    }).catch(console.error);
  };

  const handleFoodAdded = (food: Food) => setFoods((prev) => [...prev, food]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareMsg("Link copied!");
      setTimeout(() => setShareMsg(""), 2500);
    } catch {
      setShareMsg("Copy the URL from your browser");
      setTimeout(() => setShareMsg(""), 3000);
    }
  };

  // Preset names not already in use
  const existingNames = new Set(meals.map((m) => m.name));
  const availablePresets = PRESET_MEAL_NAMES.filter((n) => !existingNames.has(n));

  /* ── Loading ── */
  if (status === "loading" || !hydrated) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <span className="text-sm text-text-muted animate-pulse">Loading…</span>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-bg">
      <Header
        themePref={themePref}
        onCycleTheme={cycleTheme}
        onGoals={() => setGoalsOpen(true)}
        onReset={handleReset}
        onAddFood={() => { setAddPrefill(""); setAddFoodOpen(true); }}
        userEmail={session?.user?.email ?? undefined}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        <DailySummary totals={daily} goals={goals} />

        <div className="flex items-center gap-3 -mt-2">
          <button
            onClick={handleShare}
            className="text-xs text-text-muted hover:text-text transition-colors flex items-center gap-1.5 focus-accent"
          >
            <span>⎋</span> Share meal plan
          </button>
          {shareMsg && (
            <span className="text-xs text-accent animate-fade-in">{shareMsg}</span>
          )}
        </div>

        {/* Meals */}
        <section aria-label="Meals">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">
            Meals
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {meals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                foods={foods}
                onAdd={(food, amount) => handleAdd(meal.id, food, amount)}
                onRemove={(uid) => handleRemove(meal.id, uid)}
                onEditItem={(uid, food, amount) => handleEditItem(meal.id, uid, food, amount)}
                onRename={(name) => handleRenameMeal(meal.id, name)}
                onRemoveMeal={() => handleRemoveMeal(meal.id)}
                onAddNewFood={(prefill) => { setAddPrefill(prefill); setAddFoodOpen(true); }}
              />
            ))}
          </div>

          {/* Add meal */}
          <div className="mt-4">
            {!addingMeal ? (
              <button
                onClick={() => setAddingMeal(true)}
                className="w-full py-2.5 border border-dashed border-border-soft rounded-2xl
                           text-xs text-text-muted hover:text-text hover:border-border
                           transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-base leading-none">＋</span> Add meal
              </button>
            ) : (
              <div className="border border-border-soft rounded-2xl p-4 bg-surface
                              shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col gap-3">
                <p className="text-xs font-medium text-text-muted">Choose a meal</p>

                {/* Preset chips */}
                {availablePresets.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {availablePresets.map((name) => (
                      <button
                        key={name}
                        onClick={() => handleAddMeal(name)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-bg border border-border
                                   hover:border-accent hover:text-accent transition-colors"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Custom name */}
                <div className="flex gap-2">
                  <input
                    ref={customInputRef}
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddMeal(customName);
                      if (e.key === "Escape") { setAddingMeal(false); setCustomName(""); }
                    }}
                    placeholder="Custom name…"
                    className="flex-1 text-sm border border-border rounded-[10px] px-3 py-2 bg-bg text-text
                               placeholder-text-muted focus:outline-none focus:border-accent
                               focus:ring-2 focus:ring-accent/20 transition-colors"
                  />
                  <button
                    onClick={() => handleAddMeal(customName)}
                    disabled={!customName.trim()}
                    className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-[10px]
                               hover:bg-accent-hover disabled:opacity-30 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setAddingMeal(false); setCustomName(""); }}
                    className="px-3 py-2 text-sm text-text-muted hover:text-text rounded-[10px]
                               hover:bg-surface-2 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="text-center text-xs text-text-muted py-10">
        Macro Tracker · macros calculated per serving size
      </footer>

      <GoalsDrawer
        open={goalsOpen}
        goals={goals}
        onSave={setGoals}
        onClose={() => setGoalsOpen(false)}
      />

      <AddFoodModal
        open={addFoodOpen}
        prefillName={addPrefill}
        onClose={() => setAddFoodOpen(false)}
        onAdded={handleFoodAdded}
      />
    </div>
  );
}
