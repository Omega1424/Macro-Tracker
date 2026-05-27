"use client";

interface Props {
  supplements: string[];                         // configured list from goals
  checks:      Record<string, boolean>;          // today's checked state
  isFuture:    boolean;                          // disable toggling for future dates
  onChange:    (name: string, value: boolean) => void;
}

export default function SupplementChecklist({ supplements, checks, isFuture, onChange }: Props) {
  if (supplements.length === 0) return null;

  const done  = supplements.filter((s) => checks[s]).length;
  const total = supplements.length;

  return (
    <section
      aria-label="Supplement checklist"
      className="bg-surface border border-border-soft rounded-2xl px-5 py-4
                 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Supplements
        </p>
        <span className="text-xs text-text-muted tabular">
          {done}/{total}
        </span>
      </div>

      {/* Pill grid */}
      <div className="flex flex-wrap gap-2">
        {supplements.map((name) => {
          const taken = !!checks[name];
          return (
            <button
              key={name}
              type="button"
              disabled={isFuture}
              onClick={() => !isFuture && onChange(name, !taken)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border
                          transition-colors select-none
                          ${isFuture ? "opacity-40 cursor-default" : "cursor-pointer"}
                          ${taken
                            ? "bg-accent text-white border-accent"
                            : "border-border text-text-muted hover:border-accent hover:text-accent bg-transparent"
                          }`}
            >
              {taken
                ? <span className="text-[10px]">✓</span>
                : <span className="text-[10px] opacity-60">○</span>
              }
              {name}
            </button>
          );
        })}
      </div>
    </section>
  );
}
