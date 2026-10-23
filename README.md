# ATS Resume Studio

Build a full-stack web application called "ATS Resume Builder" using:

- React + Tailwind CSS + TypeScript

- Google Gemini API (model: gemini-1.5-flash) for all AI features

- react-pdf or similar for PDF generation, docx library for Word download

PAGES NEEDED:

1. Landing Page: Hero section + two buttons: "Upload Resume" and "Start From Scratch"

2. Upload Page: Drag-and-drop zone for PDF/DOCX/TXT files

3. Guided Form Page: Multi-step form (personal info, experience with raw notes, skills, education, target job title)

4. JD Input Page: Large textarea to paste a job description + "Analyze" button

5. Review/Edit Page: Left side = editable resume fields; Right side = ATS score card (score before/after, matched keywords, missing keywords, top 3 fixes)

6. Download Page: Preview + "Download PDF" + "Download DOCX" + "Generate Cover Letter" buttons

BACKEND/AI LOGIC:

- Use Gemini API calls for: parsing resume text into JSON, analyzing job descriptions, tailoring the resume to the JD, scoring ATS match, and generating cover letters.

- All AI prompts will be provided — implement them EXACTLY as written, including "TRUTH ONLY — never invent experience" constraints.

- AI must return strict JSON; validate it and retry once if invalid.

- Store nothing permanently — session-only data.

- Rate limit: 3 generations per user per day.

I will paste the exact AI prompts next. First, build the complete UI structure and page navigation with placeholder content.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/698d33ee-cbce-482a-8539-09b1cc07723b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
