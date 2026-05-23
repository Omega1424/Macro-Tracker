"use client";

import type { Theme } from "@/lib/theme";

interface Props {
  pref: Theme;
  onCycle: () => void;
}

const icons: Record<Theme, string> = {
  light:  "☀",
  dark:   "☽",
  system: "⊙",
};

const labels: Record<Theme, string> = {
  light:  "Light",
  dark:   "Dark",
  system: "System",
};

export default function ThemeToggle({ pref, onCycle }: Props) {
  return (
    <button
      onClick={onCycle}
      title={`Theme: ${labels[pref]} — click to cycle`}
      className="flex items-center gap-1.5 text-xs text-text-2 hover:text-text px-2.5 py-1.5 rounded-lg hover:bg-surface-2 transition-colors focus-accent"
      aria-label={`Theme: ${labels[pref]}`}
    >
      <span className="text-sm leading-none">{icons[pref]}</span>
      <span className="hidden sm:inline">{labels[pref]}</span>
    </button>
  );
}
