import { NextRequest, NextResponse } from "next/server";
import { getCustomFoods, saveCustomFoods } from "@/lib/db";

function checkAdmin(req: NextRequest) {
  const pw = req.headers.get("x-admin-password");
  return pw === process.env.ADMIN_PASSWORD && !!process.env.ADMIN_PASSWORD;
}

export async function DELETE(req: NextRequest) {
  if (!checkAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const existing = await getCustomFoods();
  const updated = existing.filter((f) => f.id !== id);
  await saveCustomFoods(updated);

  return NextResponse.json({ success: true });
}
