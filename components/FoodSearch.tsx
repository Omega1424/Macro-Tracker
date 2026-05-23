"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import type { Food } from "@/lib/foods";

interface Props {
  foods:        Food[];
  onSelect:     (food: Food, amount: number) => void;
  onAddNew:     (prefillName: string) => void;  // trigger AddFoodModal
}

export default function FoodSearch({ foods, onSelect, onAddNew }: Props) {
  const [query,    setQuery]    = useState("");
  const [amount,   setAmount]   = useState<number | "">(100);
  const [active,   setActive]   = useState(false);
  const [cursor,   setCursor]   = useState(-1);
  const [selected, setSelected] = useState<Food | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef  = useRef<HTMLUListElement>(null);

  const filtered = query.trim()
    ? foods.filter((f) =>
        f.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  const showDropdown = active && query.trim().length > 0;

  // When food is selected, default amount to serving size
  useEffect(() => {
    if (selected) setAmount(selected.serving);
  }, [selected]);

  const pick = (food: Food) => {
    setSelected(food);
    setQuery(food.name);
    setActive(false);
    setCursor(-1);
    setTimeout(() => document.getElementById("food-amount")?.focus(), 0);
  };

  const handleAdd = () => {
    if (!selected || !amount) return;
    onSelect(selected, Number(amount));
    setSelected(null);
    setQuery("");
    setAmount(100);
    inputRef.current?.focus();
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

  // Scroll active item into view
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

        {/* Dropdown */}
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

            {/* "Add to database" option when query has no match */}
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

            {/* "Add to database" row appended below results */}
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

      {/* Amount row — only shown once a food is selected */}
      {selected && (
        <div className="flex gap-2 animate-slide-up">
          <div className="relative flex-1">
            <input
              id="food-amount"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
              placeholder={String(selected.serving)}
              aria-label={`Amount in ${selected.unit}`}
              className="w-full text-sm border border-border rounded-[10px] px-3 py-2 pr-9 bg-bg text-text tabular
                         focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted pointer-events-none">
              {selected.unit}
            </span>
          </div>
          <button
            onClick={handleAdd}
            disabled={!amount || Number(amount) <= 0}
            className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-[10px]
                       hover:bg-accent-hover disabled:opacity-30 transition-colors focus-accent"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
