/**
 * Typed localStorage helpers.
 * All keys are prefixed with "mt:" to avoid collisions.
 */

export const KEYS = {
  meals:  "mt:meals",
  goals:  "mt:goals",
  theme:  "mt:theme",
} as const;

export const DEFAULT_GOALS = {
  calories:    2200,
  protein:     160,
  carbs:       250,
  fat:          80,
  waterGoal:   2500,          // ml per day
  supplements: [] as string[],
};

export type Goals = typeof DEFAULT_GOALS;

export const PRESET_SUPPLEMENTS = [
  "Magnesium",
  "Vitamin D",
  "Zinc",
  "Omega-3",
  "Creatine",
  "Vitamin B12",
  "Iron",
];

function safeRead<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or private mode — silent fail
  }
}

function safeRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/* ── Meals ──────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const saveMeals = (meals: any) => safeWrite(KEYS.meals, meals);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const loadMeals = (): any | null => safeRead<any>(KEYS.meals);
export const clearMeals = () => safeRemove(KEYS.meals);

/* ── Goals ──────────────────────────────────────────────── */
export function loadGoals(): Goals {
  return { ...DEFAULT_GOALS, ...(safeRead<Partial<Goals>>(KEYS.goals) ?? {}) };
}
export const saveGoals = (g: Goals) => safeWrite(KEYS.goals, g);
export const clearGoals = () => safeRemove(KEYS.goals);
