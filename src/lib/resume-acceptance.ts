import type { Resume } from "./resume-store";

export type SuggestionDetail = { section: "summary" | "skills" | "projects" | "certifications" | `experience:${number}`; text: string };

/** Only candidate-supplied facts enter the resume; AI advice is never a claim. */
export function acceptTailoredResume(tailored: Resume, details: SuggestionDetail[]): Resume {
  const resume = { ...tailored, personal: { ...tailored.personal }, experience: tailored.experience.map((entry) => ({ ...entry })) };
  for (const detail of details) {
    const text = detail.text.trim();
    if (!text) continue;
    if (detail.section.startsWith("experience:")) {
      const entry = resume.experience[Number(detail.section.split(":")[1])];
      if (entry) entry.notes = [entry.notes, text].filter(Boolean).join("\n");
    } else if (detail.section === "skills") {
      resume.skills = [...new Set([...resume.skills.split(","), ...text.split(",")].map((s) => s.trim()).filter(Boolean))].join(", ");
    } else if (detail.section === "summary" || detail.section === "projects" || detail.section === "certifications") {
      resume[detail.section] = [resume[detail.section], text].filter(Boolean).join(detail.section === "summary" ? " " : "\n");
    }
  }
  return resume;
}