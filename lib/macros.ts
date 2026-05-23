export type MacroTotals = {
  calories: number;
  protein:  number;
  carbs:    number;
  fat:      number;
};

export function emptyTotals(): MacroTotals {
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

export function addTotals(a: MacroTotals, b: MacroTotals): MacroTotals {
  return {
    calories: a.calories + b.calories,
    protein:  Math.round((a.protein + b.protein) * 10) / 10,
    carbs:    Math.round((a.carbs   + b.carbs)   * 10) / 10,
    fat:      Math.round((a.fat     + b.fat)      * 10) / 10,
  };
}

/** kcal contributed by each macro gram (for donut chart) */
export function macroCals(t: MacroTotals) {
  return {
    proteinCals: Math.round(t.protein * 4),
    carbsCals:   Math.round(t.carbs   * 4),
    fatCals:     Math.round(t.fat     * 9),
  };
}
