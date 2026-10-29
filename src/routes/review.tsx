import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { EducationFields, ExperienceFields, ExtrasFields, PersonalFields, SkillsField, resumeIssues, useResumeEdit } from "@/components/ResumeFields";
import { Button } from "@/components/ui/button";
import { scoreResume, tailorResume } from "@/lib/ai.functions";
import { DAILY_LIMIT, consume, remaining } from "@/lib/rate-limit";
import { mergeTailoredResume, toSpec } from "@/lib/resume-convert";
import { useResume } from "@/lib/resume-store";
import { acceptTailoredResume, type SuggestionDetail } from "@/lib/resume-acceptance";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Review & Edit — ATS Resume Builder" },
      { name: "description", content: "Edit your tailored resume and see your ATS match score and keyword gaps." },
      { property: "og:title", content: "Review & Edit — ATS Resume Builder" },
      { property: "og:description", content: "Edit your tailored resume and see your ATS match score and keyword gaps." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReviewPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="card-surface p-6"><h2 className="mb-4 text-2xl">{title}</h2>{children}</section>;
}

function ReviewPage() {
  const { state, update } = useResume();
  const { r, set } = useResumeEdit();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const left = typeof window === "undefined" ? DAILY_LIMIT : remaining(window.localStorage);
  const issues = resumeIssues(r);
  const canTailor = !!state.jdAnalysis && !busy && left > 0;
  const [showIssues, setShowIssues] = useState(false);
  const [suggestionDetails, setSuggestionDetails] = useState<Record<number, SuggestionDetail>>({});

  const tailor = async () => {
    if (!state.jdAnalysis) return;
    setError("");
    if (issues.length) return setShowIssues(true);
    // Count each tailoring run against the daily limit before calling the AI.
    if (!consume(window.localStorage)) {
      return setError(`You've used all ${DAILY_LIMIT} free generations for today. Come back tomorrow.`);
    }
    try {
      setBusy("Tailoring your resume to the job…");
      const t = await tailorResume({ data: { resumeJson: JSON.stringify(toSpec(r)), jdJson: JSON.stringify(state.jdAnalysis) } });
      if (!t.ok) throw new Error(t.error);
      const tailored = mergeTailoredResume(t.data, r);
      setBusy("Scoring before & after…");
      const [before, after] = await Promise.all([
        scoreResume({ data: { resumeJson: JSON.stringify(toSpec(r)), jdJson: JSON.stringify(state.jdAnalysis) } }),
        scoreResume({ data: { resumeJson: JSON.stringify(toSpec(tailored)), jdJson: JSON.stringify(state.jdAnalysis) } }),
      ]);
      if (!before.ok) throw new Error(before.error);
      if (!after.ok) throw new Error(after.error);
      // Keep the user's editable resume untouched — the tailored version is
      // stored separately and only replaces it when they click "Add to resume".
      update({
        tailored,
        scoreBefore: before.data,
        scoreAfter: after.data,
        tailorNotes: { changes: t.data.changes_made, missing: t.data.genuinely_missing_keywords, suggestions: t.data.suggestions_to_close_gaps },
        coverLetter: "",
      });
      setSuggestionDetails({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setBusy(""); }
  };

  const addToResume = async () => {
    if (!state.tailored) return;
    const details = Object.values(suggestionDetails).filter((d) => d.text.trim());
    const accepted = acceptTailoredResume(state.tailored, details);
    setError("");
    try {
      setBusy("Adding changes to your resume…");
      let after = state.scoreAfter;
      if (details.length && state.jdAnalysis) {
        const result = await scoreResume({ data: { resumeJson: JSON.stringify(toSpec(accepted)), jdJson: JSON.stringify(state.jdAnalysis) } });
        if (!result.ok) throw new Error(result.error);
        after = result.data;
      }
      update({ resume: accepted, tailored: null, scoreAfter: after, coverLetter: "" });
      setSuggestionDetails({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add changes. Please try again.");
    } finally { setBusy(""); }
  };

  const score = state.scoreAfter ?? state.scoreBefore;
  const ats = score ? { scoreBefore: state.scoreBefore?.total_score ?? 0, scoreAfter: score.total_score, matched: score.matched_keywords, missing: score.missing_keywords, fixes: score.top_3_fixes } : null;
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
          <Section title="Projects & certifications"><ExtrasFields /></Section>
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
            {state.tailorNotes && (
              <div className="space-y-3 border-t border-border pt-4">
                <NoteList title="What the AI changed" items={state.tailorNotes.changes} />
                <NoteList title="Keywords you genuinely lack" items={state.tailorNotes.missing} />
                <NoteList title="How to close the gaps" items={state.tailorNotes.suggestions} />
              </div>
            )}
            {state.tailored && (
              <div className="pop-in space-y-3 rounded-lg border border-accent bg-accent/20 p-4">
                <p className="text-sm font-semibold">AI-tailored version ready</p>
                <p className="text-xs text-muted-foreground">
                  Ready to add the rewritten summary, skills and experience.
                </p>
                {state.tailorNotes?.suggestions.map((suggestion, i) => (
                  <div key={i} className="space-y-2 border-t border-border pt-3">
                    <p className="text-sm">{suggestion}</p>
                    <label className="label-text" htmlFor={`suggestion-section-${i}`}>Resume section</label>
                    <select id={`suggestion-section-${i}`} className="field" value={suggestionDetails[i]?.section ?? "projects"} onChange={(e) => setSuggestionDetails((current) => ({ ...current, [i]: { text: current[i]?.text ?? "", section: e.target.value as SuggestionDetail["section"] } }))}>
                      <option value="summary">Professional Summary</option><option value="skills">Skills</option><option value="projects">Projects</option><option value="certifications">Certifications</option>
                      {state.tailored?.experience.map((entry, index) => <option key={index} value={`experience:${index}`}>{entry.title || `Experience ${index + 1}`}{entry.company ? ` — ${entry.company}` : ""}</option>)}
                    </select>
                    <label className="label-text" htmlFor={`suggestion-detail-${i}`}>Your actual details (optional)</label>
                    <textarea id={`suggestion-detail-${i}`} className="field min-h-24" placeholder="Only skills you have, work you did, or courses you completed." value={suggestionDetails[i]?.text ?? ""} onChange={(e) => setSuggestionDetails((current) => ({ ...current, [i]: { section: current[i]?.section ?? "projects", text: e.target.value } }))} />
                  </div>
                ))}
                <Button className="btn btn-accent w-full" disabled={!!busy} onClick={addToResume}>Add to resume</Button>
              </div>
            )}
            {state.tailorNotes && !state.tailored && <p role="status" className="text-sm text-success">AI changes added to your resume.</p>}
            {showIssues && issues.length > 0 && (
              <div className="pop-in space-y-1 rounded-lg border border-border bg-secondary/40 p-3">
                <p className="text-xs font-semibold">A few details need a quick update:</p>
                <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">{issues.map((i) => <li key={i}>{i}</li>)}</ul>
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="btn btn-ghost w-full" disabled={!canTailor} onClick={tailor}>
              {busy || "Tailor to job (AI)"}
            </Button>
            <p className="text-xs text-muted-foreground">
              {state.jdAnalysis
                ? left > 0
                  ? `${left} of ${DAILY_LIMIT} free generations left today.`
                  : "Daily limit reached — come back tomorrow."
                : "Paste a job description first to enable tailoring."}
            </p>
            {!state.jdAnalysis && <Link to="/job" className="btn btn-ghost w-full">← Add a job description</Link>}
            <Button className="btn btn-primary w-full" disabled={!!busy} onClick={() => state.tailored ? setError('Choose “Add to resume” to accept your AI changes before exporting.') : issues.length ? setShowIssues(true) : navigate({ to: "/download" })}>Continue to export →</Button>
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

function NoteList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="label-text">{title}</p>
      <ul className="list-disc space-y-1 pl-5 text-sm">{items.map((t, k) => <li key={k}>{t}</li>)}</ul>
    </div>
  );
}
