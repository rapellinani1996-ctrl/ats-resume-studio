import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { EducationFields, ExperienceFields, PersonalFields, SkillsField, useResumeEdit } from "@/components/ResumeFields";

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

const STEPS = ["Personal info", "Experience", "Skills", "Education", "Target job"];

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
  const navigate = useNavigate();
  const body = [<PersonalFields />, <ExperienceFields />, <SkillsField />, <EducationFields />, <TargetField />][i];
  return (
    <PageShell step={0} title="Start from scratch" subtitle="Jot down what you really did. The AI will polish wording — never invent experience.">
      <div className="grid gap-8 md:grid-cols-[200px_1fr]">
        <ol className="space-y-2">
          {STEPS.map((s, j) => (
            <li key={s}>
              <button onClick={() => setI(j)} className={`w-full text-left text-sm ${j === i ? "font-semibold" : "text-muted-foreground"}`}>
                <span className="font-display text-xl">{j + 1}</span> {s}
              </button>
            </li>
          ))}
        </ol>
        <div className="card-surface p-6">
          <h2 className="mb-6 text-3xl">{STEPS[i]}</h2>
          {body}
          <div className="mt-8 flex justify-between">
            <button className="btn btn-ghost" disabled={i === 0} onClick={() => setI(i - 1)}>← Back</button>
            {i < STEPS.length - 1
              ? <button className="btn btn-primary" onClick={() => setI(i + 1)}>Next →</button>
              : <button className="btn btn-primary" onClick={() => navigate({ to: "/job" })}>Continue to job →</button>}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
