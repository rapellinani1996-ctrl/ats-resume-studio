import { useState } from "react";

/** Copy / Email / WhatsApp / Print share row for a block of text (resume or cover letter). */
export function ShareButtons({ text, title, onPrint }: { text: string; title: string; onPrint?: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };
  const mail = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text)}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(`${title}\n\n${text}`)}`;
  return (
    <div className="flex flex-wrap gap-2">
      <button className="btn btn-ghost" onClick={copy}>{copied ? "Copied!" : "Copy"}</button>
      <a className="btn btn-ghost" href={mail}>Email</a>
      <a className="btn btn-ghost" href={wa} target="_blank" rel="noreferrer">WhatsApp</a>
      {onPrint && <button className="btn btn-ghost" onClick={onPrint}>Print</button>}
    </div>
  );
}
