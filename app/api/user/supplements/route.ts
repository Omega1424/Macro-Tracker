import { getServerSession } from "next-auth";
import { NextResponse }     from "next/server";
import { authOptions }      from "@/lib/auth";
import { getUserSupplements, saveUserSupplements } from "@/lib/userdb";

function todayUTC() {
  return new Date().toISOString().split("T")[0];
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? todayUTC();

  const checks = await getUserSupplements(session.user.id, date);
  return NextResponse.json(checks);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? todayUTC();

  const checks = await req.json();
  await saveUserSupplements(session.user.id, date, checks);
  return NextResponse.json({ ok: true });
}
