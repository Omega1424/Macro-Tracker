import { getServerSession } from "next-auth";
import { NextResponse }     from "next/server";
import { authOptions }      from "@/lib/auth";
import { getUserGoals, saveUserGoals } from "@/lib/userdb";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json(null, { status: 401 });

  const goals = await getUserGoals(session.user.id);
  return NextResponse.json(goals ?? null);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json(null, { status: 401 });

  const goals = await req.json();
  await saveUserGoals(session.user.id, goals);
  return NextResponse.json({ ok: true });
}
