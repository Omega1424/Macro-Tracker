export interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  serving: number; // reference serving size in grams or ml
  unit: string;    // "g" or "ml"
  isDefault?: boolean;
}

export const defaultFoods: Food[] = [
  { id: "egg",                  name: "Egg",                  calories: 72,  protein: 6,    fat: 5,    carbs: 0.4,  serving: 50,  unit: "g",  isDefault: true },
  { id: "bread",                name: "Bread",                calories: 139, protein: 7,    fat: 1.3,  carbs: 24.7, serving: 57,  unit: "g",  isDefault: true },
  { id: "peanut-butter",        name: "Peanut Butter",        calories: 576, protein: 28,   fat: 48,   carbs: 16,   serving: 100, unit: "g",  isDefault: true },
  { id: "milk",                 name: "Milk",                 calories: 158, protein: 10.5, fat: 2.3,  carbs: 15.8, serving: 250, unit: "ml", isDefault: true },
  { id: "whey-protein",         name: "Whey Protein",         calories: 380, protein: 70,   fat: 6.8,  carbs: 9.8,  serving: 100, unit: "g",  isDefault: true },
  { id: "chicken-breast",       name: "Chicken Breast",       calories: 110, protein: 23,   fat: 1,    carbs: 0,    serving: 112, unit: "g",  isDefault: true },
  { id: "jasmine-rice",         name: "Jasmine Rice",         calories: 384, protein: 7,    fat: 0.6,  carbs: 84.2, serving: 100, unit: "g",  isDefault: true },
  { id: "broccoli",             name: "Broccoli",             calories: 35,  protein: 2,    fat: 0.4,  carbs: 7,    serving: 100, unit: "g",  isDefault: true },
  { id: "olive-oil",            name: "Olive Oil",            calories: 120, protein: 0,    fat: 14,   carbs: 0,    serving: 15,  unit: "ml", isDefault: true },
  { id: "soy-sauce",            name: "Soy Sauce",            calories: 92,  protein: 7.7,  fat: 0,    carbs: 14,   serving: 100, unit: "ml", isDefault: true },
  { id: "yoghurt",              name: "Yoghurt",              calories: 130, protein: 4.2,  fat: 10,   carbs: 5.1,  serving: 100, unit: "g",  isDefault: true },
  { id: "tuna",                 name: "Tuna (Chili, Ayam Brand)", calories: 78, protein: 5.6, fat: 5.1, carbs: 2,   serving: 40,  unit: "g",  isDefault: true },
  { id: "whey-protein-isolate", name: "Whey Protein Isolate", calories: 100, protein: 25,   fat: 0,    carbs: 1,    serving: 30,  unit: "g",  isDefault: true },
];

export function calculateNutrition(food: Food, amount: number) {
  const factor = amount / food.serving;
  return {
    calories: Math.round(food.calories * factor),
    protein:  Math.round(food.protein  * factor * 10) / 10,
    fat:      Math.round(food.fat      * factor * 10) / 10,
    carbs:    Math.round(food.carbs    * factor * 10) / 10,
  };
}
