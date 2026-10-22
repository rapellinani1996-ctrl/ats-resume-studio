import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { analyzeJd } from "@/lib/ai.functions";
import { useResume } from "@/lib/resume-store";

export const Route = createFileRoute("/job")({
  head: () => ({
    meta: [
      { title: "Paste Job Description — ATS Resume Builder" },
      { name: "description", content: "Paste the job description you're targeting to analyze keywords and fit." },
      { property: "og:title", content: "Paste Job Description — ATS Resume Builder" },
      { property: "og:description", content: "Paste the job description you're targeting to analyze keywords and fit." },
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
    update({ jdAnalysis: data, scoreBefore: null, scoreAfter: null, tailorNotes: null, coverLetter: "" });
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
          {busy ? "Analyzing…" : "Analyze Job"}
        </button>
      </div>
      {a && !busy && (
        <p className="mt-4 text-sm text-muted-foreground">Last analysis: {a.job_title}{a.company_name && ` at ${a.company_name}`} — {a.ats_keywords.length} keywords.</p>
      )}
    </PageShell>
  );
}
