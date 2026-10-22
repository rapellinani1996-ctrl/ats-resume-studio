import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type DragEvent } from "react";
import { PageShell } from "@/components/PageShell";
import { useResume } from "@/lib/resume-store";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload Resume — ATS Resume Builder" },
      { name: "description", content: "Drop a PDF, DOCX or TXT resume to start tailoring." },
      { property: "og:title", content: "Upload Resume — ATS Resume Builder" },
      { property: "og:description", content: "Drop a PDF, DOCX or TXT resume to start tailoring." },
    ],
  }),
  component: UploadPage,
});

const ACCEPT = [".pdf", ".docx", ".txt"];

function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState("");
  const { update } = useResume();
  const navigate = useNavigate();

  const pick = (f?: File) => {
    if (!f) return;
    if (!ACCEPT.some((ext) => f.name.toLowerCase().endsWith(ext))) return setError("Please use a PDF, DOCX or TXT file.");
    setError("");
    setFile(f);
  };
  const onDrop = (e: DragEvent) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files[0]); };

  const next = async () => {
    // Placeholder: text extraction + AI parsing come next.
    if (file?.name.endsWith(".txt")) update({ rawText: await file.text() });
    navigate({ to: "/job" });
  };

  return (
    <PageShell step={0} title="Upload your resume" subtitle="We'll read it and turn it into editable fields. Nothing is stored after you close this tab.">
      <label
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={`card-surface flex cursor-pointer flex-col items-center justify-center border-2 border-dashed p-16 text-center transition ${over ? "border-primary bg-secondary" : ""}`}
      >
        <input type="file" accept={ACCEPT.join(",")} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        <span className="font-display text-4xl">{file ? file.name : "Drop your file here"}</span>
        <span className="mt-2 text-sm text-muted-foreground">{file ? `${(file.size / 1024).toFixed(1)} KB` : "or click to browse — PDF, DOCX, TXT"}</span>
      </label>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <div className="mt-8 flex justify-between">
        <Link to="/build" className="btn btn-ghost">No resume? Start from scratch</Link>
        <button className="btn btn-primary" disabled={!file} onClick={next}>Parse & continue →</button>
      </div>
    </PageShell>
  );
}
