import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { JdAnalysis, ScoreReport } from "./ai-schemas";

export type Experience = { title: string; company: string; location: string; start: string; end: string; notes: string; fresher?: boolean };
export type Education = { school: string; degree: string; year: string };
export type Resume = {
  personal: { name: string; email: string; phone: string; location: string; linkedin: string };
  summary: string;
  experience: Experience[];
  skills: string;
  education: Education[];
  certifications: string; // one per line
  projects: string; // one per line
  targetTitle: string;
};

export type TailorNotes = { changes: string[]; missing: string[]; suggestions: string[] };
export type BuildNotes = { needsMoreInfo: string[]; missingSections: string[]; suggestions: string[] };

type State = {
  resume: Resume;
  jd: string;
  rawText: string;
  jdAnalysis: JdAnalysis | null;
  scoreBefore: ScoreReport | null;
  scoreAfter: ScoreReport | null;
  tailorNotes: TailorNotes | null;
  buildNotes: BuildNotes | null;
  coverLetter: string;
  tailored: Resume | null;
};

export const emptyExperience = (): Experience => ({ title: "", company: "", location: "", start: "", end: "", notes: "" });
export const emptyEducation = (): Education => ({ school: "", degree: "", year: "" });

export const emptyResume = (): Resume => ({
  personal: { name: "", email: "", phone: "", location: "", linkedin: "" },
  summary: "",
  experience: [emptyExperience()],
  skills: "",
  education: [emptyEducation()],
  certifications: "",
  projects: "",
  targetTitle: "",
});

const initial: State = {
  resume: emptyResume(),
  jd: "",
  rawText: "",
  jdAnalysis: null,
  scoreBefore: null,
  scoreAfter: null,
  tailorNotes: null,
  buildNotes: null,
  coverLetter: "",
  tailored: null,
};

const KEY = "ats-resume-session-v2";
const Ctx = createContext<{ state: State; update: (p: Partial<State>) => void; reset: () => void } | null>(null);

export function ResumeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const raw = sessionStorage.getItem(KEY);
    if (raw) try {
      const parsed = JSON.parse(raw) as State;
      // Older sessions predate the fresher flag — coerce it in.
      parsed.resume.experience = parsed.resume.experience.map((x) => ({ fresher: false, ...x }));
      setState({ ...initial, ...parsed });
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) sessionStorage.setItem(KEY, JSON.stringify(state)); }, [state, loaded]);
  return (
    <Ctx.Provider value={{ state, update: (p) => setState((s) => ({ ...s, ...p })), reset: () => setState(initial) }}>
      {children}
    </Ctx.Provider>
  );
}

export function useResume() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useResume must be inside ResumeProvider");
  return c;
}
