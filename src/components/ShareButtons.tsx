import { useState } from "react";

/**
 * Web-based share row for a block of text (resume or cover letter).
 * Email opens Gmail compose in a browser tab (never hijacks the desktop
 * Outlook app), WhatsApp opens WhatsApp Web in a browser tab. Long text is
 * copied to the clipboard first so nothing is lost to URL limits.
 */

// Gmail and WhatsApp URLs choke on very long bodies; keep the pre-filled
// text under this and rely on the clipboard for the rest.
const MAX_URL_TEXT = 1500;

function trimForUrl(text: string) {
  return text.length > MAX_URL_TEXT ? `${text.slice(0, MAX_URL_TEXT).trimEnd()}…` : text;
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ShareButtons({ text, title, onPrint }: { text: string; title: string; onPrint?: () => void }) {
  const [hint, setHint] = useState("");
  const flash = (msg: string) => {
    setHint(msg);
    setTimeout(() => setHint((h) => (h === msg ? "" : h)), 2500);
  };

  const open = (url: string) => {
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win) flash("Pop-up blocked — allow pop-ups for this site.");
  };

  const copy = async () => {
    if (await copyText(text)) flash("Copied to clipboard.");
  };

  // Gmail compose in the browser — the desktop mail app never takes over.
  const email = () => {
    const long = text.length > MAX_URL_TEXT;
    const body = trimForUrl(text);
    void copyText(long ? text : `${title}\n\n${body}`);
    open(
      `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`,
    );
    if (long) flash("Full text copied — paste it into the email.");
  };

  // WhatsApp Web in a browser tab; full text stays on the clipboard as a backup.
  const whatsapp = () => {
    const full = `${title}\n\n${text}`;
    const long = full.length > MAX_URL_TEXT;
    void copyText(full);
    open(`https://api.whatsapp.com/send?text=${encodeURIComponent(trimForUrl(full))}`);
    if (long) flash("Full text copied — paste it into WhatsApp.");
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-ghost" onClick={email}>Email</button>
        <button className="btn btn-ghost" onClick={whatsapp}>WhatsApp</button>
        <button className="btn btn-ghost" onClick={copy}>Copy</button>
        {onPrint && <button className="btn btn-ghost" onClick={onPrint}>Print</button>}
      </div>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
