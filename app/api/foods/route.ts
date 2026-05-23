import { NextResponse } from "next/server";
import { defaultFoods } from "@/lib/foods";
import { getCustomFoods } from "@/lib/db";

export async function GET() {
  const custom = await getCustomFoods();
  return NextResponse.json([...defaultFoods, ...custom]);
}
