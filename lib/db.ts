import type { Food } from "./foods";
import { Redis } from "@upstash/redis";

const _mem: Food[] = [];

function getRedis() {
  const url   = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export async function getCustomFoods(): Promise<Food[]> {
  const redis = getRedis();
  if (!redis) return _mem;
  try {
    const raw = await redis.get("custom_foods");
    if (!raw) return [];
    return typeof raw === "string" ? JSON.parse(raw) : raw as Food[];
  } catch {
    return _mem;
  }
}

export async function saveCustomFoods(foods: Food[]): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    _mem.length = 0;
    _mem.push(...foods);
    return;
  }
  await redis.set("custom_foods", JSON.stringify(foods));
}
