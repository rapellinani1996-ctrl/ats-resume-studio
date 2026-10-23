<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Resume session state lives in a React context persisted to sessionStorage (src/lib/resume-store.tsx); nothing is stored permanently by design.
- AI prompts in src/lib/prompts.ts are copied verbatim from the user's product spec — never edit their wording; only the {PLACEHOLDER} slots may be filled.
- The daily limit (3/day, src/lib/rate-limit.ts, per-browser localStorage) counts tailoring runs only; cover letter generation is free by user's choice.
