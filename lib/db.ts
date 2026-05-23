/**
 * Database abstraction.
 * - If KV_REST_API_URL + KV_REST_API_TOKEN are set (Vercel KV), foods are persisted in Redis.
 * - Otherwise falls back to an in-memory store (resets on server restart – fine for local dev).
 */
import type { Food } from "./foods";

// In-memory fallback
const _mem: Food[] = [];

function useKV() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export async function getCustomFoods(): Promise<Food[]> {
  if (!useKV()) return _mem;
  try {
    const { kv } = await import("@vercel/kv");
    return (await kv.get<Food[]>("custom_foods")) ?? [];
  } catch {
    return _mem;
  }
}

export async function saveCustomFoods(foods: Food[]): Promise<void> {
  if (!useKV()) {
    _mem.length = 0;
    _mem.push(...foods);
    return;
  }
  const { kv } = await import("@vercel/kv");
  await kv.set("custom_foods", foods);
}
