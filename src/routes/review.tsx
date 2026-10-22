import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { EducationFields, ExperienceFields, PersonalFields, SkillsField, useResumeEdit } from "@/components/ResumeFields";
import { useResume } from "@/lib/resume-store";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Review & Edit — ATS Resume Builder" },
      { name: "description", content: "Edit your tailored resume and see your ATS match score and keyword gaps." },
      { property: "og:title", content: "Review & Edit — ATS Resume Builder" },
      { property: "og:description", content: "Edit your tailored resume and see your ATS match score and keyword gaps." },
    ],
  }),
  component: ReviewPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="card-surface p-6"><h2 className="mb-4 text-2xl">{title}</h2>{children}</section>;
}

function ReviewPage() {
  const { state } = useResume();
  const { r, set } = useResumeEdit();
  const ats = state.scoreAfter ?? state.scoreBefore ? { scoreBefore: state.scoreBefore?.total_score ?? 0, scoreAfter: (state.scoreAfter ?? state.scoreBefore)!.total_score, matched: (state.scoreAfter ?? state.scoreBefore)!.matched_keywords, missing: (state.scoreAfter ?? state.scoreBefore)!.missing_keywords, fixes: (state.scoreAfter ?? state.scoreBefore)!.top_3_fixes } : null;
  return (
    <PageShell step={2} title="Review & edit" subtitle="Every line should be something you can defend in an interview.">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Section title="Contact"><PersonalFields /></Section>
          <Section title="Summary">
            <textarea className="field min-h-24" value={r.summary} onChange={(e) => set({ summary: e.target.value })} />
          </Section>
          <Section title="Experience"><ExperienceFields notesLabel="Bullets" /></Section>
          <Section title="Skills"><SkillsField /></Section>
          <Section title="Education"><EducationFields /></Section>
        </div>
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="card-surface space-y-6 p-6">
            <div>
              <p className="label-text">ATS score</p>
              {ats ? (
                <div className="flex items-end gap-3">
                  <span className="font-display text-4xl text-muted-foreground">{ats.scoreBefore}</span>
                  <span className="pb-2 text-muted-foreground">→</span>
                  <span className="font-display text-7xl text-success">{ats.scoreAfter}</span>
                </div>
              ) : <p className="text-sm text-muted-foreground">Analyze a job description to see your score.</p>}
            </div>
            {ats && (
              <>
                <KeywordList title="Matched keywords" items={ats.matched} tone="bg-accent text-accent-foreground" />
                <KeywordList title="Missing keywords" items={ats.missing} tone="bg-secondary text-destructive" />
                <div>
                  <p className="label-text">Top 3 fixes</p>
                  <ol className="list-decimal space-y-1 pl-5 text-sm">{ats.fixes.map((f: string) => <li key={f}>{f}</li>)}</ol>
                </div>
              </>
            )}
            <button className="btn btn-ghost w-full" disabled>Tailor to job (AI)</button>
            <Link to="/download" className="btn btn-primary w-full">Continue to export →</Link>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

function KeywordList({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <div>
      <p className="label-text">{title}</p>
      <div className="flex flex-wrap gap-2">{items.map((k) => <span key={k} className={`rounded-full px-3 py-1 text-xs ${tone}`}>{k}</span>)}</div>
    </div>
  );
}
