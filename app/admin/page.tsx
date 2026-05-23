"use client";

import { useState, useEffect, FormEvent } from "react";
import type { Food } from "@/lib/foods";

/* ── Field helper ───────────────────────────────────────────── */
function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        step={type === "number" ? "any" : undefined}
        min={type === "number" ? 0 : undefined}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition placeholder-gray-300"
        required
      />
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────── */
export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed]     = useState(false);
  const [authErr, setAuthErr]   = useState("");

  const [foods, setFoods]       = useState<Food[]>([]);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState("");
  const [error, setError]       = useState("");

  // Form state
  const [form, setForm] = useState({
    name:     "",
    serving:  "",
    unit:     "g",
    calories: "",
    protein:  "",
    carbs:    "",
    fat:      "",
  });

  const field = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (v: string) => setForm((prev) => ({ ...prev, [k]: v })),
  });

  /* ── Load foods after auth ── */
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
    // Quick check: try adding a test – we validate by making a real API call
    const res = await fetch("/api/foods/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ __ping: true }), // will fail validation but 401 if wrong pw
    });
    if (res.status === 401) {
      setAuthErr("Incorrect password.");
    } else {
      // 400 = correct password but bad body → authed!
      setAuthed(true);
      sessionStorage.setItem("admin_pw", password);
    }
  };

  // Restore session password
  useEffect(() => {
    const saved = sessionStorage.getItem("admin_pw");
    if (saved) { setPassword(saved); setAuthed(true); }
  }, []);

  /* ── Add food ── */
  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");
    const res = await fetch("/api/foods/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({
        name:     form.name,
        serving:  Number(form.serving),
        unit:     form.unit,
        calories: Number(form.calories),
        protein:  Number(form.protein),
        carbs:    Number(form.carbs),
        fat:      Number(form.fat),
      }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setSuccess(`"${data.food.name}" added successfully.`);
      setFoods((prev) => [...prev, data.food]);
      setForm({ name: "", serving: "", unit: "g", calories: "", protein: "", carbs: "", fat: "" });
    } else {
      setError("Failed to add food. Please try again.");
    }
  };

  /* ── Delete food ── */
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    const res = await fetch("/api/foods/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setFoods((prev) => prev.filter((f) => f.id !== id));
    }
  };

  /* ── Login screen ── */
  if (!authed) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-xl font-semibold text-gray-900">Admin Access</h1>
            <p className="text-sm text-gray-400 mt-1">Enter your admin password to continue</p>
          </div>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition placeholder-gray-300"
                required
                autoFocus
              />
            </div>
            {authErr && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{authErr}</p>
            )}
            <button
              type="submit"
              className="py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              Sign in
            </button>
          </form>
          <div className="mt-6 text-center">
            <a href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              ← Back to tracker
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* ── Admin panel ── */
  const customFoods  = foods.filter((f) => !f.isDefault);
  const defaultFoods = foods.filter((f) => f.isDefault);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
          <p className="text-xs text-gray-400">Manage the food database</p>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50">
            ← Tracker
          </a>
          <button
            onClick={() => { sessionStorage.removeItem("admin_pw"); setAuthed(false); setPassword(""); }}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="px-6 py-6 max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Add food form ── */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Add New Food</h2>
          <form onSubmit={handleAdd} className="bg-gray-50 rounded-2xl p-5 flex flex-col gap-4 border border-gray-100">

            <Field label="Food Name" name="name" {...field("name")} placeholder="e.g. Greek Yogurt" />

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Serving Size"
                name="serving"
                type="number"
                {...field("serving")}
                placeholder="100"
                hint="Reference amount for macros below"
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Unit</label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition bg-white"
                >
                  <option value="g">g (grams)</option>
                  <option value="ml">ml (millilitres)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Calories (kcal)" name="calories" type="number" {...field("calories")} placeholder="0" />
              <Field label="Protein (g)"     name="protein"  type="number" {...field("protein")}  placeholder="0" />
              <Field label="Carbs (g)"       name="carbs"    type="number" {...field("carbs")}    placeholder="0" />
              <Field label="Fat (g)"         name="fat"      type="number" {...field("fat")}      placeholder="0" />
            </div>

            {success && (
              <p className="text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">✓ {success}</p>
            )}
            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Adding…" : "Add Food"}
            </button>
          </form>
        </section>

        {/* ── Foods list ── */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
            Food Database ({foods.length})
          </h2>

          {/* Custom foods */}
          {customFoods.length > 0 && (
            <div className="mb-5">
              <p className="text-xs text-gray-400 mb-2">Custom ({customFoods.length})</p>
              <ul className="flex flex-col gap-2">
                {customFoods.map((f) => (
                  <FoodRow key={f.id} food={f} onDelete={() => handleDelete(f.id, f.name)} />
                ))}
              </ul>
            </div>
          )}

          {customFoods.length === 0 && (
            <p className="text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-3 mb-5">
              No custom foods yet. Add one using the form.
            </p>
          )}

          {/* Default foods */}
          <div>
            <p className="text-xs text-gray-400 mb-2">Default ({defaultFoods.length})</p>
            <ul className="flex flex-col gap-2">
              {defaultFoods.map((f) => (
                <FoodRow key={f.id} food={f} />
              ))}
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ── Food row ───────────────────────────────────────────────── */
function FoodRow({ food, onDelete }: { food: Food; onDelete?: () => void }) {
  return (
    <li className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 gap-2 shadow-sm">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{food.name}</p>
        <p className="text-xs text-gray-400">
          per {food.serving}{food.unit} · {food.calories} kcal · {food.protein}g P · {food.carbs}g C · {food.fat}g F
        </p>
      </div>
      {onDelete ? (
        <button
          onClick={onDelete}
          className="flex-shrink-0 text-xs text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors px-2 py-1 rounded-lg"
        >
          Delete
        </button>
      ) : (
        <span className="flex-shrink-0 text-xs text-gray-300 bg-gray-50 px-2 py-1 rounded-lg">default</span>
      )}
    </li>
  );
}
