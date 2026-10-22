import { emptyEducation, emptyExperience, useResume, type Resume } from "@/lib/resume-store";

export function useResumeEdit() {
  const { state, update } = useResume();
  const r = state.resume;
  const set = (patch: Partial<Resume>) => update({ resume: { ...r, ...patch } });
  return { r, set };
}

export function PersonalFields() {
  const { r, set } = useResumeEdit();
  const keys = ["name", "email", "phone", "location", "linkedin"] as const;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {keys.map((k) => (
        <div key={k} className={k === "name" ? "sm:col-span-2" : ""}>
          <label className="label-text">{k}</label>
          <input className="field" value={r.personal[k]} onChange={(e) => set({ personal: { ...r.personal, [k]: e.target.value } })} />
        </div>
      ))}
    </div>
  );
}

export function ExperienceFields({ notesLabel = "Raw notes" }: { notesLabel?: string }) {
  const { r, set } = useResumeEdit();
  const edit = (i: number, k: string, v: string) =>
    set({ experience: r.experience.map((x, j) => (j === i ? { ...x, [k]: v } : x)) });
  return (
    <div className="space-y-6">
      {r.experience.map((x, i) => (
        <div key={i} className="rounded-lg border border-border p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {(["title", "company", "location", "start", "end"] as const).map((k) => (
              <div key={k}><label className="label-text">{k}</label><input className="field" value={x[k]} onChange={(e) => edit(i, k, e.target.value)} /></div>
            ))}
          </div>
          <label className="label-text mt-3">{notesLabel}</label>
          <textarea className="field min-h-28" placeholder="What you actually did — messy is fine." value={x.notes} onChange={(e) => edit(i, "notes", e.target.value)} />
          {r.experience.length > 1 && (
            <button className="mt-2 text-sm text-destructive" onClick={() => set({ experience: r.experience.filter((_, j) => j !== i) })}>Remove</button>
          )}
        </div>
      ))}
      <button className="btn btn-ghost" onClick={() => set({ experience: [...r.experience, emptyExperience()] })}>+ Add role</button>
    </div>
  );
}

export function SkillsField() {
  const { r, set } = useResumeEdit();
  return (
    <div>
      <label className="label-text">Skills (comma separated)</label>
      <textarea className="field min-h-24" value={r.skills} onChange={(e) => set({ skills: e.target.value })} />
    </div>
  );
}

export function EducationFields() {
  const { r, set } = useResumeEdit();
  const edit = (i: number, k: string, v: string) =>
    set({ education: r.education.map((x, j) => (j === i ? { ...x, [k]: v } : x)) });
  return (
    <div className="space-y-4">
      {r.education.map((x, i) => (
        <div key={i} className="grid gap-3 sm:grid-cols-3">
          {(["school", "degree", "year"] as const).map((k) => (
            <div key={k}><label className="label-text">{k}</label><input className="field" value={x[k]} onChange={(e) => edit(i, k, e.target.value)} /></div>
          ))}
        </div>
      ))}
      <button className="btn btn-ghost" onClick={() => set({ education: [...r.education, emptyEducation()] })}>+ Add education</button>
    </div>
  );
}

export function ExtrasFields() {
  const { r, set } = useResumeEdit();
  return (
    <div className="space-y-4">
      <div>
        <label className="label-text">Projects (optional, one per line)</label>
        <textarea className="field min-h-24" placeholder="Project name — what it does (tech used)" value={r.projects} onChange={(e) => set({ projects: e.target.value })} />
      </div>
      <div>
        <label className="label-text">Certifications (optional, one per line)</label>
        <textarea className="field min-h-20" value={r.certifications} onChange={(e) => set({ certifications: e.target.value })} />
      </div>
    </div>
  );
}
