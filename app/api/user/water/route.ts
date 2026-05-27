import { getServerSession } from "next-auth";
import { NextResponse }     from "next/server";
import { authOptions }      from "@/lib/auth";
import { getUserWater, saveUserWater } from "@/lib/userdb";

function todayUTC() {
  return new Date().toISOString().split("T")[0];
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json(0, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? todayUTC();

  const ml = await getUserWater(session.user.id, date);
  return NextResponse.json(ml);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? todayUTC();

  const { ml } = await req.json();
  await saveUserWater(session.user.id, date, Math.max(0, Number(ml)));
  return NextResponse.json({ ok: true });
}
