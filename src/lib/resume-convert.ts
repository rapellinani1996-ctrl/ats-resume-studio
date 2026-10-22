import type { ParsedResume } from "./ai-schemas";
import { emptyEducation, emptyExperience, type Resume } from "./resume-store";

const lines = (s: string) => s.split("\n").map((l) => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean);
const itemText = (x: unknown): string => {
  if (typeof x === "string") return x;
  if (x && typeof x === "object") {
    const o = x as Record<string, unknown>;
    const parts = [o['name'], o['description'], Array.isArray(o['technologies']) && o['technologies'].length ? `(${o['technologies'].join(", ")})` : ""];
    const t = parts.filter(Boolean).join(" — ");
    return t || Object.values(o).filter((v) => typeof v === "string").join(" — ");
  }
  return "";
};

/** AI resume JSON (Prompt 3 / 3b / 6 shape) → editable form state. Keeps contact info from `base` when AI omits it. */
export function fromParsed(p: Partial<ParsedResume>, base: Resume): Resume {
  const exp = (p.experience ?? []).map((x) => {
    let start = x.start_date ?? "", end = x.end_date ?? "";
    if (!start && !end && x.dates) { const [a = "", b = ""] = x.dates.split(/\s*[–—-]\s*/); start = a; end = b; }
    return { ...emptyExperience(), title: x.job_title ?? "", company: x.company ?? "", location: x.location ?? "", start, end, notes: (x.bullets ?? []).join("\n") };
  });
  const edu = (p.education ?? []).map((e) =>
    typeof e === "string" ? { ...emptyEducation(), degree: e } : { school: e.institution ?? "", degree: e.degree ?? "", year: e.year ?? "" },
  );
  const sk = p.skills;
  return {
    personal: {
      name: p.name || base.personal.name,
      email: p.email || base.personal.email,
      phone: p.phone || base.personal.phone,
      location: p.location || base.personal.location,
      linkedin: p.linkedin || base.personal.linkedin,
    },
    summary: p.summary ?? base.summary,
    experience: exp.length ? exp : p.experience ? [emptyExperience()] : base.experience,
    skills: sk ? [...sk.technical, ...sk.tools, ...sk.soft].join(", ") : base.skills,
    education: edu.length ? edu : p.education ? [emptyEducation()] : base.education,
    certifications: p.certifications ? p.certifications.map(itemText).filter(Boolean).join("\n") : base.certifications,
    projects: p.projects ? p.projects.map(itemText).filter(Boolean).join("\n") : base.projects,
    targetTitle: base.targetTitle,
  };
}

/** Editable form state → resume JSON sent to prompts 6, 7 and 10. */
export function toSpec(r: Resume) {
  return {
    name: r.personal.name, email: r.personal.email, phone: r.personal.phone, location: r.personal.location, linkedin: r.personal.linkedin,
    summary: r.summary,
    skills: r.skills.split(",").map((s) => s.trim()).filter(Boolean),
    experience: r.experience
      .filter((x) => x.title || x.company || x.notes)
      .map((x) => ({ job_title: x.title, company: x.company, location: x.location, start_date: x.start, end_date: x.end, bullets: lines(x.notes) })),
    education: r.education.filter((e) => e.school || e.degree).map((e) => ({ degree: e.degree, institution: e.school, year: e.year })),
    certifications: lines(r.certifications),
    projects: lines(r.projects),
  };
}

export const bulletLines = lines;
