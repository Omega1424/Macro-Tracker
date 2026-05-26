import { getServerSession } from "next-auth";
import { NextResponse }     from "next/server";
import { authOptions }      from "@/lib/auth";
import { getUserMeals, saveUserMeals } from "@/lib/userdb";

function todayUTC() {
  return new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json(null, { status: 401 });

  const meals = await getUserMeals(session.user.id, todayUTC());
  return NextResponse.json(meals ?? null);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json(null, { status: 401 });

  const meals = await req.json();
  await saveUserMeals(session.user.id, todayUTC(), meals);
  return NextResponse.json({ ok: true });
}
