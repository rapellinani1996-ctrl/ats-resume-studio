import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";
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

function JobPage() {
  const { state, update } = useResume();
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const analyze = async () => {
    setBusy(true);
    // Placeholder result — AI analysis is wired up once prompts are provided.
    await new Promise((r) => setTimeout(r, 600));
    update({
      ats: {
        scoreBefore: 48,
        scoreAfter: 82,
        matched: ["React", "TypeScript", "REST APIs"],
        missing: ["GraphQL", "Accessibility", "Jest"],
        fixes: ["Add measurable outcomes to recent role", "Mirror the job title in your summary", "List testing tools you've used"],
      },
    });
    navigate({ to: "/review" });
  };

  return (
    <PageShell step={1} title="Paste the job description" subtitle="Include the full posting — responsibilities, requirements and nice-to-haves.">
      <textarea
        className="field min-h-[420px] font-mono text-sm"
        placeholder="Paste the full job description here…"
        value={state.jd}
        onChange={(e) => update({ jd: e.target.value })}
      />
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{state.jd.trim().split(/\s+/).filter(Boolean).length} words</span>
        <button className="btn btn-primary" disabled={state.jd.trim().length < 50 || busy} onClick={analyze}>
          {busy ? "Analyzing…" : "Analyze"}
        </button>
      </div>
    </PageShell>
  );
}
