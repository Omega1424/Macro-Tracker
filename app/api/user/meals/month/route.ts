import { getServerSession } from "next-auth";
import { NextResponse }     from "next/server";
import { authOptions }      from "@/lib/auth";
import { Redis }            from "@upstash/redis";

function getRedis() {
  return new Redis({
    url:   process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function computeCalories(data: any): number {
  if (!Array.isArray(data)) return 0;
  return data.reduce((total: number, meal: any) => {
    if (!Array.isArray(meal?.items)) return total;
    return total + meal.items.reduce((s: number, item: any) =>
      s + (item?.nutrition?.calories ?? 0), 0);
  }, 0);
}

export interface DaySummary {
  date:     string;         // "YYYY-MM-DD"
  calories: number | null;  // null = no data
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json(null, { status: 401 });

  const { searchParams } = new URL(req.url);
  const now   = new Date();
  const year  = parseInt(searchParams.get("year")  ?? String(now.getUTCFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(now.getUTCMonth() + 1));

  const daysInMonth = new Date(year, month, 0).getDate();
  const monthStr    = String(month).padStart(2, "0");
  const userId      = session.user.id;

  // Build all keys for the month
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = String(i + 1).padStart(2, "0");
    return `${year}-${monthStr}-${day}`;
  });

  try {
    const redis = getRedis();

    // Use a single pipeline to fetch all days in one round-trip instead of 28–31 calls
    const pipeline = redis.pipeline();
    for (const date of days) {
      pipeline.get(`user:${userId}:meals:${date}`);
    }
    const raws = await pipeline.exec();

    const results: DaySummary[] = days.map((date, i) => {
      try {
        const raw = raws[i];
        if (!raw) return { date, calories: null };
        const meals = typeof raw === "string" ? JSON.parse(raw) : raw;
        return { date, calories: computeCalories(meals) };
      } catch {
        return { date, calories: null };
      }
    });

    return NextResponse.json(results);
  } catch (err) {
    console.error("[month] Redis error:", err);
    // Return empty data rather than a 500 — DayBar can still render the skeleton
    const results: DaySummary[] = days.map((date) => ({ date, calories: null }));
    return NextResponse.json(results);
  }
}
