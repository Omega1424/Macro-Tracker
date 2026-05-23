"use client";

import { useState, useEffect, useCallback } from "react";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "mt:theme";

/** Inline script to inject into <head> to prevent FOUC */
export const themeInitScript = `(function(){
  try {
    var t = localStorage.getItem('mt:theme') || 'system';
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (t === 'dark' || (t === 'system' && prefersDark)) {
      document.documentElement.classList.add('dark');
    }
  } catch(e){}
})();`;

function resolveTheme(pref: Theme): "light" | "dark" {
  if (pref === "system") {
    return typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return pref;
}

export function useTheme() {
  const [pref, setPref] = useState<Theme>("system");

  // Hydrate from localStorage after mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (saved && ["light", "dark", "system"].includes(saved)) {
        setPref(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  // Apply class to <html> whenever pref changes
  useEffect(() => {
    const resolved = resolveTheme(pref);
    document.documentElement.classList.toggle("dark", resolved === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch {
      // ignore
    }
  }, [pref]);

  // Also react to system preference changes when pref === "system"
  useEffect(() => {
    if (pref !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle("dark", e.matches);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [pref]);

  const cycle = useCallback(() => {
    setPref((p) => (p === "light" ? "dark" : p === "dark" ? "system" : "light"));
  }, []);

  const resolved = resolveTheme(pref);

  return { pref, resolved, cycle };
}
