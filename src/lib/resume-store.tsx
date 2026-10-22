import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Experience = { title: string; company: string; start: string; end: string; notes: string };
export type Education = { school: string; degree: string; year: string };
export type Resume = {
  personal: { name: string; email: string; phone: string; location: string; linkedin: string };
  summary: string;
  experience: Experience[];
  skills: string;
  education: Education[];
  targetTitle: string;
};
export type AtsResult = {
  scoreBefore: number;
  scoreAfter: number;
  matched: string[];
  missing: string[];
  fixes: string[];
};

type State = { resume: Resume; jd: string; rawText: string; ats: AtsResult | null; coverLetter: string };

export const emptyExperience = (): Experience => ({ title: "", company: "", start: "", end: "", notes: "" });
export const emptyEducation = (): Education => ({ school: "", degree: "", year: "" });

const initial: State = {
  resume: {
    personal: { name: "", email: "", phone: "", location: "", linkedin: "" },
    summary: "",
    experience: [emptyExperience()],
    skills: "",
    education: [emptyEducation()],
    targetTitle: "",
  },
  jd: "",
  rawText: "",
  ats: null,
  coverLetter: "",
};

const KEY = "ats-resume-session";
const Ctx = createContext<{ state: State; update: (p: Partial<State>) => void; reset: () => void } | null>(null);

export function ResumeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const raw = sessionStorage.getItem(KEY);
    if (raw) try { setState({ ...initial, ...JSON.parse(raw) }); } catch { /* ignore */ }
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
