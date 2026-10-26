import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/PageShell";
import { ShareButtons } from "@/components/ShareButtons";
import { coverLetter } from "@/lib/ai.functions";
import { downloadDocx, downloadPdf, downloadText, resumeToText } from "@/lib/export-files";
import { toSpec } from "@/lib/resume-convert";
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
  const { state, update } = useResume();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  // Export the ATS-friendly tailored version when one exists.
  const r = state.tailored ?? state.resume;
  const p = r.personal;

  const print = (what: "resume" | "letter") => {
    document.body.dataset["print"] = what;
    const cleanup = () => { delete document.body.dataset["print"]; window.removeEventListener("afterprint", cleanup); };
    window.addEventListener("afterprint", cleanup);
    window.print();
  };

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label); setError("");
    try { await fn(); } catch (e) {
      console.error(e);
      setError("That didn't work — please try again.");
    } finally { setBusy(""); }
  };

  const genCoverLetter = () => run("Writing your cover letter…", async () => {
    if (!state.jdAnalysis) throw new Error("no jd");
    const res = await coverLetter({ data: { resumeJson: JSON.stringify(toSpec(r)), jdJson: JSON.stringify(state.jdAnalysis) } });
    if (!res.ok) throw new Error(res.error);
    update({ coverLetter: res.data });
  });

  return (
    <PageShell step={3} title="Preview & download">
      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <article className="resume-print mx-auto w-full max-w-[720px] bg-paper p-12 shadow-[var(--shadow-card)]">
          {state.tailored && (
            <p className="mb-4 inline-block rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              ATS-tailored for {state.jdAnalysis?.job_title ?? "the job"}
            </p>
          )}
          <h2 className="text-4xl">{p.name || "Your Name"}</h2>
          <p className="text-sm text-muted-foreground">{[p.email, p.phone, p.location, p.linkedin].filter(Boolean).join(" · ") || "email · phone · location"}</p>
          {r.summary && <p className="mt-4 text-sm">{r.summary}</p>}
          <h3 className="mt-6 border-b border-border pb-1 text-xl">Experience</h3>
          {r.experience.map((x, i) => (
            <div key={i} className="mt-3 text-sm">
              <div className="flex justify-between font-semibold"><span>{x.title || "Role"}{x.company && `, ${x.company}`}</span><span>{x.fresher ? "Fresher" : [x.start, x.end].filter(Boolean).join(" – ")}</span></div>
              <p className="whitespace-pre-line text-muted-foreground">{x.notes}</p>
            </div>
          ))}
          <h3 className="mt-6 border-b border-border pb-1 text-xl">Skills</h3>
          <p className="mt-2 text-sm">{r.skills || "—"}</p>
          <h3 className="mt-6 border-b border-border pb-1 text-xl">Education</h3>
          {r.education.map((e, i) => <p key={i} className="mt-2 text-sm">{[e.degree, e.school, e.year].filter(Boolean).join(", ") || "—"}</p>)}
        </article>
        <aside className="space-y-3 lg:sticky lg:top-6 lg:self-start">
          <button className="btn btn-primary w-full" disabled={!!busy} onClick={() => run("Building PDF…", () => downloadPdf(r))}>
            {busy === "Building PDF…" ? busy : "Download PDF"}
          </button>
          <button className="btn btn-ghost w-full" disabled={!!busy} onClick={() => run("Building DOCX…", () => downloadDocx(r))}>
            {busy === "Building DOCX…" ? busy : "Download DOCX"}
          </button>
          {state.jdAnalysis ? (
            <button className="btn btn-accent w-full" disabled={!!busy} onClick={genCoverLetter}>
              {busy === "Writing your cover letter…" ? busy : state.coverLetter ? "Regenerate Cover Letter" : "Generate Cover Letter"}
            </button>
          ) : (
            <p className="text-xs text-muted-foreground">Add a job description to generate a cover letter.</p>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="border-t border-border pt-3">
            <p className="label-text">Share resume</p>
            <ShareButtons text={resumeToText(r)} title={`${p.name || "My"} — Resume`} onPrint={() => print("resume")} />
          </div>
          <p className="text-xs text-muted-foreground">Cover letters are free — they don't count toward your daily limit.</p>
        </aside>
      </div>
      {state.coverLetter && (
        <section className="card-surface mx-auto mt-8 w-full max-w-[720px] p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-2xl">Cover letter</h3>
            <button className="btn btn-ghost" onClick={() => downloadText(state.coverLetter, `${(p.name || "cover_letter").replace(/[^\w]+/g, "_")}.txt`)}>Download .txt</button>
          </div>
          <p className="letter-print whitespace-pre-line text-sm">{state.coverLetter}</p>
          <div className="mt-4 border-t border-border pt-3">
            <p className="label-text">Share cover letter</p>
            <ShareButtons text={state.coverLetter} title={`${p.name || "My"} — Cover Letter`} onPrint={() => print("letter")} />
          </div>
        </section>
      )}
    </PageShell>
  );
}
