import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type DragEvent } from "react";
import { PageShell } from "@/components/PageShell";
import { parseResume } from "@/lib/ai.functions";
import { extractText } from "@/lib/extract-text";
import { fromParsed } from "@/lib/resume-convert";
import { emptyResume, useResume } from "@/lib/resume-store";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload Resume — ATS Resume Builder" },
      { name: "description", content: "Drop a PDF, DOCX or TXT resume to start tailoring." },
      { property: "og:title", content: "Upload Resume — ATS Resume Builder" },
      { property: "og:description", content: "Drop a PDF, DOCX or TXT resume to start tailoring." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UploadPage,
});

const ACCEPT = [".pdf", ".docx", ".txt"];
const MAX = 5 * 1024 * 1024;

function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const { update } = useResume();
  const navigate = useNavigate();

  const pick = (f?: File) => {
    if (!f) return;
    if (!ACCEPT.some((ext) => f.name.toLowerCase().endsWith(ext))) return setError("Please use a PDF, DOCX or TXT file.");
    if (f.size > MAX) return setError("File is larger than 5 MB.");
    setError("");
    setFile(f);
  };
  const onDrop = (e: DragEvent) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files[0]); };

  const next = async () => {
    if (!file) return;
    setError("");
    try {
      setBusy("Reading your file…");
      const text = (await extractText(file)).trim();
      if (text.length < 200) {
        setBusy("");
        return setError("We couldn't read enough text from this file — it may be a scanned image. Try a DOCX or text-based PDF, or start from scratch.");
      }
      setBusy("AI is structuring your resume…");
      const res = await parseResume({ data: { text: text.slice(0, 60000) } });
      if (!res.ok) { setBusy(""); return setError(res.error); }
      update({ rawText: text, resume: fromParsed(res.data, emptyResume()), scoreBefore: null, scoreAfter: null, tailorNotes: null, buildNotes: null, coverLetter: "" });
      navigate({ to: "/job" });
    } catch (e) {
      console.error(e);
      setBusy("");
      setError("Couldn't read that file. Try another format.");
    }
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
        <span className="mt-2 text-sm text-muted-foreground">{file ? `${(file.size / 1024).toFixed(1)} KB` : "or click to browse — PDF, DOCX, TXT (max 5 MB)"}</span>
      </label>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      <div className="mt-8 flex justify-between">
        <Link to="/build" className="btn btn-ghost">No resume? Start from scratch</Link>
        <button className="btn btn-primary" disabled={!file || !!busy} onClick={next}>{busy || "Parse & continue →"}</button>
      </div>
    </PageShell>
  );
}
