# MATAI Marketing Agent Team — Blueprint

**Goal:** turn a weekly plan into posted social content, using MATAI to make the images and videos. You approve every plan before any paid generation runs.

**Scope this is built for:** one person, under 20 posts a week, built with no-code tools (n8n).

---

## 1. Honest read before you build

- **You don't need a big "agent swarm".** At under 20 posts a week, 8–10 agents means more prompts to maintain, more things that break, and more cost, with no gain. This design uses **4 AI agents + 2 plain automation steps + 1 human checkpoint**.
- **Not every role needs AI.** Generating media and scheduling posts are fixed steps. Making them "agents" adds random behaviour where you want none.
- **Posting is the hardest part, not generating.** Instagram's API needs a Business account and a Meta app. TikTok's posting API only allows private posts until your app passes an audit. **Use a scheduler (Metricool or Buffer)** rather than posting to each platform directly.
- **Don't over-read your analytics.** At under 20 posts a week, one week's numbers are mostly noise. Review weekly, and only act on patterns that repeat over 3–4 weeks.
- **MATAI login is built for browsers, not bots.** The session cookie is tied to the browser's User-Agent and lasts 30 days. Five failed logins locks the account for 30 minutes. See section 6 for how to handle this.
- **My guess about your business:** your Airtable storage base is "Champion Auto Spa" and the app has a "Car Interior" preset. That suggests this is marketing for a car detailing business. The prompts below are written generally, but fill in the Brand Kit with your real business details. If this guess is wrong, tell me.

---

## 2. The team

| # | Role | Type | When it runs | Reads | Writes |
|---|------|------|-------------|-------|--------|
| 1 | **Strategist** | AI agent (Claude Sonnet) | Monday 8:00 | Brand Kit, last 4 weeks of results, Analyst report | 3–5 post **Ideas** |
| 2 | **Copywriter** | AI agent (Claude Sonnet) + MATAI prompt-builder | Every 15 min | Ideas you marked `Approved idea` | Caption, hashtags, generation prompt, model, cost estimate |
| — | **YOU: approval** | Human (Airtable or Telegram button) | When you get the alert | Full package + cost | `Approved` / `Rejected` + notes |
| 3 | **Producer** | Plain automation | Every 5 min | `Approved` rows | MATAI task ID → media URL |
| 4 | **QA Reviewer** | AI agent (Claude Sonnet, vision) | After Producer | Media + brief + Brand Kit | Pass/fail + reasons |
| 5 | **Publisher** | Plain automation | After QA pass | `QA passed` rows | Scheduled post in Metricool/Buffer |
| 6 | **Analyst** | AI agent (Claude Haiku) | Sunday 20:00 | Post metrics from scheduler | Weekly report for the Strategist |

**Why Ideas first, then full package:** you approve twice in a light way at the start (Monday ideas, takes 2 minutes) and once properly before money is spent. If you'd rather approve only once, skip the idea step and let the Copywriter work on every idea. It costs only a few cents of Claude usage.

---

## 3. Workflow and handoffs

```
Mon 08:00  Strategist ──► Content row [Idea]
                              │  you tick "Approved idea" (or delete)
                              ▼
           Copywriter ──► [Awaiting approval] ──► Telegram alert to you
                              │  Approve  /  Reject + note
                 ┌────────────┴─────────────┐
                 ▼                          ▼
           [Approved]                  [Rejected] → Copywriter rewrites once using your note
                 │
           Producer ──► MATAI /api/create ──► poll /api/status ──► [Generated]
                 │                                      └─ fails twice → [Needs human]
                 ▼
           QA Reviewer ──► pass ──► [QA passed]
                       └─► fail ──► [Rejected by QA] → Producer regenerates once
                                     (2nd fail → [Needs human], no 3rd paid try)
                 ▼
           Publisher ──► Metricool/Buffer ──► [Scheduled] ──► [Posted]
Sun 20:00  Analyst ──► Weekly Report row ──► read by next Monday's Strategist
```

### Communication rules

1. **Airtable is the only shared memory.** Agents never talk to each other directly. Each one picks up rows in one status and moves them to the next. This makes every step visible and lets you fix or re-run any row by hand.
2. **One status, one owner.** Only the agent that owns a status may change it. You can override any status.
3. **Structured output only.** Every AI agent returns JSON that matches the schema in `agent-prompts.md`. n8n checks it. Bad JSON gets one retry, then the row goes to `Needs human`.
4. **No spend without approval.** The Producer only reads `Approved` rows, and checks `Approved by` is filled in. This is the money gate. Don't let any other path call `/api/create`.
5. **Retry once, then stop.** Every failing step retries once. The second failure goes to `Needs human` and sends you a Telegram alert. Never loop on paid generation.

---

## 4. Tools

