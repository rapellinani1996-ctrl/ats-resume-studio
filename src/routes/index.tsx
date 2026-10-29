import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ATS Resume Builder — Tailor your resume to any job" },
      { name: "description", content: "Upload or build a resume, paste a job description, and get an ATS-optimized resume and cover letter. Truth only." },
      { property: "og:title", content: "ATS Resume Builder" },
      { property: "og:description", content: "Tailor your resume to any job description with an honest ATS score." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <PageShell>
      <section className="grid items-center gap-12 py-12 md:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="label-text">Honest. Tailored. Machine-readable.</p>
          <h1 className="text-6xl leading-[1.02] md:text-7xl">
            Get past the bots <em className="text-muted-foreground">without</em> inventing a thing.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            Paste a job description and we rewrite your real experience in the language recruiters' systems look for — then show you the score.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/upload" className="btn btn-primary">Upload Resume</Link>
            <Link to="/build" className="btn btn-ghost">Start From Scratch</Link>
          </div>
        </div>
        <div className="card-surface p-6">
          <p className="label-text">ATS match</p>
          <div className="flex items-end gap-4">
            <span className="font-display text-5xl text-muted-foreground line-through">42</span>
            <span className="font-display text-8xl">87</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {["React", "TypeScript", "CI/CD", "Stakeholders"].map((k) => (
              <span key={k} className="rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground">{k}</span>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
