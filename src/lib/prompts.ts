// AI prompts — copied word for word from the product spec. Do not edit wording.
// Only the {PLACEHOLDER} slots are filled in.

export type PromptDef = { system: string; user: string; temperature: number; json: boolean };

export const promptResumeParser = (EXTRACTED_TEXT: string): PromptDef => ({
  temperature: 0.3,
  json: true,
  system: `You are an expert resume parser. You extract data with 100% accuracy and NEVER invent information.`,
  user: `Extract all information from the resume text below. Return STRICTLY valid JSON matching this schema exactly — no explanations, no markdown:

{
  "name": string or null,
  "email": string or null,
  "phone": string or null,
  "location": string or null,
  "linkedin": string or null,
  "summary": string or null,
  "skills": { "technical": [], "tools": [], "soft": [] },
  "experience": [
    {
      "job_title": "",
      "company": "",
      "location": "",
      "start_date": "",
      "end_date": "" or "Present",
      "bullets": []
    }
  ],
  "education": [ { "degree": "", "institution": "", "year": "" } ],
  "certifications": [],
  "projects": [ { "name": "", "description": "", "technologies": [] } ]
}

RULES:
1. If a field is not found in the text, set it to null. Do NOT guess or fabricate.
2. Convert dense paragraph job descriptions into individual bullet points (split on sentence boundaries or semicolons).
3. Preserve ALL numbers and percentages exactly.
4. Preserve original dates exactly.

RESUME TEXT:
"""${EXTRACTED_TEXT}"""`,
});

export const promptNotePolisher = (USER_FORM_NOTES: string): PromptDef => ({
  temperature: 0.7,
  json: true,
  system: `You are a professional resume writer. You improve wording but NEVER add facts the user didn't provide.`,
  user: `Below are raw, unpolished notes from a job seeker about their work experience. Rewrite each item as a clean, professional resume bullet point.

STRICT RULES:
1. Use ONLY facts present in the notes. Do NOT add skills, tools, metrics, or achievements the user did not mention.
2. Format: "Strong action verb + what they did + result/context if provided"
3. Start every bullet with a different action verb.
4. If a note is too vague to be a good bullet, still polish it as best you can, and add it to "needs_more_info" so the user can be asked for details.

Return JSON:
{ "polished_bullets": [], "needs_more_info": [] }

RAW NOTES:
"""${USER_FORM_NOTES}"""`,
});

export const promptFormBuilder = (FORM_JSON: string, TARGET_JOB_TITLE: string): PromptDef => ({
  temperature: 0.7,
  json: true,
  system: `You are an ATS resume expert. Build resumes using ONLY provided data.`,
  user: `Build a structured resume from the user data below. Return STRICT JSON with this schema:
{
  "name": "", "email": "", "phone": "", "location": "", "linkedin": "",
  "summary": "",
  "skills": { "technical": [], "tools": [], "soft": [] },
  "experience": [...], "education": [...], "certifications": [], "projects": []
}

RULES:
1. Summary: 2-3 lines, mention their target role. Use only real skills/experience provided.
2. Order skills with the most relevant to the target role first.
3. Do NOT invent anything not present in the user data.
4. If key info is missing (e.g., no experience), set it to an empty array and add a note in "missing_sections" advising the user.

Also return: { "missing_sections": [], "suggestions": ["e.g., Add metrics to your achievements"] }

USER DATA: ${FORM_JSON}
TARGET ROLE: ${TARGET_JOB_TITLE}`,
});

export const promptJdAnalyzer = (JD_TEXT: string): PromptDef => ({
  temperature: 0.3,
  json: true,
  system: `You are an ATS (Applicant Tracking System) and recruitment expert.`,
  user: `Analyze the job description below. Return STRICT JSON in this exact schema — no explanations, no markdown:

{
  "job_title": "",
  "company_name": "" or null,
  "seniority_level": "",
  "required_skills": [],
  "preferred_skills": [],
  "ats_keywords": [],
  "industry": "",
  "soft_skills": [],
  "red_flags": []
}

RULES:
1. Extract keywords in the EXACT phrasing used in the JD (ATS matches literal strings).
2. Separate must-have from nice-to-have based on words like "required", "must", "minimum" vs "preferred", "plus".
3. Limit each list to max 12 items, most important first.
4. "red_flags" includes things like "requires 10 yrs experience", "onsite only".

JOB DESCRIPTION:
"""${JD_TEXT}"""`,
});

