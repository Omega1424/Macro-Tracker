/**
 * Per-user data stored in Upstash Redis (via @upstash/redis directly).
 *
 * Keys:
 *   user:by-email:{email}        → UserRecord
 *   user:{id}:goals              → Goals
 *   user:{id}:meals:{YYYY-MM-DD} → MealPlan  (30-day TTL)
 */

import { Redis } from "@upstash/redis";

function getRedis() {
  const url   = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error(`Missing Redis env vars. KV_REST_API_URL=${url ? "set" : "MISSING"} KV_REST_API_TOKEN=${token ? "set" : "MISSING"}`);
  }
  return new Redis({ url, token });
}

export interface UserRecord {
  id:           string;
  email:        string;
  passwordHash: string;
}

/* ── Users ─────────────────────────────────────────────── */

export async function getUser(email: string): Promise<UserRecord | null> {
  try {
    const redis = getRedis();
    const raw   = await redis.get(`user:by-email:${email}`);
    if (!raw) {
      console.error("[userdb] getUser: no record for", email);
      return null;
    }
    const user = typeof raw === "string" ? JSON.parse(raw) as UserRecord : raw as UserRecord;
    console.log("[userdb] getUser: found", user.email);
    return user;
  } catch (err) {
    console.error("[userdb] getUser error:", err);
    return null;
  }
}

export async function createUser(email: string, passwordHash: string): Promise<UserRecord> {
  const redis = getRedis();
  const id    = crypto.randomUUID();
  const user: UserRecord = { id, email, passwordHash };
  await redis.set(`user:by-email:${email}`, JSON.stringify(user));
  console.log("[userdb] createUser:", email);
  return user;
}

/* ── Goals ──────────────────────────────────────────────── */

export async function getUserGoals(userId: string): Promise<unknown> {
  try {
    const redis = getRedis();
    const raw   = await redis.get(`user:${userId}:goals`);
    if (!raw) return null;
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (err) {
    console.error("[userdb] getUserGoals error:", err);
    return null;
  }
}

export async function saveUserGoals(userId: string, goals: unknown): Promise<void> {
  const redis = getRedis();
  await redis.set(`user:${userId}:goals`, JSON.stringify(goals));
}

/* ── Meals ──────────────────────────────────────────────── */

export async function getUserMeals(userId: string, date: string): Promise<unknown> {
  try {
    const redis = getRedis();
    const raw   = await redis.get(`user:${userId}:meals:${date}`);
    if (!raw) return null;
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (err) {
    console.error("[userdb] getUserMeals error:", err);
    return null;
  }
}

export async function saveUserMeals(userId: string, date: string, meals: unknown): Promise<void> {
  const redis = getRedis();
  // 30-day TTL
  await redis.set(`user:${userId}:meals:${date}`, JSON.stringify(meals), { ex: 60 * 60 * 24 * 30 });
}

/* ── Supplement checks ──────────────────────────────────── */

export async function getUserSupplements(userId: string, date: string): Promise<Record<string, boolean>> {
  try {
    const redis = getRedis();
    const raw   = await redis.get(`user:${userId}:supplements:${date}`);
    if (!raw) return {};
    return typeof raw === "string" ? JSON.parse(raw) : raw as Record<string, boolean>;
  } catch (err) {
    console.error("[userdb] getUserSupplements error:", err);
    return {};
  }
}

export async function saveUserSupplements(userId: string, date: string, checks: Record<string, boolean>): Promise<void> {
  const redis = getRedis();
  await redis.set(`user:${userId}:supplements:${date}`, JSON.stringify(checks), { ex: 60 * 60 * 24 * 30 });
}

/* ── Water intake ───────────────────────────────────────── */

export async function getUserWater(userId: string, date: string): Promise<number> {
  try {
    const redis = getRedis();
    const raw   = await redis.get(`user:${userId}:water:${date}`);
    if (!raw) return 0;
    const val = typeof raw === "string" ? Number(raw) : raw as number;
    return isNaN(val as number) ? 0 : val as number;
  } catch (err) {
    console.error("[userdb] getUserWater error:", err);
    return 0;
  }
}

export async function saveUserWater(userId: string, date: string, ml: number): Promise<void> {
  const redis = getRedis();
  await redis.set(`user:${userId}:water:${date}`, String(ml), { ex: 60 * 60 * 24 * 30 });
}
