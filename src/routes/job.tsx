import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { analyzeJd, scoreResume } from "@/lib/ai.functions";
import { toSpec } from "@/lib/resume-convert";
import { useResume } from "@/lib/resume-store";

export const Route = createFileRoute("/job")({
  head: () => ({
    meta: [
      { title: "Paste Job Description — ATS Resume Builder" },
      { name: "description", content: "Paste the job description you're targeting to analyze keywords and fit." },
      { property: "og:title", content: "Paste Job Description — ATS Resume Builder" },
      { property: "og:description", content: "Paste the job description you're targeting to analyze keywords and fit." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JobPage,
});

// Cache JD analyses for this session so re-analyzing the same text is free.
const cache = new Map<string, unknown>();

function JobPage() {
  const { state, update } = useResume();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const len = state.jd.trim().length;

  const analyze = async () => {
    setBusy(true); setError("");
    const jd = state.jd.trim();
    let data = cache.get(jd) as typeof state.jdAnalysis;
    if (!data) {
      const res = await analyzeJd({ data: { jd: jd.slice(0, 30000) } });
      if (!res.ok) { setBusy(false); return setError(res.error); }
      data = res.data; cache.set(jd, data);
    }
    // Score the user's original resume right away so they see the "before" number.
    let scoreBefore = null;
    if (data && (state.rawText || state.resume.experience.some((x) => x.title || x.notes))) {
      const s = await scoreResume({ data: { resumeJson: JSON.stringify(toSpec(state.resume)), jdJson: JSON.stringify(data) } });
      if (s.ok) scoreBefore = s.data;
    }
    update({ jdAnalysis: data, scoreBefore, scoreAfter: null, tailorNotes: null, tailored: null, coverLetter: "" });
    navigate({ to: "/review" });
  };

  const a = state.jdAnalysis;
  return (
    <PageShell step={1} title="Paste the job description" subtitle="Paste the complete JD for best results — responsibilities, requirements and nice-to-haves.">
      <textarea
        className="field min-h-[420px] font-mono text-sm"
        placeholder="Paste the full job description here (at least 200 characters)…"
        value={state.jd}
        onChange={(e) => update({ jd: e.target.value })}
      />
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{len} characters{len < 200 && " — need at least 200"}</span>
        <button className="btn btn-primary" disabled={len < 200 || busy} onClick={analyze}>
          {busy ? "Analyzing & scoring…" : "Analyze Job"}
        </button>
      </div>
      {a && !busy && (
        <p className="mt-4 text-sm text-muted-foreground">Last analysis: {a.job_title}{a.company_name && ` at ${a.company_name}`} — {a.ats_keywords.length} keywords.</p>
      )}
    </PageShell>
  );
}
