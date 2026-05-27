"use client";

import { useState, useEffect } from "react";

interface Props {
  date:      string;
  initial:   number | null;
  isFuture:  boolean;
  onSaved:   (kg: number | null) => void;
}

export default function WeightLogEntry({ date, initial, isFuture, onSaved }: Props) {
  const [editing,  setEditing]  = useState(false);
  const [input,    setInput]    = useState("");
  const [saved,    setSaved]    = useState(false);

  // Reset when date changes
  useEffect(() => {
    setEditing(initial === null && !isFuture);
    setInput(initial != null ? String(initial) : "");
    setSaved(false);
  }, [date, initial, isFuture]);

  const handleSave = async () => {
    const kg = parseFloat(input);
    if (!input.trim() || isNaN(kg) || kg <= 0) return;
    await fetch("/api/user/weight", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, kg }),
    });
    setSaved(true);
    setEditing(false);
    onSaved(kg);
  };

  const handleDelete = async () => {
    await fetch(`/api/user/weight?date=${date}`, { method: "DELETE" });
    setInput("");
    setEditing(true);
    onSaved(null);
  };

  return (
    <section
      aria-label="Weight log"
      className="bg-surface border border-border-soft rounded-2xl px-5 py-4
                 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">⚖️</span>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Weight</p>
        </div>
        {initial !== null && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-text-muted hover:text-text transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {isFuture ? (
        <p className="text-xs text-text-muted">Can&apos;t log a future date.</p>
      ) : !editing && initial !== null ? (
        /* Logged state */
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-semibold tabular text-text">{initial}</span>
            <span className="text-sm text-text-muted">kg</span>
          </div>
          <button
            onClick={handleDelete}
            className="text-xs text-text-muted hover:text-danger transition-colors"
          >
            Remove
          </button>
        </div>
      ) : (
        /* Input state */
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="20"
              max="500"
              value={input}
              onChange={(e) => { setInput(e.target.value); setSaved(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              placeholder="e.g. 75.5"
              autoFocus={editing}
              className="w-full border border-border rounded-[10px] px-3 py-2.5 pr-10 text-sm
                         bg-bg text-text placeholder-text-muted focus:outline-none focus:border-accent
                         focus:ring-2 focus:ring-accent/20 transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted pointer-events-none">
              kg
            </span>
          </div>
          <button
            onClick={handleSave}
            disabled={!input.trim()}
            className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-[10px]
                       hover:bg-accent-hover disabled:opacity-30 transition-colors"
          >
            {saved ? "Saved ✓" : "Save"}
          </button>
          {initial !== null && (
            <button
              onClick={() => { setEditing(false); setInput(String(initial)); }}
              className="px-3 py-2 text-sm text-text-muted hover:text-text rounded-[10px]
                         hover:bg-surface-2 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </section>
  );
}
