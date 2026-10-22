import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { useResume } from "@/lib/resume-store";

export const Route = createFileRoute("/download")({
  head: () => ({
    meta: [
      { title: "Download Resume — ATS Resume Builder" },
      { name: "description", content: "Preview and download your ATS-ready resume as PDF or DOCX, plus a cover letter." },
      { property: "og:title", content: "Download Resume — ATS Resume Builder" },
      { property: "og:description", content: "Preview and download your ATS-ready resume as PDF or DOCX." },
    ],
  }),
  component: DownloadPage,
});

function DownloadPage() {
  const { state } = useResume();
  const r = state.resume;
  const p = r.personal;
  return (
    <PageShell step={3} title="Preview & download">
      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <article className="mx-auto w-full max-w-[720px] bg-paper p-12 shadow-[var(--shadow-card)]">
          <h2 className="text-4xl">{p.name || "Your Name"}</h2>
          <p className="text-sm text-muted-foreground">{[p.email, p.phone, p.location, p.linkedin].filter(Boolean).join(" · ") || "email · phone · location"}</p>
          {r.summary && <p className="mt-4 text-sm">{r.summary}</p>}
          <h3 className="mt-6 border-b border-border pb-1 text-xl">Experience</h3>
          {r.experience.map((x, i) => (
            <div key={i} className="mt-3 text-sm">
              <div className="flex justify-between font-semibold"><span>{x.title || "Role"}{x.company && `, ${x.company}`}</span><span>{[x.start, x.end].filter(Boolean).join(" – ")}</span></div>
              <p className="whitespace-pre-line text-muted-foreground">{x.notes}</p>
            </div>
          ))}
          <h3 className="mt-6 border-b border-border pb-1 text-xl">Skills</h3>
          <p className="mt-2 text-sm">{r.skills || "—"}</p>
          <h3 className="mt-6 border-b border-border pb-1 text-xl">Education</h3>
          {r.education.map((e, i) => <p key={i} className="mt-2 text-sm">{[e.degree, e.school, e.year].filter(Boolean).join(", ") || "—"}</p>)}
        </article>
        <aside className="space-y-3 lg:sticky lg:top-6 lg:self-start">
          <button className="btn btn-primary w-full" disabled>Download PDF</button>
          <button className="btn btn-ghost w-full" disabled>Download DOCX</button>
          <button className="btn btn-accent w-full" disabled>Generate Cover Letter</button>
          <p className="text-xs text-muted-foreground">Exports and AI features are connected in the next step.</p>
        </aside>
      </div>
    </PageShell>
  );
}
