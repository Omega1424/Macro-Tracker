/**
 * Per-user data stored in Vercel KV.
 *
 * Keys:
 *   user:by-email:{email}       → UserRecord
 *   user:{id}:goals             → Goals
 *   user:{id}:meals:{YYYY-MM-DD}→ MealPlan  (30-day TTL)
 */

export interface UserRecord {
  id:           string;
  email:        string;
  passwordHash: string;
}

async function db() {
  const { kv } = await import("@vercel/kv");
  return kv;
}

/* ── Users ─────────────────────────────────────────────── */

export async function getUser(email: string): Promise<UserRecord | null> {
  try {
    const kv  = await db();
    const raw = await kv.get(`user:by-email:${email}`);
    if (!raw) { console.error("[userdb] getUser: no record for", email); return null; }
    // Handle both object (already parsed) and string (needs parsing) responses
    const user = typeof raw === "string" ? JSON.parse(raw) as UserRecord : raw as UserRecord;
    console.log("[userdb] getUser: found user", user.email);
    return user;
  } catch (err) {
    console.error("[userdb] getUser error:", err);
    return null;
  }
}

export async function createUser(
  email: string,
  passwordHash: string,
): Promise<UserRecord> {
  const kv   = await db();
  const id   = crypto.randomUUID();
  const user: UserRecord = { id, email, passwordHash };
  await kv.set(`user:by-email:${email}`, user);
  return user;
}

/* ── Goals ──────────────────────────────────────────────── */

export async function getUserGoals(userId: string): Promise<unknown> {
  try {
    const kv = await db();
    return await kv.get(`user:${userId}:goals`);
  } catch {
    return null;
  }
}

export async function saveUserGoals(userId: string, goals: unknown): Promise<void> {
  const kv = await db();
  await kv.set(`user:${userId}:goals`, goals);
}

/* ── Meals ──────────────────────────────────────────────── */

export async function getUserMeals(userId: string, date: string): Promise<unknown> {
  try {
    const kv = await db();
    return await kv.get(`user:${userId}:meals:${date}`);
  } catch {
    return null;
  }
}

export async function saveUserMeals(
  userId: string,
  date:   string,
  meals:  unknown,
): Promise<void> {
  const kv = await db();
  // 30-day TTL so old entries auto-expire
  await kv.set(`user:${userId}:meals:${date}`, meals, { ex: 60 * 60 * 24 * 30 });
}
