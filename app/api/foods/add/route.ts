import { NextRequest, NextResponse } from "next/server";
import { getCustomFoods, saveCustomFoods } from "@/lib/db";
import type { Food } from "@/lib/foods";

function checkAdmin(req: NextRequest) {
  const pw = req.headers.get("x-admin-password");
  return pw === process.env.ADMIN_PASSWORD && !!process.env.ADMIN_PASSWORD;
}

export async function POST(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, calories, protein, fat, carbs, serving, unit } = body;

  if (!name || calories == null || protein == null || fat == null || carbs == null || !serving || !unit) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const newFood: Food = {
    id: `custom-${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
    name: name.trim(),
    calories: Number(calories),
    protein:  Number(protein),
    fat:      Number(fat),
    carbs:    Number(carbs),
    serving:  Number(serving),
    unit,
    isDefault: false,
  };

  const existing = await getCustomFoods();
  await saveCustomFoods([...existing, newFood]);

  return NextResponse.json({ success: true, food: newFood });
}
