"use client";

interface Props {
  label:   string;
  value:   number;
  goal:    number;
  unit:    string;
  color:   string; // Tailwind bg-* class
}

export default function ProgressBar({ label, value, goal, unit, color }: Props) {
  const pct     = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  const over    = goal > 0 && value > goal;
  const overBy  = over ? Math.round(value - goal) : 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-text-2">{label}</span>
        <span className="tabular text-text-muted">
          <span className={over ? "text-danger font-semibold" : "text-text"}>
            {value.toLocaleString()}
          </span>
          <span className="text-text-muted"> / {goal.toLocaleString()}{unit}</span>
        </span>
      </div>
      <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-smooth ${
            over ? "bg-danger" : color
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {over && (
        <p className="text-xs text-danger tabular">
          +{overBy.toLocaleString()}{unit} over goal
        </p>
      )}
    </div>
  );
}