| Need | Pick | Why | Rough cost |
|------|------|-----|-----------|
| Workflow engine | **n8n** (n8n Cloud Starter, or self-hosted on a small VPS) | Visual, has Claude, Airtable, Telegram and HTTP nodes, plus an error workflow | ~€20/mo cloud or ~$5/mo VPS |
| AI agents | **Claude API** — `claude-sonnet-5-5` for writing and QA, `claude-haiku-5-5` for the Analyst | Strong writing, can look at images for QA | A few dollars/month at this volume |
| Media generation | **Your MATAI app** (`/api/prompt-builder`, `/api/create`, `/api/status`) | Already built, already saves to Airtable | Your Kie / fal credits (the biggest cost) |
| Shared state | **Airtable** (you already use it) | Easy to view and edit by hand | Free/your plan |
| Approval + alerts | **Telegram bot** | Free, has inline Approve/Reject buttons, works on your phone | Free |
| Posting + metrics | **Metricool** (or Buffer) | One API for IG/TikTok/FB/LinkedIn, gives back metrics | ~$20/mo |

**Check before you commit:** confirm your scheduler's plan includes **API access**. On several tools it's only in paid tiers. If it doesn't, the Publisher can post to a "Drafts" queue and you press publish by hand. At 20 posts a week, that's fine.

---

## 5. Airtable setup

Add these tables to the base you use for MATAI (or a new "Marketing" base).

### `Brand Kit` (one row — the Strategist, Copywriter and QA read this)
| Field | Type | Example |
|-------|------|---------|
| Business | Text | Champion Auto Spa — mobile car detailing |
| Audience | Long text | Car owners 25–55 in [city] who care how their car looks |
| Offer & facts | Long text | **Only** true, approved claims: services, prices, area, hours |
| Voice | Long text | Confident, short, no hype words, no emojis spam |
| Banned | Long text | Words/claims you never want ("guaranteed", competitor names) |
| Platforms | Multi-select | Instagram, TikTok, Facebook |
| Content pillars | Long text | Before/after, process, tips, offers, reviews |
| Visual rules | Long text | Logo bottom-right, clean backgrounds, real-looking cars |
| Weekly post target | Number | 5 |
| Weekly credit cap | Number | e.g. 200 |

### `Content` (one row per post — the "blackboard")
| Field | Type | Written by |
|-------|------|-----------|
| Title | Text | Strategist |
| Status | Single select: `Idea`, `Approved idea`, `Awaiting approval`, `Approved`, `Rejected`, `Generating`, `Generated`, `QA passed`, `Rejected by QA`, `Scheduled`, `Posted`, `Needs human` | each owner |
| Pillar, Platform, Format (`image`/`video`) | Select | Strategist |
| Angle / Why now | Long text | Strategist |
| Caption, Hashtags, Hook | Long text | Copywriter |
| Gen brief | Long text | Copywriter |
| Gen prompt | Long text | Copywriter (from MATAI prompt-builder) |
| Model ID, Aspect ratio | Text | Copywriter |
| Est. credits | Number | Copywriter |
| Reference image URLs | Long text | You (optional) |
| Approved by, Approval note | Text | You |
| Task ID, Media URL | Text / URL | Producer |
| Attempts | Number | Producer |
| QA result, QA notes | Select / Long text | QA |
| Scheduled for, Post URL | Date / URL | Publisher |
| Views, Likes, Saves, Comments, Shares | Number | Analyst |
| Error | Long text | any |

### `Weekly Reports`
Week, Summary, What worked, What to stop, Next week's suggestions (all written by the Analyst).

---

## 6. Connecting n8n to MATAI

Your endpoints (all under your Netlify site, e.g. `https://<your-site>/api/...`):

| Step | Call | Body / query | Returns |
|------|------|-------------|---------|
| Login | `POST /api/login` | `{"name":"<first name>","pin":"<pin>"}` | `Set-Cookie: matai_session=...` |
| Better prompt | `POST /api/prompt-builder` | `{"brief":"...","kind":"image"\|"video"}` | the final prompt |
| Generate | `POST /api/create` | `{"modelId":"...","prompt":"...","params":{"aspect_ratio":"9:16"},"images":[...],"brand":true}` | `{taskId, provider}` |
| Check | `GET /api/status?taskId=<id>` | — | `{state, urls}` (Kie) or fal result |

**Login rules you must follow** (from `netlify/functions/_auth.js`):
- **Always send the same `User-Agent` header** on every call (e.g. `MATAI-n8n/1.0`). The session only works with the User-Agent used at login.
- **Save the cookie and reuse it.** It lasts 30 days. Don't log in on every run. Five failed logins locks you out for 30 minutes.
- **Re-login only on `401 AUTH_REQUIRED`**, once. Then retry the call.
- Store the name and PIN in n8n **Credentials**, never in the workflow text.

