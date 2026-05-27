"use client";

import { signOut } from "next-auth/react";
import Link        from "next/link";
import ThemeToggle from "./ThemeToggle";
import type { Theme } from "@/lib/theme";

interface Props {
  themePref:    Theme;
  onCycleTheme: () => void;
  onGoals:      () => void;
  onAddFood:    () => void;
  userEmail?:   string;
}

export default function Header({
  themePref, onCycleTheme, onGoals, onAddFood, userEmail,
}: Props) {
  return (
    <header className="sticky top-0 z-30 bg-bg/80 backdrop-blur-md border-b border-border-soft px-4 sm:px-6">
      <div className="max-w-4xl mx-auto h-14 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-text tracking-tight">Macro Tracker</span>
          <span className="hidden sm:inline-block text-xs text-text-muted">·</span>
          <span className="hidden sm:inline-block text-xs text-text-muted">Daily nutrition</span>
        </div>

        {/* Actions */}
        <nav className="flex items-center gap-1" aria-label="App controls">
          <button
            onClick={onAddFood}
            className="text-xs font-medium text-accent hover:text-accent-hover px-2.5 py-1.5
                       rounded-lg hover:bg-accent-surface transition-colors focus-accent"
            aria-label="Add food to database"
          >
            <span className="mr-1">＋</span>
            <span className="hidden sm:inline">Add food</span>
          </button>

          <button
            onClick={onGoals}
            className="text-xs text-text-2 hover:text-text px-2.5 py-1.5 rounded-lg
                       hover:bg-surface-2 transition-colors focus-accent"
            aria-label="Set daily goals"
          >
            Goals
          </button>

          <ThemeToggle pref={themePref} onCycle={onCycleTheme} />

          <Link
            href="/weight"
            className="text-xs text-text-muted hover:text-text px-2.5 py-1.5 rounded-lg
                       hover:bg-surface-2 transition-colors focus-accent"
          >
            ⚖️ <span className="hidden sm:inline">Weight</span>
          </Link>

          <Link
            href="/admin"
            className="text-xs text-text-muted hover:text-text px-2.5 py-1.5 rounded-lg
                       hover:bg-surface-2 transition-colors focus-accent"
          >
            Admin
          </Link>

          {/* User info + sign out */}
          {userEmail && (
            <>
              <span className="hidden sm:inline text-xs text-text-muted truncate max-w-[120px]"
                    title={userEmail}>
                {userEmail}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-xs text-text-muted hover:text-danger px-2.5 py-1.5 rounded-lg
                           hover:bg-danger/10 transition-colors focus-accent"
              >
                Sign out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
