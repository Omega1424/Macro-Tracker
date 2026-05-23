"use client";

import { useState, useEffect, useRef } from "react";
import type { Goals } from "@/lib/storage";
import { DEFAULT_GOALS } from "@/lib/storage";

interface Props {
  open:     boolean;
  goals:    Goals;
  onSave:   (g: Goals) => void;
  onClose:  () => void;
}

export default function GoalsDrawer({ open, goals, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<Goals>({ ...goals });
  const firstRef = useRef<HTMLInputElement>(null);

  // Sync draft when goals prop changes
  useEffect(() => { setDraft({ ...goals }); }, [goals]);

  // Focus + Escape
  useEffect(() => {
    if (!open) return;
    setTimeout(() => firstRef.current?.focus(), 50);
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleChange = (key: keyof Goals, raw: string) => {
    const val = raw === "" ? 0 : Math.max(0, Number(raw));
    setDraft((d) => ({ ...d, [key]: val }));
  };

  const handleSave = () => { onSave(draft); onClose(); };
  const handleReset = () => setDraft({ ...DEFAULT_GOALS });

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel — slides from right on md+, from bottom on mobile */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Daily goals"
        className={`fixed z-50 bg-bg border-border shadow-2xl flex flex-col transition-transform duration-300 ease-smooth
          /* mobile: bottom sheet */
          bottom-0 left-0 right-0 border-t rounded-t-2xl max-h-[90vh]
          /* desktop: right sidebar */
          md:bottom-auto md:top-0 md:right-0 md:left-auto md:h-full md:w-80 md:border-l md:border-t-0 md:rounded-t-none
          ${open
            ? "translate-y-0 md:translate-x-0"
            : "translate-y-full md:translate-y-0 md:translate-x-full"
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-soft">
          <div>
            <h2 className="text-sm font-semibold text-text">Daily Goals</h2>
            <p className="text-xs text-text-muted mt-0.5">Set your macro targets</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted
                       hover:text-text hover:bg-surface-2 transition-colors focus-accent text-sm"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Fields */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          <GoalField
            ref={firstRef}
            label="Calories"
            unit="kcal"
            value={draft.calories}
            onChange={(v) => handleChange("calories", v)}
            color="bg-slate-500"
          />
          <GoalField
            label="Protein"
            unit="g"
            value={draft.protein}
            onChange={(v) => handleChange("protein", v)}
            color="bg-sky-500"
          />
          <GoalField
            label="Carbs"
            unit="g"
            value={draft.carbs}
            onChange={(v) => handleChange("carbs", v)}
            color="bg-amber-500"
          />
          <GoalField
            label="Fat"
            unit="g"
            value={draft.fat}
            onChange={(v) => handleChange("fat", v)}
            color="bg-pink-500"
          />

          <button
            onClick={handleReset}
            className="text-xs text-text-muted hover:text-text underline underline-offset-2 w-fit transition-colors"
          >
            Reset to defaults
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-soft">
          <button
            onClick={handleSave}
            className="w-full py-2.5 bg-accent text-white text-sm font-medium rounded-[10px]
                       hover:bg-accent-hover transition-colors focus-accent"
          >
            Save goals
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Goal field ─────────────────────────────────────────── */
interface GoalFieldProps {
  label:    string;
  unit:     string;
  value:    number;
  onChange: (v: string) => void;
  color:    string;
  ref?:     React.RefObject<HTMLInputElement>;
}

import React from "react";
const GoalField = React.forwardRef<HTMLInputElement, GoalFieldProps>(
  ({ label, unit, value, onChange, color }, ref) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${color}`} />
        <label className="text-sm font-medium text-text">{label}</label>
      </div>
      <div className="relative">
        <input
          ref={ref}
          type="number"
          inputMode="numeric"
          min={0}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className="w-full border border-border rounded-[10px] px-3 py-2.5 pr-12 text-sm tabular
                     bg-bg text-text placeholder-text-muted focus:outline-none focus:border-accent
                     focus:ring-2 focus:ring-accent/20 transition-colors"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted pointer-events-none">
          {unit}
        </span>
      </div>
    </div>
  )
);
GoalField.displayName = "GoalField";
