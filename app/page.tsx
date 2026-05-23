"use client";

import { useState, useEffect, useCallback } from "react";
import type { Food } from "@/lib/foods";
import type { MacroTotals } from "@/lib/macros";
import { addTotals, emptyTotals } from "@/lib/macros";
import type { Goals } from "@/lib/storage";
import { loadMeals, saveMeals, clearMeals, loadGoals, saveGoals } from "@/lib/storage";
import { getHashPlan, setHashPlan, clearHashPlan } from "@/lib/share";
import { useTheme } from "@/lib/theme";

import Header      from "@/components/Header";
import DailySummary from "@/components/DailySummary";
import MealCard, { type MealItem, makeMealItem } from "@/components/MealCard";
import GoalsDrawer  from "@/components/GoalsDrawer";
import AddFoodModal from "@/components/AddFoodModal";

/* ─────────────────────────────────────────────────────────── */

const MEAL_NAMES = ["Breakfast", "Lunch", "Dinner", "Supper"] as const;
type MealName = typeof MEAL_NAMES[number];
type MealPlan = Record<MealName, MealItem[]>;

function emptyPlan(): MealPlan {
  return { Breakfast: [], Lunch: [], Dinner: [], Supper: [] };
}

/* ─────────────────────────────────────────────────────────── */

export default function HomePage() {
  const { pref: themePref, cycle: cycleTheme } = useTheme();

  const [foods,       setFoods]       = useState<Food[]>([]);
  const [meals,       setMeals]       = useState<MealPlan>(emptyPlan());
  const [goals,       setGoals]       = useState<Goals>(loadGoals());
  const [hydrated,    setHydrated]    = useState(false);
  const [goalsOpen,   setGoalsOpen]   = useState(false);
  const [addFoodOpen, setAddFoodOpen] = useState(false);
  const [addPrefill,  setAddPrefill]  = useState("");
  const [shareMsg,    setShareMsg]    = useState("");

  /* ── Load foods ── */
  useEffect(() => {
    fetch("/api/foods")
      .then((r) => r.json())
      .then((data: Food[]) => setFoods(data))
      .catch(console.error);
  }, []);

  /* ── Hydrate from hash → localStorage → empty ── */
  useEffect(() => {
    const fromHash = getHashPlan<MealPlan>();
    if (fromHash) {
      setMeals(fromHash);
    } else {
      const saved = loadMeals() as MealPlan | null;
      if (saved) setMeals(saved);
    }
    setHydrated(true);
  }, []);

  /* ── Persist meals ── */
  useEffect(() => {
    if (!hydrated) return;
    saveMeals(meals);
    setHashPlan(meals);
  }, [meals, hydrated]);

  /* ── Persist goals ── */
  useEffect(() => { saveGoals(goals); }, [goals]);

  /* ── Computed daily totals ── */
  const daily: MacroTotals = MEAL_NAMES.reduce((acc, meal) => {
    const t = meals[meal].reduce((a, item) => addTotals(a, item.nutrition), emptyTotals());
    return addTotals(acc, t);
  }, emptyTotals());

  /* ── Handlers ── */
  const handleAdd = useCallback((meal: MealName, food: Food, amount: number) => {
    setMeals((prev) => ({
      ...prev,
      [meal]: [...prev[meal], makeMealItem(food, amount)],
    }));
  }, []);

  const handleRemove = useCallback((meal: MealName, uid: string) => {
    setMeals((prev) => ({
      ...prev,
      [meal]: prev[meal].filter((i) => i.uid !== uid),
    }));
  }, []);

  const handleReset = () => {
    if (!confirm("Clear today's meal plan?")) return;
    setMeals(emptyPlan());
    clearMeals();
    clearHashPlan();
  };

  const handleFoodAdded = (food: Food) => {
    setFoods((prev) => [...prev, food]);
  };

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

  /* ─────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-bg">
      <Header
        themePref={themePref}
        onCycleTheme={cycleTheme}
        onGoals={() => setGoalsOpen(true)}
        onReset={handleReset}
        onAddFood={() => { setAddPrefill(""); setAddFoodOpen(true); }}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Daily summary hero */}
        <DailySummary totals={daily} goals={goals} />

        {/* Share button */}
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

        {/* Meals grid */}
        <section aria-label="Meals">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">
            Meals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MEAL_NAMES.map((meal) => (
              <MealCard
                key={meal}
                meal={meal}
                items={meals[meal]}
                foods={foods}
                onAdd={(food, amount) => handleAdd(meal, food, amount)}
                onRemove={(uid) => handleRemove(meal, uid)}
                onAddNewFood={(prefill) => {
                  setAddPrefill(prefill);
                  setAddFoodOpen(true);
                }}
              />
            ))}
          </div>
        </section>
      </main>

      <footer className="text-center text-xs text-text-muted py-10">
        Macro Tracker · macros calculated per serving size
      </footer>

      {/* Goals drawer */}
      <GoalsDrawer
        open={goalsOpen}
        goals={goals}
        onSave={setGoals}
        onClose={() => setGoalsOpen(false)}
      />

      {/* Add food modal */}
      <AddFoodModal
        open={addFoodOpen}
        prefillName={addPrefill}
        onClose={() => setAddFoodOpen(false)}
        onAdded={handleFoodAdded}
      />
    </div>
  );
}
