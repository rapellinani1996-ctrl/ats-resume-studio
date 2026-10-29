import { describe, expect, it } from "vitest";
import { mergeTailoredResume } from "@/lib/resume-convert";
import { emptyResume } from "@/lib/resume-store";
import { resumeToText } from "@/lib/export-files";

describe("accepting a full tailored resume", () => {
  it("adds AI changes while preserving original identity and omitted sections", () => {
    const original = emptyResume();
    original.personal = { name: "Nani", email: "nani@example.com", phone: "9876543210", location: "Kolkata", linkedin: "" };
    original.education = [{ school: "City College", degree: "BSc", year: "2020" }];
    original.projects = "Resume matching tool";
    original.certifications = "AWS certification";
    const accepted = mergeTailoredResume({ summary: "React developer", experience: [{ job_title: "Developer", company: "Acme", location: "Kolkata", start_date: "01/06/23", end_date: "Present", dates: "", bullets: ["Built accessible React interfaces"] }], education: [], certifications: [], projects: [] }, original);
    expect(accepted.personal).toEqual(original.personal);
    expect(accepted.education).toEqual(original.education);
    expect(accepted.projects).toBe("Resume matching tool");
    expect(accepted.certifications).toBe("AWS certification");
    expect(accepted.summary).toBe("React developer");
    expect(accepted.experience[0]?.notes).toBe("Built accessible React interfaces");
  });

  it("includes accepted AI content and every original section in shared text", () => {
    const original = emptyResume();
    original.personal.name = "Nani";
    original.projects = "Resume matching tool";
    original.certifications = "AWS certification";
    const accepted = mergeTailoredResume({ summary: "Tailored React summary" }, original);
    const text = resumeToText(accepted);
    expect(text).toContain("Tailored React summary");
    expect(text).toContain("PROJECTS\n• Resume matching tool");
    expect(text).toContain("CERTIFICATIONS\n• AWS certification");
  });
});