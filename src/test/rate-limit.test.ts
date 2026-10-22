import { describe, expect, it } from "vitest";
import { consume, remaining } from "@/lib/rate-limit";

const mem = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }; };

describe("daily generation limit", () => {
  it("allows exactly 3 generations per day", () => {
    const s = mem(); const d = new Date("2026-10-22T10:00:00Z");
    expect([consume(s, d), consume(s, d), consume(s, d), consume(s, d)]).toEqual([true, true, true, false]);
    expect(remaining(s, d)).toBe(0);
  });
  it("resets the next day", () => {
    const s = mem();
    for (let i = 0; i < 3; i++) consume(s, new Date("2026-10-22T10:00:00Z"));
    expect(consume(s, new Date("2026-10-23T10:00:00Z"))).toBe(true);
  });
});
