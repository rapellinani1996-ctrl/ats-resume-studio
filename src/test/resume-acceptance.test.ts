import { describe, expect, it } from "vitest";
import { acceptTailoredResume } from "@/lib/resume-acceptance";
import { emptyResume } from "@/lib/resume-store";
import { resumeToText } from "@/lib/export-files";

describe("adding tailoring and suggestion details to the final resume", () => {
  it("retains AI rewrites and exports supplied suggestion details in the selected sections", () => {
    const draft = emptyResume();
    draft.summary = "React developer building accessible interfaces.";
    draft.experience[0] = { title: "Developer", company: "Acme", location: "", start: "01/06/23", end: "Present", notes: "Built React interfaces", fresher: false };
    const accepted = acceptTailoredResume(draft, [
      { section: "experience:0", text: "Reduced page load time by 20%" },
      { section: "projects", text: "Accessible portfolio — React" },
      { section: "certifications", text: "Completed accessibility course" },
    ]);
    expect(accepted.summary).toBe(draft.summary);
    expect(accepted.experience[0]?.notes).toBe("Built React interfaces\nReduced page load time by 20%");
    expect(resumeToText(accepted)).toContain("Accessible portfolio — React");
    expect(resumeToText(accepted)).toContain("Completed accessibility course");
    expect(draft.experience[0]?.notes).toBe("Built React interfaces");
  });

  it("does not add advice or unearned qualifications when no factual details are supplied", () => {
    const draft = emptyResume();
    draft.skills = "React";
    expect(acceptTailoredResume(draft, [{ section: "certifications", text: "  " }])).toEqual(draft);
  });

  it("includes confirmed skills without duplicating existing ones", () => {
    const draft = emptyResume();
    draft.skills = "React, TypeScript";
    expect(acceptTailoredResume(draft, [{ section: "skills", text: "React, Accessibility" }]).skills).toBe("React, TypeScript, Accessibility");
  });
});