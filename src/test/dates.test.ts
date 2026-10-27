import { describe, expect, it } from "vitest";
import { normalizeDate } from "@/lib/dates";

describe("normalizeDate — parsed resume dates become DD/MM/YY", () => {
  it("keeps DD/MM/YY as-is", () => expect(normalizeDate("01/06/23")).toBe("01/06/23"));
  it("shortens DD/MM/YYYY", () => expect(normalizeDate("01/06/2023")).toBe("01/06/23"));
  it("converts 'Jun 2021'", () => expect(normalizeDate("Jun 2021")).toBe("01/06/21"));
  it("converts 'June 2021'", () => expect(normalizeDate("June 2021")).toBe("01/06/21"));
  it("converts '06/2021'", () => expect(normalizeDate("06/2021")).toBe("01/06/21"));
  it("converts a bare year", () => expect(normalizeDate("2021")).toBe("01/01/21"));
  it("converts '15 June 2021'", () => expect(normalizeDate("15 June 2021")).toBe("15/06/21"));
  it("keeps 'Present'", () => expect(normalizeDate("Present")).toBe("Present"));
  it("keeps 'present' lowercase", () => expect(normalizeDate("present")).toBe("Present"));
  it("passes through unrecognizable text so the user can fix it", () => expect(normalizeDate("early 2020")).toBe("early 2020"));
  it("passes through empty", () => expect(normalizeDate("")).toBe(""));
});
