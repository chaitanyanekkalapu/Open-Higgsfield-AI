---
name: ai-image-studio
description: Master spec (V2.1) for the private AI Image Studio web app — upload photo, pick style, optional reference image and instructions, generate, compare before/after, download. Use when planning, building, reviewing or testing any part of the image-editing studio, its AI provider gateway, budget guardrails (INR 2,000/month), consent flow, storage/retention, reference-image feature, or its API/database schema.
---

# AI Image Studio — build skill

The full, authoritative specification is in [SPEC_V2_1.md](SPEC_V2_1.md) in this folder. Read it before doing any work on this feature. The V2.1 addendum at the end supersedes earlier sections where they conflict.

## How to use this skill

1. Read `SPEC_V2_1.md` in full.
2. Inspect the current repository before proposing changes. This repo is an existing JavaScript Next.js + Vite + Electron app (Open Higgsfield / MATAI) with a server-side backend bridge. The spec assumes a fresh TypeScript + Supabase project. Do not silently pick one — reconcile the two and ask the user when the choice affects stack, hosting, billing or privacy.
3. On first use, produce exactly the four outputs required by spec section 12:
   - proposed implementation steps (mapped to phases 0–4),
   - assumptions and blockers (start from section 13),
   - infrastructure cost estimates, marked as unverified,
   - precise permissions/credentials needed.
4. Then build phase by phase. Commit after each phase. Run lint, typecheck and tests before claiming a phase is done.

## Hard rules (summary — the spec is the source of truth)

- **No paid actions without explicit user approval:** no cloud provisioning, paid tiers, or sending real photos to AI providers.
- **Secrets:** server-side env vars only; `.env.example` with no values; never ask for keys in chat or commit them.
- **Budget:** atomic reservation before any paid call, reconcile after, idempotency key on every job, daily/per-job/monthly caps, hard stop when estimate is unknown or budget is short. App-side caps are not a true hard cap — vendor-side limits are still required.
- **Consent:** explicit opt-in before an image leaves to a third-party provider, with a provider/privacy notice.
- **Faces:** never promise exact facial preservation; no face swap, including for the `same_person_face` reference purpose. Prefer non-generative colour work when it is enough.
- **Honesty:** never fake an AI result. Unsupported or over-budget features show as disabled with a reason. A feature is not "done" until its end-to-end test passes.
- **UI stays minimal:** Upload → (optional reference + purpose) → Style → optional instructions → Generate → Before/After → Download. No sliders, layers, masks or dashboards.
- **Storage:** immutable originals; temporary projects expire (default 7 days) and cleanup removes source, reference, results and exports; strip EXIF location on exports.
- **Stop and ask** whenever a decision affects privacy, billing, deployment or user experience.
