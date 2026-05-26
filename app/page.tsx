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
import MealCard, { type MealItem, makeMealItem } from "@/components/MealCard";
import GoalsDrawer   from "@/components/GoalsDrawer";
import AddFoodModal  from "@/components/AddFoodModal";

/* ─────────────────────────────────────────────────────────── */

const MEAL_NAMES = ["Breakfast", "Lunch", "Dinner", "Supper"] as const;
type MealName = typeof MEAL_NAMES[number];
type MealPlan = Record<MealName, MealItem[]>;

function emptyPlan(): MealPlan {
  return { Breakfast: [], Lunch: [], Dinner: [], Supper: [] };
}

/* ─────────────────────────────────────────────────────────── */

export default function HomePage() {
  const { data: session, status } = useSession({ required: true });
  const { pref: themePref, cycle: cycleTheme } = useTheme();

  const [foods,       setFoods]       = useState<Food[]>([]);
  const [meals,       setMeals]       = useState<MealPlan>(emptyPlan());
  const [goals,       setGoals]       = useState<Goals>(DEFAULT_GOALS);
  const [hydrated,    setHydrated]    = useState(false);
  const [goalsOpen,   setGoalsOpen]   = useState(false);
  const [addFoodOpen, setAddFoodOpen] = useState(false);
  const [addPrefill,  setAddPrefill]  = useState("");
  const [shareMsg,    setShareMsg]    = useState("");

  // Debounce ref for saving meals
  const saveMealsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Load foods ── */
  useEffect(() => {
    fetch("/api/foods")
      .then((r) => r.json())
      .then((data: Food[]) => setFoods(data))
      .catch(console.error);
  }, []);

  /* ── Load user meals + goals once session is ready ── */
  useEffect(() => {
    if (status !== "authenticated") return;

    // Load from hash URL first (shared links still work)
    const fromHash = getHashPlan<MealPlan>();
    if (fromHash) {
      setMeals(fromHash);
      setHydrated(true);
      return;
    }

    // Load from API
    Promise.all([
      fetch("/api/user/meals").then((r) => r.ok ? r.json() : null),
      fetch("/api/user/goals").then((r) => r.ok ? r.json() : null),
    ]).then(([savedMeals, savedGoals]) => {
      if (savedMeals) setMeals(savedMeals);
      if (savedGoals) setGoals({ ...DEFAULT_GOALS, ...savedGoals });
      setHydrated(true);
    }).catch(() => setHydrated(true));
  }, [status]);

  /* ── Persist meals (debounced 800ms) ── */
  useEffect(() => {
    if (!hydrated || status !== "authenticated") return;
    setHashPlan(meals);

    if (saveMealsTimer.current) clearTimeout(saveMealsTimer.current);
    saveMealsTimer.current = setTimeout(() => {
      fetch("/api/user/meals", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(meals),
      }).catch(console.error);
    }, 800);
  }, [meals, hydrated, status]);

  /* ── Persist goals ── */
  useEffect(() => {
    if (!hydrated || status !== "authenticated") return;
    fetch("/api/user/goals", {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(goals),
    }).catch(console.error);
  }, [goals, hydrated, status]);

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
    const empty = emptyPlan();
    setMeals(empty);
    clearHashPlan();
    fetch("/api/user/meals", {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(empty),
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

  /* ── Loading state while session initialises ── */
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
