// Per-browser daily limit, stored in localStorage (per spec). Counts AI tailoring runs.
export const DAILY_LIMIT = 3;
const KEY = "ats-gen-count";

type Entry = { day: string; count: number };
const today = (now = new Date()) => now.toISOString().slice(0, 10);

export function readUsage(store: Pick<Storage, "getItem">, now = new Date()): number {
  try {
    const e = JSON.parse(store.getItem(KEY) || "null") as Entry | null;
    return e && e.day === today(now) ? e.count : 0;
  } catch { return 0; }
}

export function remaining(store: Pick<Storage, "getItem">, now = new Date()) {
  return Math.max(0, DAILY_LIMIT - readUsage(store, now));
}

/** Returns false if the limit is reached; otherwise records one generation. */
export function consume(store: Pick<Storage, "getItem" | "setItem">, now = new Date()): boolean {
  const used = readUsage(store, now);
  if (used >= DAILY_LIMIT) return false;
  store.setItem(KEY, JSON.stringify({ day: today(now), count: used + 1 }));
  return true;
}
