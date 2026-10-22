// Server-only helper: only call from inside a createServerFn handler.
import type { z } from "zod";
import type { PromptDef } from "./prompts";

export const AI_MODEL = "google/gemini-2.5-flash";
const URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export class AiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function callOnce(apiKey: string, p: PromptDef): Promise<string> {
  const res = await fetch(URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: AI_MODEL,
      temperature: p.temperature,
      stream: true,
      ...(p.json ? { response_format: { type: "json_object" } } : {}),
      messages: [{ role: "system", content: p.system }, { role: "user", content: p.user }],
    }),
  });
  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    let msg = "The AI service had a problem. Please try again in a moment.";
    try { msg = JSON.parse(body)?.error?.message || JSON.parse(body)?.message || msg; } catch { /* ignore */ }
    if (res.status === 429) msg = "The AI is busy right now. Please wait a minute and try again.";
    if (res.status === 402) msg = "AI credits have run out for this workspace. " + msg;
    throw new AiError(msg, res.status);
  }
  // Accumulate the SSE stream.
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") continue;
      try { out += JSON.parse(data)?.choices?.[0]?.delta?.content ?? ""; } catch { /* partial */ }
    }
  }
  return out.trim();
}

function extractJson(text: string): unknown {
  const t = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  try { return JSON.parse(t); } catch { /* fallthrough */ }
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a >= 0 && b > a) return JSON.parse(t.slice(a, b + 1));
  throw new Error("not json");
}

/** Run a JSON prompt; validate with schema; retry ONCE with the same prompt if invalid. */
export async function runJson<T extends z.ZodTypeAny>(apiKey: string, p: PromptDef, schema: T): Promise<z.infer<T>> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const text = await callOnce(apiKey, p);
    try {
      const parsed = schema.safeParse(extractJson(text));
      if (parsed.success) return parsed.data;
      console.warn("AI JSON failed schema", parsed.error.issues.slice(0, 3));
    } catch { console.warn("AI returned non-JSON"); }
  }
  throw new AiError("The AI returned an invalid answer twice. Please try again.", 502);
}

export async function runText(apiKey: string, p: PromptDef): Promise<string> {
  const t = await callOnce(apiKey, p);
  if (!t) throw new AiError("The AI returned an empty answer. Please try again.", 502);
  return t;
}
