import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { AiError, runJson, runText } from "./ai-gateway";
import { builtResumeSchema, jdSchema, parsedResumeSchema, polishSchema, scoreSchema, tailorSchema } from "./ai-schemas";
import {
  promptAtsScorer, promptCoverLetter, promptFormBuilder, promptJdAnalyzer, promptNotePolisher, promptResumeParser, promptTailor,
} from "./prompts";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function wrap<T>(fn: (key: string) => Promise<T>): Promise<Result<T>> {
  const key = process.env['LOVABLE_API_KEY'];
  if (!key) return { ok: false, error: "AI is not configured." };
  try { return { ok: true, data: await fn(key) }; }
  catch (e) {
    console.error(e);
    return { ok: false, error: e instanceof AiError ? e.message : "Something went wrong talking to the AI." };
  }
}

const str = (max: number) => z.string().max(max);

export const parseResume = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ text: str(60000).min(20) }).parse(d))
  .handler(({ data }) => wrap((k) => runJson(k, promptResumeParser(data.text), parsedResumeSchema)));

export const polishNotes = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ notes: str(10000).min(1) }).parse(d))
  .handler(({ data }) => wrap((k) => runJson(k, promptNotePolisher(data.notes), polishSchema)));

export const buildResume = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ formJson: str(40000), target: str(200) }).parse(d))
  .handler(({ data }) => wrap((k) => runJson(k, promptFormBuilder(data.formJson, data.target), builtResumeSchema)));

export const analyzeJd = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ jd: str(30000).min(200) }).parse(d))
  .handler(({ data }) => wrap((k) => runJson(k, promptJdAnalyzer(data.jd), jdSchema)));

export const tailorResume = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ resumeJson: str(60000), jdJson: str(20000) }).parse(d))
  .handler(({ data }) => wrap((k) => runJson(k, promptTailor(data.resumeJson, data.jdJson), tailorSchema)));

export const scoreResume = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ resumeJson: str(60000), jdJson: str(20000) }).parse(d))
  .handler(({ data }) => wrap((k) => runJson(k, promptAtsScorer(data.resumeJson, data.jdJson), scoreSchema)));

export const coverLetter = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ resumeJson: str(60000), jdJson: str(20000) }).parse(d))
  .handler(({ data }) => wrap((k) => runText(k, promptCoverLetter(data.resumeJson, data.jdJson))));
