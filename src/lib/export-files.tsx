// Browser-only ATS-safe exports: single column, standard headings, no tables/graphics.
import type { Resume } from "./resume-store";
import { bulletLines } from "./resume-convert";

function sections(r: Resume) {
  const p = r.personal;
  return {
    name: p.name || "Your Name",
    contact: [p.email, p.phone, p.location, p.linkedin].filter(Boolean).join(" | "),
    summary: r.summary.trim(),
    skills: r.skills.trim(),
    experience: r.experience.filter((x) => x.title || x.company || x.notes).map((x) => ({
      head: [x.title, x.company, x.location].filter(Boolean).join(", "),
      dates: [x.start, x.end].filter(Boolean).join(" – "),
      bullets: bulletLines(x.notes),
    })),
    education: r.education.filter((e) => e.degree || e.school).map((e) => [e.degree, e.school, e.year].filter(Boolean).join(", ")),
    certifications: bulletLines(r.certifications),
    projects: bulletLines(r.projects),
  };
}

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const fileBase = (r: Resume) => (r.personal.name || "resume").replace(/[^\w]+/g, "_");

export async function downloadPdf(r: Resume) {
  const { Document, Page, Text, View, StyleSheet, pdf } = await import("@react-pdf/renderer");
  const s = sections(r);
  const st = StyleSheet.create({
    page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", lineHeight: 1.35 },
    name: { fontSize: 20, fontFamily: "Helvetica-Bold" },
    h: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 12, marginBottom: 4, borderBottomWidth: 0.5, paddingBottom: 2 },
    bold: { fontFamily: "Helvetica-Bold" },
  });
  const H = ({ t }: { t: string }) => <Text style={st.h}>{t}</Text>;
  const doc = (
    <Document title={s.name}>
      <Page size="A4" style={st.page}>
        <Text style={st.name}>{s.name}</Text>
        {s.contact && <Text>{s.contact}</Text>}
        {s.summary && <><H t="Professional Summary" /><Text>{s.summary}</Text></>}
        {s.skills && <><H t="Skills" /><Text>{s.skills}</Text></>}
        {s.experience.length > 0 && <H t="Professional Experience" />}
        {s.experience.map((x, i) => (
          <View key={i} style={{ marginBottom: 6 }} wrap={false}>
            <Text style={st.bold}>{x.head}</Text>
            {x.dates && <Text>{x.dates}</Text>}
            {x.bullets.map((b, j) => <Text key={j}>• {b}</Text>)}
          </View>
        ))}
        {s.education.length > 0 && <><H t="Education" />{s.education.map((e, i) => <Text key={i}>{e}</Text>)}</>}
        {s.certifications.length > 0 && <><H t="Certifications" />{s.certifications.map((e, i) => <Text key={i}>• {e}</Text>)}</>}
        {s.projects.length > 0 && <><H t="Projects" />{s.projects.map((e, i) => <Text key={i}>• {e}</Text>)}</>}
      </Page>
    </Document>
  );
  save(await pdf(doc).toBlob(), `${fileBase(r)}.pdf`);
}

export async function downloadDocx(r: Resume) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx");
  const s = sections(r);
  const h = (t: string) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 80 } });
  const p = (t: string, bold = false) => new Paragraph({ children: [new TextRun({ text: t, bold })] });
  const b = (t: string) => new Paragraph({ text: t, bullet: { level: 0 } });
  const kids: InstanceType<typeof Paragraph>[] = [
    new Paragraph({ children: [new TextRun({ text: s.name, bold: true, size: 36 })] }),
  ];
  if (s.contact) kids.push(p(s.contact));
  if (s.summary) kids.push(h("Professional Summary"), p(s.summary));
  if (s.skills) kids.push(h("Skills"), p(s.skills));
  if (s.experience.length) {
    kids.push(h("Professional Experience"));
    for (const x of s.experience) {
      kids.push(p(x.head, true));
      if (x.dates) kids.push(p(x.dates));
      x.bullets.forEach((t) => kids.push(b(t)));
    }
  }
  if (s.education.length) { kids.push(h("Education")); s.education.forEach((t) => kids.push(p(t))); }
  if (s.certifications.length) { kids.push(h("Certifications")); s.certifications.forEach((t) => kids.push(b(t))); }
  if (s.projects.length) { kids.push(h("Projects")); s.projects.forEach((t) => kids.push(b(t))); }
  const doc = new Document({ styles: { default: { document: { run: { font: "Calibri", size: 21 } } } }, sections: [{ children: kids }] });
  save(await Packer.toBlob(doc), `${fileBase(r)}.docx`);
}

export function downloadText(text: string, filename: string) {
  save(new Blob([text], { type: "text/plain" }), filename);
}

/** Plain-text rendering of the resume, used for share/copy/email/WhatsApp. */
export function resumeToText(r: Resume): string {
  const s = sections(r);
  const out: string[] = [s.name, s.contact, ""];
  if (s.summary) out.push("PROFESSIONAL SUMMARY", s.summary, "");
  if (s.skills) out.push("SKILLS", s.skills, "");
  if (s.experience.length) {
    out.push("PROFESSIONAL EXPERIENCE");
    for (const x of s.experience) out.push(x.head, x.dates, ...x.bullets.map((b) => `• ${b}`), "");
  }
  if (s.education.length) out.push("EDUCATION", ...s.education, "");
  if (s.certifications.length) out.push("CERTIFICATIONS", ...s.certifications.map((c) => `• ${c}`), "");
  if (s.projects.length) out.push("PROJECTS", ...s.projects.map((p) => `• ${p}`));
  return out.filter((l, i) => !(l === "" && out[i - 1] === "")).join("\n").trim();
}