export const promptTailor = (parsedResume_JSON: string, jdAnalysis_JSON: string): PromptDef => ({
  temperature: 0.7,
  json: true,
  system: `You are a senior ATS resume writing expert. You optimize resumes for ATS software and recruiters while keeping them 100% truthful.`,
  user: `Rewrite the resume below to maximize its ATS match score against the job description analysis.

═══════════ STRICT NON-NEGOTIABLE RULES ═══════════
1. TRUTH ONLY: Never invent, exaggerate, or add any experience, skill, employer, date, degree, or metric not present in the resume data.
2. KEYWORD ALIGNMENT: When a JD keyword genuinely matches something in the resume, rewrite the bullet to use the JD's EXACT phrasing (e.g., JD says "REST APIs", resume says "backend endpoints" → use "REST APIs").
3. ATS FORMAT: Use only standard headings: "Professional Summary", "Skills", "Professional Experience", "Education", "Certifications", "Projects".
4. BULLET FORMULA: "Action verb + task/tool + quantified result". Max 2 lines per bullet. 3-6 bullets per recent role, 2-3 for older roles.
5. Keep the candidate's original job titles EXACTLY as written (changing titles = falsification). You may add a parenthetical clarification only if truthful.
6. Reverse chronological order. Dates format: "Jan 2020 – Mar 2023". Normalize all experience entries into this exact schema.
7. Length: 1 page if <10 years experience; max 2 pages otherwise.
═══════════════════════════════════════════════════

Return STRICT JSON in this exact schema — no explanations, no markdown:
{
  "summary": "2-3 lines, top JD keywords woven in truthfully",
  "skills": { "technical": [], "tools": [], "soft": [] },
  "experience": [ { "job_title": "", "company": "", "location": "", "dates": "", "bullets": [] } ],
  "education": [],
  "certifications": [],
  "projects": [],
  "changes_made": [],
  "genuinely_missing_keywords": [],
  "suggestions_to_close_gaps": []
}

RULES for output fields:
- "skills": REORDERED — JD-matching skills first. Only include skills the candidate actually has.
- "changes_made": list what you changed, e.g., "Rewrote bullet 3 to use keyword 'CI/CD pipelines'".
- "genuinely_missing_keywords": JD keywords the candidate lacks — list honestly.
- "suggestions_to_close_gaps": honest, legal ways to gain these skills, e.g., free courses.

PARSED RESUME:
${parsedResume_JSON}

JD ANALYSIS:
${jdAnalysis_JSON}`,
});

export const promptAtsScorer = (tailoredResume_JSON: string, jdAnalysis_JSON: string): PromptDef => ({
  temperature: 0.3,
  json: true,
  system: `You are an ATS simulation engine (like Workday, Taleo, Greenhouse parsers).`,
  user: `Score this resume against the job description on a 0-100 scale.

Return STRICT JSON:
{
  "scores": {
    "keyword_match": 0-100,      // % of JD keywords present in resume
    "format_parsability": 0-100, // standard headings, clean structure
    "quantified_achievements": 0-100, // % of bullets with numbers/metrics
    "action_verbs": 0-100,
    "relevance": 0-100           // overall fit for the role
  },
  "total_score": 0-100,
  "matched_keywords": [],
  "missing_keywords": [],
  "top_3_fixes": ["Specific, actionable fixes to raise the score"]
}

RESUME: ${tailoredResume_JSON}
JD ANALYSIS: ${jdAnalysis_JSON}`,
});

export const promptCoverLetter = (tailoredResume_JSON: string, jdAnalysis_JSON: string): PromptDef => ({
  temperature: 0.7,
  json: false,
  system: `You are a highly professional and persuasive career copywriter specializing in job application documents.`,
  user: `Generate a 3-4 paragraph cover letter tailored for the specific job description and candidate background provided below. The tone must be confident, professional, and specific to the role.

STRUCTURE:
1. Paragraph 1: State the role and express enthusiastic interest, referencing 1-2 key JD requirements immediately.
2. Paragraph 2: Highlight 2-3 specific, quantified achievements from the candidate's experience that directly solve the problems mentioned in the JD.
3. Paragraph 3: Address a "soft skill" or cultural fit (e.g., adaptability, teamwork) mentioned in the JD.
4. Conclusion: Call to action (requesting an interview) and thank the recipient.
5. The language must directly use the core keywords from the JD analysis.

CANDIDATE RESUME DATA:
${tailoredResume_JSON}

JOB DESCRIPTION ANALYSIS:
${jdAnalysis_JSON}

RETURN ONLY THE PLAIN TEXT OF THE LETTER. No markdown, no headings, no introductions or explanations.`,
});
