import { z } from "zod";

const s = z.string().nullable().optional().transform((v) => v ?? "");
const arr = z.array(z.string()).nullable().optional().transform((v) => v ?? []);
const skills = z
  .object({ technical: arr, tools: arr, soft: arr })
  .nullable()
  .optional()
  .transform((v) => v ?? { technical: [], tools: [], soft: [] });

// Items may come back as strings or objects; accept both and stringify loosely.
const looseItem = z.union([z.string(), z.record(z.any())]);
const looseArr = z.array(looseItem).nullable().optional().transform((v) => v ?? []);

export const parsedResumeSchema = z.object({
  name: s, email: s, phone: s, location: s, linkedin: s, summary: s,
  skills,
  experience: z
    .array(z.object({ job_title: s, company: s, location: s, start_date: s, end_date: s, dates: s, bullets: arr }))
    .nullable().optional().transform((v) => v ?? []),
  education: z
    .array(z.union([z.string(), z.object({ degree: s, institution: s, year: s })]))
    .nullable().optional().transform((v) => v ?? []),
  certifications: looseArr,
  projects: looseArr,
});
export type ParsedResume = z.infer<typeof parsedResumeSchema>;

export const polishSchema = z.object({ polished_bullets: z.array(z.string()), needs_more_info: arr });

export const builtResumeSchema = parsedResumeSchema.extend({ missing_sections: arr, suggestions: arr });

export const jdSchema = z.object({
  job_title: s, company_name: s, seniority_level: s,
  required_skills: arr, preferred_skills: arr, ats_keywords: arr,
  industry: s, soft_skills: arr, red_flags: arr,
});
export type JdAnalysis = z.infer<typeof jdSchema>;

export const tailorSchema = parsedResumeSchema
  .omit({ name: true, email: true, phone: true, location: true, linkedin: true })
  .extend({ summary: z.string(), changes_made: arr, genuinely_missing_keywords: arr, suggestions_to_close_gaps: arr });

const score = z.coerce.number().min(0).max(100);
export const scoreSchema = z.object({
  scores: z.object({
    keyword_match: score, format_parsability: score, quantified_achievements: score, action_verbs: score, relevance: score,
  }),
  total_score: score,
  matched_keywords: arr,
  missing_keywords: arr,
  top_3_fixes: arr,
});
export type ScoreReport = z.infer<typeof scoreSchema>;
