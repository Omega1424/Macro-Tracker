"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import type { Food } from "@/lib/foods";

interface Props {
  foods:         Food[];
  onSelect:      (food: Food, amount: number) => void;
  onAddNew:      (prefillName: string) => void;
  // Edit mode — pre-seed with an existing item
  initialFood?:   Food;
  initialAmount?: number;
  submitLabel?:   string;
}

export default function FoodSearch({
  foods, onSelect, onAddNew,
  initialFood, initialAmount, submitLabel = "Add",
}: Props) {
  const [query,       setQuery]       = useState(initialFood?.name ?? "");
  const [amount,      setAmount]      = useState<number | "">(initialAmount ?? initialFood?.serving ?? 100);
  const [active,      setActive]      = useState(false);
  const [cursor,      setCursor]      = useState(-1);
  const [selected,    setSelected]    = useState<Food | null>(initialFood ?? null);
  const [useServings, setUseServings] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLUListElement>(null);

  const filtered = query.trim()
    ? foods.filter((f) =>
        f.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  const showDropdown = active && query.trim().length > 0;

  useEffect(() => {
    if (selected) setAmount(useServings ? 1 : (initialAmount ?? selected.serving));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const pick = (food: Food) => {
    setSelected(food);
    setQuery(food.name);
    setActive(false);
    setCursor(-1);
    setAmount(useServings ? 1 : food.serving);
    setTimeout(() => document.getElementById("food-amount")?.focus(), 0);
  };

  const resolvedAmount = selected && useServings
    ? Number(amount) * selected.serving
    : Number(amount);

  const handleAdd = () => {
    if (!selected || !amount) return;
    onSelect(selected, resolvedAmount);
    if (!initialFood) {
      // Only reset if not in edit mode
      setSelected(null);
      setQuery("");
      setAmount(useServings ? 1 : 100);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const total = filtered.length + (query.trim() && filtered.length < foods.length ? 1 : 0);
    if (!showDropdown) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => (c + 1) % total);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => (c - 1 + total) % total);
    } else if (e.key === "Enter" && cursor >= 0) {
      e.preventDefault();
      if (cursor < filtered.length) {
        pick(filtered[cursor]);
      } else {
        onAddNew(query.trim());
        setActive(false);
      }
    } else if (e.key === "Escape") {
      setActive(false);
    }
  };

  useEffect(() => {
    if (cursor >= 0 && listRef.current) {
      const el = listRef.current.children[cursor] as HTMLElement | undefined;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [cursor]);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search food…"
          value={query}
          autoComplete="off"
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
            setActive(true);
            setCursor(-1);
          }}
          onFocus={() => { if (query) setActive(true); }}
          onBlur={() => setTimeout(() => setActive(false), 150)}
          onKeyDown={handleKey}
          aria-label="Search foods"
          aria-expanded={showDropdown}
          aria-controls="food-dropdown"
          aria-autocomplete="list"
          role="combobox"
          className="w-full text-sm border border-border rounded-[10px] px-3 py-2 bg-bg text-text
                     placeholder-text-muted focus:outline-none focus:border-accent focus:ring-2
                     focus:ring-accent/20 transition-colors"
        />

        {showDropdown && (
          <ul
            id="food-dropdown"
            ref={listRef}
            role="listbox"
            className="absolute z-30 top-full mt-1 left-0 right-0 bg-bg border border-border rounded-xl
                       shadow-lg overflow-y-auto max-h-56 animate-fade-in"
          >
            {filtered.map((food, i) => (
              <li
                key={food.id}
                role="option"
                aria-selected={cursor === i}
                onMouseDown={() => pick(food)}
                className={`flex items-center justify-between px-3 py-2.5 text-sm cursor-pointer
                  transition-colors ${cursor === i ? "bg-accent-surface text-text" : "hover:bg-surface"}`}
              >
                <span className="font-medium text-text truncate flex-1">{food.name}</span>
                <span className="text-text-muted text-xs ml-2 flex-shrink-0">
                  {food.calories} kcal / {food.serving}{food.unit}
                </span>
              </li>
            ))}

            {query.trim() && filtered.length === 0 && (
              <li
                role="option"
                aria-selected={cursor === 0}
                onMouseDown={() => { onAddNew(query.trim()); setActive(false); }}
                className={`flex items-center gap-2 px-3 py-2.5 text-sm cursor-pointer
                  transition-colors ${cursor === 0 ? "bg-accent-surface" : "hover:bg-surface"}`}
              >
                <span className="text-accent font-medium">＋ Add &ldquo;{query}&rdquo; to database</span>
              </li>
            )}

            {query.trim() && filtered.length > 0 && (
              <li
                role="option"
                aria-selected={cursor === filtered.length}
                onMouseDown={() => { onAddNew(query.trim()); setActive(false); }}
                className={`flex items-center gap-2 px-3 py-2.5 text-xs cursor-pointer border-t border-border-soft
                  transition-colors ${cursor === filtered.length ? "bg-accent-surface" : "hover:bg-surface"}`}
              >
                <span className="text-accent">＋ Add &ldquo;{query}&rdquo; to database</span>
              </li>
            )}
          </ul>
        )}
      </div>

      {selected && (
        <div className="flex flex-col gap-1.5 animate-slide-up">
          {/* Mode toggle */}
          <div className="flex gap-1 bg-bg rounded-lg p-0.5 self-start border border-border-soft">
            <button
              onClick={() => { setUseServings(false); setAmount(initialAmount ?? selected.serving); }}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                !useServings ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text"
              }`}
            >
              {selected.unit}
            </button>
            <button
              onClick={() => { setUseServings(true); setAmount(1); }}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                useServings ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text"
              }`}
            >
              servings
            </button>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="food-amount"
                type="number"
                min={useServings ? 0.25 : 1}
                step={useServings ? 0.25 : 1}
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
                placeholder={useServings ? "1" : String(selected.serving)}
                aria-label={useServings ? "Number of servings" : `Amount in ${selected.unit}`}
                className="w-full text-sm border border-border rounded-[10px] px-3 py-2 pr-16 bg-bg text-text tabular
                           focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted pointer-events-none">
                {useServings ? `× ${selected.serving}${selected.unit}` : selected.unit}
              </span>
            </div>
            <button
              onClick={handleAdd}
              disabled={!amount || Number(amount) <= 0}
              className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-[10px]
                         hover:bg-accent-hover disabled:opacity-30 transition-colors focus-accent"
            >
              {submitLabel}
            </button>
          </div>

          {useServings && amount && Number(amount) > 0 && (
            <p className="text-xs text-text-muted">= {resolvedAmount}{selected.unit}</p>
          )}
        </div>
      )}
    </div>
  );
}
