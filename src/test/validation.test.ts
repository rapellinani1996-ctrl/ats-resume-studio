import { describe, expect, it } from "vitest";
import { resumeIssues } from "@/components/ResumeFields";
import { emptyResume } from "@/lib/resume-store";

const ok = () => {
  const r = emptyResume();
  r.personal.name = "Nani";
  r.personal.phone = "9876543210";
  r.personal.email = "nani@example.com";
  r.experience = [{ title: "Dev", company: "Acme", location: "", start: "01/06/23", end: "Present", notes: "Built things" }];
  return r;
};

describe("resumeIssues — blocks tailor/export until fixed", () => {
  it("passes a complete resume", () => {
    expect(resumeIssues(ok())).toEqual([]);
  });
  it("requires a name", () => {
    const r = ok(); r.personal.name = "";
    expect(resumeIssues(r)).toContain("Contact: add your name.");
  });
  it("requires a mobile number", () => {
    const r = ok(); r.personal.phone = "";
    expect(resumeIssues(r)).toContain("Contact: add your mobile number.");
  });
  it("rejects an invalid email", () => {
    const r = ok(); r.personal.email = "not-an-email";
    expect(resumeIssues(r)).toContain("Contact: email looks invalid.");
  });
  it("rejects dates not in DD/MM/YY", () => {
    const r = ok(); r.experience[0]!.start = "2023-06-01";
    expect(resumeIssues(r).some((i) => i.includes("start date must be DD/MM/YY"))).toBe(true);
  });
  it("accepts 'Present' as end date without a date", () => {
    const r = ok(); r.experience[0]!.end = "Present";
    expect(resumeIssues(r)).toEqual([]);
  });
  it("skips date checks for fresher entries", () => {
    const r = ok();
    r.experience[0]!.start = ""; r.experience[0]!.end = ""; r.experience[0]!.fresher = true;
    expect(resumeIssues(r)).toEqual([]);
  });
});