**Recommended small code change (optional, later):** add a server-side automation key (e.g. an `x-automation-key` header checked in `requireAccount`). This would replace the cookie-and-User-Agent workaround. I haven't built it, because you asked for no-code. It's about 20 lines if you want it.

**Polling:** images: every 15 s, up to 5 min. Videos: every 30 s, up to 15 min. Both Kie and fal results come back as `state`: `waiting`, `processing`, `success` or `fail`. Done on `success` (take `urls[0]`). Stop on `fail` and save `error`. Use a Wait node in a loop, not one long-running request.

---

## 7. Reliability and cost guardrails

- **Money gate:** Producer only runs on `Approved` + non-empty `Approved by`. Before each `/api/create`, add up `Est. credits` for this week's `Generating`/`Generated`/`QA passed`/`Scheduled`/`Posted` rows. If it would go over `Weekly credit cap`, stop and alert you.
- **No double charges:** if `Task ID` is already filled, never call `/api/create` again. Poll the existing task instead. Set status to `Generating` *before* calling create, so a second run can't pick up the same row.
- **Max 2 paid attempts per post** (`Attempts` field). After that, `Needs human`.
- **One error workflow** in n8n: any failure writes `Error` on the row, sets `Needs human`, and sends a Telegram message with the row link.
- **QA must check facts, not just looks.** The biggest real risk is the caption promising a price or result you don't offer. QA compares the caption to `Offer & facts` and fails anything not listed there.
- **Weekly check (5 min):** look at the `Needs human` rows and the Analyst report. If the same QA failure repeats, fix the prompt. Don't just regenerate.

---

## 8. Setup, step by step

1. **Airtable** — create the 3 tables above. Fill in the Brand Kit honestly. `Offer & facts` and `Banned` matter most.
2. **Telegram** — talk to `@BotFather`, create a bot, save the token. Send it a message, then get your chat ID.
3. **Claude API key** — create one at console.anthropic.com. Set a monthly spend limit there.
4. **Scheduler** — sign up for Metricool or Buffer, connect your social accounts, check API access, and get the token.
5. **n8n** — create an account or self-host. Add credentials: Airtable, Anthropic, Telegram, MATAI (name + PIN as a "Generic" credential), scheduler.
6. **Build workflow `00 MATAI Session`** — login → store the cookie in n8n static data → other workflows call this as a sub-workflow to get a valid cookie.
7. **Build `01 Strategist`** (Schedule trigger Mon 08:00) → read Brand Kit + last 4 weeks of `Content` + latest `Weekly Report` → Anthropic node with the Strategist prompt → parse JSON → create `Idea` rows → Telegram: "5 ideas ready".
8. **Build `02 Copywriter`** (every 15 min) → find `Approved idea` and `Rejected` rows that have a note → Anthropic node (Copywriter prompt) → `POST /api/prompt-builder` with its `gen_brief` → write fields → status `Awaiting approval` → Telegram message with caption, prompt, model, credits, and **Approve / Reject** buttons.
9. **Build `03 Approval`** (Telegram trigger on button press) → Approve: status `Approved`, `Approved by` = you. Reject: ask for a one-line reason → save note → status `Rejected`.
10. **Build `04 Producer`** (every 5 min) → `Approved` rows → credit cap check → status `Generating`, Attempts+1 → `POST /api/create` → save Task ID → poll `/api/status` → save Media URL → status `Generated`.
11. **Build `05 QA`** (triggered by Producer) → send the image (or video thumbnail) + brief + caption + Brand Kit to the Anthropic node (QA prompt) → pass → `QA passed`. Fail → `Rejected by QA` with notes, and the Producer retries once if Attempts < 2.
12. **Build `06 Publisher`** → `QA passed` rows → scheduler API: create a post with the media URL, caption, and next free time slot → `Scheduled`.
13. **Build `07 Analyst`** (Sun 20:00) → pull last 7 days of metrics from the scheduler → update `Content` rows → Anthropic node (Analyst prompt) → `Weekly Reports` row → Telegram summary.
14. **Build `99 Error handler`** and set it as the error workflow on all the others.
15. **Dry run:** turn on the workflows one at a time with **Weekly credit cap = 10** and **one platform**. Run one post end to end. Check each Airtable status change.
16. **First 4 weeks:** have the Publisher send to the scheduler as **drafts** and publish by hand. Switch to auto-scheduling only once QA has caught every real problem you've seen.

---

## 9. What success looks like (check after 4 weeks)

- Your time spent: **under 15 minutes a week** (Monday ideas + approvals).
- `Needs human` rate: **under 10%** of posts.
- Wasted paid generations (QA rejected or you rejected after generating): **under 20%**. If it's higher, the problem is the Copywriter's prompts, not the model.
- If none of these improve, the system is costing you more than doing it by hand. Simplify or stop.

Agent prompts and output formats: see [`agent-prompts.md`](./agent-prompts.md).
