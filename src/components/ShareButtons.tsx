import { useState } from "react";
import { Button } from "@/components/ui/button";

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

  // Open in a new browser tab via a temporary anchor — user-gesture pop-ups
  // from <a target="_blank"> aren't subject to window.open restrictions.
  const open = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const copy = async () => {
    flash(await copyText(text) ? "Copied to clipboard." : "Copy was blocked by your browser. Select and copy the preview text instead.");
  };

  // Gmail compose in the browser — the desktop mail app never takes over.
  const email = () => {
    const long = text.length > MAX_URL_TEXT;
    const body = trimForUrl(text);
    void copyText(long ? text : `${title}\n\n${body}`).then((copied) => {
      if (long) flash(copied ? "Full text copied — paste it into the email." : "Select and copy the preview text to include the full resume in your email.");
    });
    open(
      `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`,
    );
  };

  // WhatsApp Web in a browser tab; full text stays on the clipboard as a backup.
  const whatsapp = () => {
    const full = `${title}\n\n${text}`;
    const long = full.length > MAX_URL_TEXT;
    void copyText(full).then((copied) => {
      if (long) flash(copied ? "Full text copied — paste it into WhatsApp." : "Select and copy the preview text to send the full resume in WhatsApp.");
    });
    open(`https://api.whatsapp.com/send?text=${encodeURIComponent(trimForUrl(full))}`);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={email}>Email</Button>
        <Button variant="outline" onClick={whatsapp}>WhatsApp</Button>
        <Button variant="outline" onClick={copy}>Copy</Button>
        {onPrint && <Button variant="outline" onClick={onPrint}>Print</Button>}
      </div>
      {hint && <p role="status" className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
