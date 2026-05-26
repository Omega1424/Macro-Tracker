import { getServerSession } from "next-auth";
import { NextResponse }     from "next/server";
import { authOptions }      from "@/lib/auth";
import { getUserMeals, saveUserMeals } from "@/lib/userdb";

function todayUTC() {
  return new Date().toISOString().split("T")[0];
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json(null, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? todayUTC();

  const meals = await getUserMeals(session.user.id, date);
  return NextResponse.json(meals ?? null);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json(null, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? todayUTC();

  const meals = await req.json();
  await saveUserMeals(session.user.id, date, meals);
  return NextResponse.json({ ok: true });
}
