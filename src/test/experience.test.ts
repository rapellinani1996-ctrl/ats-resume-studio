import { describe, expect, it } from "vitest";
import { isValidDateDMY, isValidPhone, resumeIssues } from "@/components/ResumeFields";
import { fromParsed } from "@/lib/resume-convert";
import { emptyResume } from "@/lib/resume-store";

describe("phone validation", () => {
  it("accepts digits of any length", () => {
    expect(isValidPhone("9876543210")).toBe(true);
    expect(isValidPhone("98765432101")).toBe(true);
  });
  it("rejects letters", () => {
    expect(isValidPhone("98765abcde")).toBe(false);
  });
  it("allows empty while typing", () => {
    expect(isValidPhone("")).toBe(true);
  });
});

describe("DD/MM/YY date validation", () => {
  it("accepts DD/MM/YY", () => {
    expect(isValidDateDMY("01/06/23")).toBe(true);
  });
  it("rejects other formats", () => {
    expect(isValidDateDMY("2023-06-01")).toBe(false);
    expect(isValidDateDMY("1/6/23")).toBe(false);
    expect(isValidDateDMY("June 2023")).toBe(false);
  });
});

describe("fresher inference from parsed resumes", () => {
  it("marks entries with no dates as fresher", () => {
    const r = fromParsed(
      { experience: [{ job_title: "Intern", company: "Acme", location: "", start_date: "", end_date: "", dates: "", bullets: ["did things"] }] },
      emptyResume(),
    );
    expect(r.experience[0]!.fresher).toBe(true);
  });
  it("keeps dated entries as experienced", () => {
    const r = fromParsed(
      { experience: [{ job_title: "Dev", company: "Acme", location: "", start_date: "01/06/23", end_date: "Present", dates: "", bullets: [] }] },
      emptyResume(),
    );
    expect(r.experience[0]!.fresher).toBe(false);
    expect(r.experience[0]!.end).toBe("Present");
  });
});

describe("review validations block tailoring/export", () => {
  it("flags missing dates on an experienced entry", () => {
    const r = emptyResume();
    r.personal.name = "A"; r.personal.phone = "123";
    expect(resumeIssues(r).length).toBe(2);
  });
  it("passes for fresher with name and phone", () => {
    const r = emptyResume();
    r.personal.name = "A"; r.personal.phone = "123";
    r.experience[0]!.fresher = true;
    expect(resumeIssues(r)).toEqual([]);
  });
});
