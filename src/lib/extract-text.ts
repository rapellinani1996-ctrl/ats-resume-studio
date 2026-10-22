// Browser-only text extraction. Libraries are loaded on demand.
export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt")) return file.text();
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return value;
  }
  if (name.endsWith(".pdf")) {
    const pdfjs = await import("pdfjs-dist");
    const worker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    pdfjs.GlobalWorkerOptions.workerSrc = worker;
    const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      let line = "", out = "";
      for (const it of content.items as Array<{ str?: string; hasEOL?: boolean }>) {
        line += it.str ?? "";
        if (it.hasEOL) { out += line + "\n"; line = ""; } else line += "";
      }
      pages.push(out + line);
    }
    return pages.join("\n");
  }
  throw new Error("Unsupported file type");
}
