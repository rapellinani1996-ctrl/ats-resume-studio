import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { EducationFields, ExperienceFields, ExtrasFields, PersonalFields, SkillsField, useResumeEdit } from "@/components/ResumeFields";
import { buildResume, polishNotes } from "@/lib/ai.functions";
import { fromParsed, toSpec } from "@/lib/resume-convert";
import { useResume } from "@/lib/resume-store";

export const Route = createFileRoute("/build")({
  head: () => ({
    meta: [
      { title: "Build Your Resume — ATS Resume Builder" },
      { name: "description", content: "A guided, step-by-step form to build your resume from raw notes." },
      { property: "og:title", content: "Build Your Resume — ATS Resume Builder" },
      { property: "og:description", content: "A guided, step-by-step form to build your resume from raw notes." },
    ],
  }),
  component: BuildPage,
});

const STEPS = ["Personal info", "Experience", "Skills", "Education", "Projects & certs", "Target job"];

function TargetField() {
  const { r, set } = useResumeEdit();
  return (
    <div>
      <label className="label-text">Target job title</label>
      <input className="field" placeholder="e.g. Senior Frontend Engineer" value={r.targetTitle} onChange={(e) => set({ targetTitle: e.target.value })} />
    </div>
  );
}

function BuildPage() {
  const [i, setI] = useState(0);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const { state, update } = useResume();
  const navigate = useNavigate();
  const r = state.resume;
  const notes = state.buildNotes;

  const generate = async () => {
    setError("");
    try {
      // Prompt 2b — polish each role's raw notes.
      const needsMoreInfo: string[] = [];
      const experience = [...r.experience];
      for (let k = 0; k < experience.length; k++) {
        const x = experience[k]!;
        if (!x.notes.trim()) continue;
        setBusy(`Polishing notes for role ${k + 1} of ${experience.length}…`);
        const res = await polishNotes({ data: { notes: x.notes } });
        if (!res.ok) throw new Error(res.error);
        experience[k] = { ...x, notes: res.data.polished_bullets.join("\n") };
        needsMoreInfo.push(...res.data.needs_more_info.map((n) => `${x.title || `Role ${k + 1}`}: ${n}`));
      }
      const polished = { ...r, experience };
      // Prompt 3b — build the base resume.
      setBusy("Building your resume…");
      const { summary: _s, ...formData } = toSpec(polished);
      const built = await buildResume({ data: { formJson: JSON.stringify(formData), target: r.targetTitle || "Not specified" } });
      if (!built.ok) throw new Error(built.error);
      update({
        resume: fromParsed(built.data, polished),
        buildNotes: { needsMoreInfo, missingSections: built.data.missing_sections, suggestions: built.data.suggestions },
        scoreBefore: null, scoreAfter: null, tailorNotes: null, coverLetter: "",
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setBusy(""); }
  };

  const body = [<PersonalFields />, <ExperienceFields />, <SkillsField />, <EducationFields />, <ExtrasFields />, <TargetField />][i];
  return (
    <PageShell step={0} title="Start from scratch" subtitle="Jot down what you really did. The AI will polish wording — never invent experience.">
      <div className="grid gap-8 md:grid-cols-[200px_1fr]">
        <ol className="space-y-2">
          {STEPS.map((s, j) => (
            <li key={s}>
              <button onClick={() => { setI(j); setDone(false); }} className={`w-full text-left text-sm ${j === i ? "font-semibold" : "text-muted-foreground"}`}>
                <span className="font-display text-xl">{j + 1}</span> {s}
              </button>
            </li>
          ))}
        </ol>
        <div className="card-surface p-6">
          {done && notes ? (
            <div className="space-y-5">
              <h2 className="text-3xl">Your resume is drafted</h2>
              <p className="text-sm text-muted-foreground">Here's what the AI flagged. You can add details now (go back to any step) or fix them on the review page.</p>
              <NoteList title="Needs more detail" items={notes.needsMoreInfo} />
              <NoteList title="Missing sections" items={notes.missingSections} />
              <NoteList title="Suggestions" items={notes.suggestions} />
              <div className="flex justify-between">
                <button className="btn btn-ghost" onClick={() => { setDone(false); setI(1); }}>← Add details</button>
                <button className="btn btn-primary" onClick={() => navigate({ to: "/job" })}>Continue to job →</button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="mb-6 text-3xl">{STEPS[i]}</h2>
              {body}
              {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
              <div className="mt-8 flex justify-between">
                <button className="btn btn-ghost" disabled={i === 0 || !!busy} onClick={() => setI(i - 1)}>← Back</button>
                {i < STEPS.length - 1
                  ? <button className="btn btn-primary" onClick={() => setI(i + 1)}>Next →</button>
                  : <button className="btn btn-primary" disabled={!!busy || !r.personal.name.trim()} onClick={generate}>{busy || "Polish & build resume →"}</button>}
              </div>
              {i === STEPS.length - 1 && !r.personal.name.trim() && <p className="mt-2 text-xs text-muted-foreground">Add your name in step 1 first.</p>}
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function NoteList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="label-text">{title}</p>
      <ul className="list-disc space-y-1 pl-5 text-sm">{items.map((t, k) => <li key={k}>{t}</li>)}</ul>
    </div>
  );
}
