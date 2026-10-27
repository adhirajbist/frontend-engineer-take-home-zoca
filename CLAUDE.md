@AGENTS.md

# Lumen Campaign Builder

Take-home project. The assignment is in docs/brief.pdf. Read it for context, but do not build
anything from it unless I ask.

## Stack
Next.js (App Router), React, TypeScript (strict), Tailwind. Add other libraries only when I approve them.

## How we work
- I tell you what to build next, one small step at a time. Build only that step.
- Do not add features, screens or abstractions I did not ask for.
- Before coding, give me a 2 to 4 line plan. If there are real choices, list them briefly and wait for my pick.
- After coding, run build and lint, then summarize: what changed, which files, how to check it.
- Wait for my review before anything else. Do not move to a next step on your own.
- Commit only when I say so.
- Keep code simple and readable. No `any`. Small components. Plain-language UI copy for salon owners (never "segment" or "open rate").
- Everything must work on a phone first, then desktop. Keyboard accessible, visible focus.
- Never commit API keys.

## Brand
Use Zoca's palette (tokens in the Tailwind theme): aubergine, burgundy, plum, pink,
yellow, cream, ink, purple. Cream page background, ink text, yellow primary buttons.
Never hardcode hex values in components. Use the tokens.