"use client";

import { useState, useEffect, FormEvent } from "react";
import type { Food } from "@/lib/foods";
import AddFoodModal from "@/components/AddFoodModal";
import { useTheme } from "@/lib/theme";
import ThemeToggle from "@/components/ThemeToggle";

/* ──────────────────────────────────────────────────────────── */

export default function AdminPage() {
  const { pref: themePref, cycle: cycleTheme } = useTheme();

  const [password, setPassword] = useState("");
  const [authed,   setAuthed]   = useState(false);
  const [authErr,  setAuthErr]  = useState("");
  const [foods,    setFoods]    = useState<Food[]>([]);
  const [addOpen,  setAddOpen]  = useState(false);

  // Restore session
  useEffect(() => {
    const saved = sessionStorage.getItem("admin_pw");
    if (saved) { setPassword(saved); setAuthed(true); }
  }, []);

  // Load foods after auth
  useEffect(() => {
    if (!authed) return;
    fetch("/api/foods")
      .then((r) => r.json())
      .then(setFoods)
      .catch(console.error);
  }, [authed]);

  /* ── Login ── */
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthErr("");
    // Probe: a real add with dummy body returns 400 if auth OK, 401 if not
    const res = await fetch("/api/foods/add", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ __probe: true }),
    });
    if (res.status === 401) {
      setAuthErr("Incorrect password.");
    } else {
      sessionStorage.setItem("admin_pw", password);
      setAuthed(true);
    }
  };

  /* ── Delete ── */
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    const res = await fetch("/api/foods/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setFoods((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSignOut = () => {
    sessionStorage.removeItem("admin_pw");
    setAuthed(false);
    setPassword("");
  };

  /* ── Login screen ── */
  if (!authed) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle pref={themePref} onCycle={cycleTheme} />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent-surface mb-4">
              <span className="text-accent text-lg">⚙</span>
            </div>
            <h1 className="text-lg font-semibold text-text">Admin Access</h1>
            <p className="text-sm text-text-muted mt-1">Enter your password to continue</p>
          </div>

          <form
            onSubmit={handleLogin}
            className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-4
                       shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
          >
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-medium text-text-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
                className="border border-border rounded-[10px] px-3 py-2.5 text-sm bg-bg text-text
                           placeholder-text-muted focus:outline-none focus:border-accent
                           focus:ring-2 focus:ring-accent/20 transition-colors"
                required
              />
            </div>

            {authErr && (
              <p className="text-xs text-danger bg-danger/10 rounded-lg px-3 py-2">{authErr}</p>
            )}

            <button
              type="submit"
              className="py-2.5 bg-accent text-white text-sm font-medium rounded-[10px]
                         hover:bg-accent-hover transition-colors focus-accent"
            >
              Sign in
            </button>
          </form>

          <div className="mt-5 text-center">
            <a href="/" className="text-xs text-text-muted hover:text-text transition-colors">
              ← Back to tracker
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* ── Admin panel ── */
  const customFoods  = foods.filter((f) => !f.isDefault);
  const defaultFoods = foods.filter((f) =>  f.isDefault);

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-md border-b border-border-soft px-4 sm:px-6">
        <div className="max-w-4xl mx-auto h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-text">Admin Panel</span>
            <span className="hidden sm:inline text-xs text-text-muted">· Macro Tracker</span>
          </div>
          <nav className="flex items-center gap-1">
            <ThemeToggle pref={themePref} onCycle={cycleTheme} />
            <a
              href="/"
              className="text-xs text-text-2 hover:text-text px-2.5 py-1.5 rounded-lg
                         hover:bg-surface-2 transition-colors focus-accent"
            >
              ← Tracker
            </a>
            <button
              onClick={handleSignOut}
              className="text-xs text-text-2 hover:text-danger px-2.5 py-1.5 rounded-lg
                         hover:bg-danger/10 transition-colors focus-accent"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: stats + add button */}
        <section className="flex flex-col gap-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total foods" value={foods.length} />
            <StatCard label="Custom foods" value={customFoods.length} />
          </div>

          {/* Add food */}
          <div className="bg-surface border border-border-soft rounded-2xl p-5
                          shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <p className="text-sm font-medium text-text mb-1">Add a food</p>
            <p className="text-xs text-text-muted mb-4">
              New foods are available to all users immediately.
            </p>
            <button
              onClick={() => setAddOpen(true)}
              className="w-full py-2.5 bg-accent text-white text-sm font-medium rounded-[10px]
                         hover:bg-accent-hover transition-colors focus-accent"
            >
              ＋ Add food to database
            </button>
          </div>

          {/* Custom foods list */}
          <div>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              Custom foods ({customFoods.length})
            </p>
            {customFoods.length === 0 ? (
              <p className="text-sm text-text-muted bg-surface border border-border-soft
                            rounded-xl px-4 py-4">
                No custom foods yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {customFoods.map((f) => (
                  <FoodRow key={f.id} food={f} onDelete={() => handleDelete(f.id, f.name)} />
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Right: default foods */}
        <section>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            Default foods ({defaultFoods.length})
          </p>
          <ul className="flex flex-col gap-2">
            {defaultFoods.map((f) => (
              <FoodRow key={f.id} food={f} />
            ))}
          </ul>
        </section>
      </main>

      {/* Add food modal — pass admin password so delete still works */}
      <AddFoodModal
        open={addOpen}
        adminPassword={password}
        onClose={() => setAddOpen(false)}
        onAdded={(food) => setFoods((prev) => [...prev, food])}
      />
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────── */

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface border border-border-soft rounded-xl px-4 py-3
                    shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-2xl font-semibold tabular text-text mt-0.5">{value}</p>
    </div>
  );
}

function FoodRow({ food, onDelete }: { food: Food; onDelete?: () => void }) {
  return (
    <li className="flex items-center justify-between bg-surface border border-border-soft
                   rounded-xl px-4 py-3 gap-3 group shadow-[0_1px_2px_rgba(0,0,0,0.03)]
                   hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-shadow">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text truncate">{food.name}</p>
        <p className="text-xs text-text-muted tabular">
          per {food.serving}{food.unit} · {food.calories} kcal ·{" "}
          {food.protein}g P · {food.carbs}g C · {food.fat}g F
        </p>
      </div>
      {onDelete ? (
        <button
          onClick={onDelete}
          className="flex-shrink-0 text-xs text-text-muted hover:text-danger hover:bg-danger/10
                     transition-colors px-2.5 py-1 rounded-lg opacity-0 group-hover:opacity-100
                     focus:opacity-100 focus-accent"
          aria-label={`Delete ${food.name}`}
        >
          Delete
        </button>
      ) : (
        <span className="flex-shrink-0 text-xs text-text-muted bg-surface-2
                         px-2 py-0.5 rounded-md">
          default
        </span>
      )}
    </li>
  );
}
