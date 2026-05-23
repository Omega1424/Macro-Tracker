import { NextRequest, NextResponse } from "next/server";
import { getCustomFoods, saveCustomFoods } from "@/lib/db";
import type { Food } from "@/lib/foods";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Probe request (used by admin login check — just 400, not 401)
  if (body.__probe || body.__ping) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Validate
  const { name, calories, protein, fat, carbs, serving, unit } = body;
  if (
    !name || typeof name !== "string" || name.trim().length === 0 || name.length > 80 ||
    calories == null || protein == null || fat == null || carbs == null ||
    !serving || !unit
  ) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const nums = { calories: Number(calories), protein: Number(protein), fat: Number(fat), carbs: Number(carbs), serving: Number(serving) };
  if (Object.values(nums).some((v) => isNaN(v) || v < 0)) {
    return NextResponse.json({ error: "Macro values must be non-negative numbers" }, { status: 400 });
  }

  const newFood: Food = {
    id:        `custom-${(name as string).toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
    name:      (name as string).trim(),
    unit:      String(unit),
    isDefault: false,
    ...nums,
  };

  const existing = await getCustomFoods();
  await saveCustomFoods([...existing, newFood]);

  return NextResponse.json({ success: true, food: newFood });
}
