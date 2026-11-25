# Design system

Matches the *feel* of the reference (dark, neon-lime, editorial accent) with
its own fonts and tokens. Brand colours from the brief override `--accent`.

## Tokens (already in the template `:root`)
| Token | Value | Use |
|---|---|---|
| `--bg` | `#07070f` | Page base |
| `--bg-glow-1` | `#2a1f7a` | Purple glow, top right of hero |
| `--bg-glow-2` | `#5a2a1a` | Warm glow, behind founder/proof |
| `--surface` | `#12121c` | Cards, pills |
| `--line` | `rgba(255,255,255,.10)` | Borders, dividers |
| `--text` | `#f4f1ea` | Headlines (warm off-white, not pure white) |
| `--muted` | `#a7a6b5` | Body and secondary text |
| `--accent` | `#d6ff3a` | CTA, highlight box, ticks, rings |
| `--accent-ink` | `#0b0b0b` | Text on accent |
| `--accent-shadow` | `#8fb300` | Offset shadow under CTA |

## Type
- Headline: **Bricolage Grotesque 800**, letter-spacing −0.04em, line-height 0.95, `clamp(2.6rem, 11vw, 5.5rem)`.
- Accent word: **Instrument Serif italic 400**, same size, slight extra size.
- Body/UI: **Inter 400/600/700**, 17–19px on mobile, line-height 1.5.
- Labels: Inter 700, uppercase, letter-spacing 0.12em, 13px.

## Components
- **Pill** — `border-radius: 999px`, 1px `--line` border, `--surface` bg.
- **Highlight box** — accent bg, accent-ink text, radius 10px, small padding, slight −2° rotate.
- **Squiggle underline** — inline SVG path under the serif word, accent stroke.
- **CTA** — accent bg, radius 18px, 20px padding, `box-shadow: 0 6px 0 var(--accent-shadow), 0 20px 60px rgba(214,255,58,.25)`; on press translateY(4px) and shrink the shadow.
- **Browser mockup** — dark frame, three dots, URL pill, rounded 18px, slight perspective tilt.
- **Status chip** — dark pill, accent check circle, white bold label; floats with a slow bob animation; staggered pop-in.
- **Prompt bar** — dark glass pill, sparkle icon, typing text with blinking caret.
- **Avatar** — 72px circle, 3px accent ring.
- **Proof card** — white or screenshot card, radius 14px, horizontal scroll-snap.

## Layout
- Mobile first. Max content width 640px for text, 1080px for proof/grids.
- 16–20px side gutter. Sections 72–96px vertical padding.
- No horizontal page scroll (proof strip scrolls inside its own container).

## Motion (respect `prefers-reduced-motion`)
- Chips: pop in at 0.6s / 1.4s, then bob.
- Prompt: types once, caret blinks.
- Sticky CTA bar slides up when hero CTA leaves the viewport.
