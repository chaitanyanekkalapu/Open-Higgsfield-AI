---
name: sales-page-builder
description: Build a high-converting, mobile-first, single-file HTML sales page (dark hero, bold headline with highlighted word, product mockup, lime CTA, proof wall, price stack, guarantee, FAQ) from a short offer description. Use when the user asks for a sales page, landing page, funnel page, offer page, or "a page like VibeFunnels".
---

# Sales Page Builder

Turns "Build me a sales page for my <offer>" into a finished, deployable
`index.html` (plus an `assets/` folder) in one pass.

The style reference is a dark, mobile-first "tripwire" page: one cheap offer,
one action, heavy proof. Read the reference files before writing anything:

| File | What it gives you |
|---|---|
| `references/page-anatomy.md` | Every section, in order, with its job and rules |
| `references/copy-formulas.md` | Headline, subhead, CTA, FAQ and proof formulas |
| `references/design-system.md` | Colours, fonts, spacing, components, motion |
| `references/compliance.md` | What you must never invent; required disclaimers |
| `templates/brief.md` | The intake questions (the "offer brief") |
| `templates/sales-page.html` | Working template to copy and fill |
| `scripts/screenshot.mjs` | Mobile + desktop screenshots for QA |

## Workflow (do every step, in order)

### 1. Intake — fill the offer brief
Copy `templates/brief.md` into the output folder as `brief.md` and fill it
from what the user said. If any **required** field is missing, ask for all
missing ones in ONE message. Never guess these:
- price and currency, what the buyer actually gets, the guarantee terms
- every number used as proof (sales, ratings, member counts, revenue)
- testimonials / screenshots (must be real, from the user)

Optional fields (audience, tone, brand colours) can be inferred; say so.

### 2. Positioning — one sentence before any copy
Write: `<Product> helps <who> get <result> in <time> without <pain>.`
Pick the ONE result the headline sells. If you can't write this sentence,
the offer is unclear — stop and ask.

### 3. Copy — section by section
Follow `references/page-anatomy.md` order. Use `references/copy-formulas.md`.
Rules:
- One offer, one CTA label, repeated (hero, mid-page, price block, sticky bar).
- Short lines. Grade 6–8 reading level. No jargon.
- Every claim is either provable from the brief or removed.
- Put the result disclaimer next to every result claim (see compliance).

### 4. Visual assets
Needed: hero mockup image (the "result" the product makes), founder avatar,
proof screenshots, optional mascot/character cut-out (transparent PNG).
Sources, in priority order:
1. Real files the user gives you → copy into `assets/`.
2. Generate with this repo's studio (MATAI Image tab: text-to-image, then
   background removal for the character). Save into `assets/`.
3. Leave the template's built-in CSS placeholders and list what's missing.
Never generate fake "proof" screenshots (Stripe dashboards, chats, reviews).

### 5. Build
- Copy `templates/sales-page.html` to `<out>/index.html`.
- Every element with a `data-demo` attribute holds sample content. Replace it
  with real content (or delete it), then remove the `data-demo` attribute.
  `<!-- SLOT: ... -->` comments explain each slot.
- Delete any section you have no real content for (e.g. no testimonials →
  delete the proof wall, do not fake it). Keep the order of the rest.
- Keep it one file: inline CSS/JS, Google Fonts only, images in `assets/`.
- Set real `<title>`, meta description, and Open Graph tags.
- Wire every CTA `href` to the checkout URL from the brief.

### 6. QA (do not skip)
Run from the repo root:
```bash
node .claude/skills/sales-page-builder/scripts/screenshot.mjs <out>/index.html
```
Open the two PNGs and check:
- [ ] No horizontal scroll at 390px. Headline fits, highlight word not broken.
- [ ] CTA visible in the first screen on mobile.
- [ ] Script reports 0 leftover `data-demo` slots and 0 CTAs without a checkout link.
- [ ] Every number traces back to `brief.md`.
- [ ] Disclaimers present next to result claims and in the footer.
- [ ] Contrast: body text on dark background is readable.
Fix and re-run until all pass.

### 7. Deliver
Report: output path, screenshots, list of claims used (with source), list of
missing assets/placeholders, and the top 3 things that would most raise
conversion (usually: real proof, a sharper headline result, traffic source
match). Be direct about weak spots in the offer.

## Hard rules
- Do not copy another brand's name, logo, characters, or text word-for-word.
  Copy the *structure and techniques*, never the identity.
- Do not invent social proof, ratings, member counts, revenue, scarcity
  timers, or "only 3 left" stock. Fake urgency is out.
- Price, guarantee and refund wording must match the brief exactly.
