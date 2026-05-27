import { getServerSession }                              from "next-auth";
import { NextResponse }                                  from "next/server";
import { authOptions }                                   from "@/lib/auth";
import { getWeightLog, upsertWeightEntry, deleteWeightEntry } from "@/lib/userdb";

// GET /api/user/weight          → full history
// GET /api/user/weight?date=…   → single entry (kg | null)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json(null, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const log  = await getWeightLog(session.user.id);

  if (date) {
    const entry = log.find((e) => e.date === date);
    return NextResponse.json(entry?.kg ?? null);
  }
  return NextResponse.json(log);
}

// PUT /api/user/weight   body: { date, kg }
// DELETE /api/user/weight?date=…
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

  const { date, kg } = await req.json();
  if (!date || kg == null) return NextResponse.json({ error: "date and kg required" }, { status: 400 });

  await upsertWeightEntry(session.user.id, date, Number(kg));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({}, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  await deleteWeightEntry(session.user.id, date);
  return NextResponse.json({ ok: true });
}
