"use client";

import { useState, useEffect, FormEvent, useRef } from "react";
import type { Food } from "@/lib/foods";

interface Props {
  open:           boolean;
  prefillName?:   string;        // pre-fill from "Add 'spinach' to database"
  adminPassword?: string;        // when used from admin panel
  onClose:        () => void;
  onAdded:        (food: Food) => void;
}

const EMPTY_FORM = {
  name: "", serving: "", unit: "g",
  calories: "", protein: "", carbs: "", fat: "",
};

function Inp({
  label, name, type = "text", value, onChange, placeholder, hint,
}: {
  label: string; name: string; type?: string;
  value: string; onChange: (v: string) => void;
  placeholder?: string; hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-xs font-medium text-text-2">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        step={type === "number" ? "any" : undefined}
        min={type === "number" ? "0" : undefined}
        className="border border-border rounded-[10px] px-3 py-2 text-sm bg-bg text-text placeholder-text-muted
                   focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
        required
      />
      {hint && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  );
}

export default function AddFoodModal({ open, prefillName = "", adminPassword, onClose, onAdded }: Props) {
  const [form,    setForm]    = useState({ ...EMPTY_FORM, name: prefillName });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const firstRef = useRef<HTMLInputElement>(null);

  // Sync prefill name whenever modal opens
  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY_FORM, name: prefillName });
      setError("");
      setTimeout(() => firstRef.current?.focus(), 50);
    }
  }, [open, prefillName]);

  // Trap Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const f = (k: keyof typeof form) => ({
    value:    form[k],
    onChange: (v: string) => setForm((prev) => ({ ...prev, [k]: v })),
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (adminPassword) headers["x-admin-password"] = adminPassword;

      const res = await fetch("/api/foods/add", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name:     form.name.trim(),
          serving:  Number(form.serving),
          unit:     form.unit,
          calories: Number(form.calories),
          protein:  Number(form.protein),
          carbs:    Number(form.carbs),
          fat:      Number(form.fat),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add food");
      }

      const { food } = await res.json();
      onAdded(food as Food);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-food-title"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md bg-bg border border-border rounded-2xl shadow-2xl p-6 flex flex-col gap-5 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 id="add-food-title" className="text-base font-semibold text-text">
              Add food to database
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Available to everyone once added
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text hover:bg-surface-2 transition-colors focus-accent"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div ref={firstRef as React.RefObject<HTMLDivElement>}>
            <Inp label="Food name" name="name" {...f("name")} placeholder="e.g. Greek Yogurt" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Inp
              label="Serving size"
              name="serving"
              type="number"
              {...f("serving")}
              placeholder="100"
              hint="The reference amount"
            />
            <div className="flex flex-col gap-1">
              <label htmlFor="unit" className="text-xs font-medium text-text-2">Unit</label>
              <select
                id="unit"
                value={form.unit}
                onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                className="border border-border rounded-[10px] px-3 py-2 text-sm bg-bg text-text
                           focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
              >
                <option value="g">g (grams)</option>
                <option value="ml">ml (millilitres)</option>
              </select>
            </div>
          </div>

          <p className="text-xs text-text-muted -mt-1">
            Enter macros <em>per the serving size above</em>
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Inp label="Calories (kcal)" name="calories" type="number" {...f("calories")} placeholder="0" />
            <Inp label="Protein (g)"     name="protein"  type="number" {...f("protein")}  placeholder="0" />
            <Inp label="Carbs (g)"       name="carbs"    type="number" {...f("carbs")}    placeholder="0" />
            <Inp label="Fat (g)"         name="fat"      type="number" {...f("fat")}      placeholder="0" />
          </div>

          {error && (
            <p className="text-xs text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-sm font-medium rounded-[10px] border border-border text-text-2
                         hover:bg-surface-2 transition-colors focus-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 text-sm font-medium rounded-[10px] bg-accent text-white
                         hover:bg-accent-hover disabled:opacity-50 transition-colors focus-accent"
            >
              {loading ? "Adding…" : "Add food"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
