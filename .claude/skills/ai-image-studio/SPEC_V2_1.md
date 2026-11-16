# AI IMAGE STUDIO — CLAUDE CODE MASTER SPECIFICATION V2.0
Date: 2026-11-16
Status: implementation instructions; no application has been built or deployed.

## 1. Non-negotiable product brief
Build a simple, responsive, personal, cloud-hosted web app for image editing. The ONLY primary workflow is **Upload photo → Select style → (optional) custom instruction → Generate → Compare → Download**. Hide implementation complexity. No manual sliders, layers, curves, masks, timelines, workflow builders, or payment pages in MVP. One private user account. Works on desktop and mobile. Monthly combined hosting + AI budget ceiling INR 2,000; aim below it, with safe hard stops. Cloud-managed infrastructure and multiple interchangeable AI providers. Persistent library AND temporary project storage modes. Development through Claude Code.

## 2. User experience
Home: brand title, large drag-and-drop/tap upload, grid of eight style tiles with sample preview and names, optional free-text instruction box, private-storage selector (Save to Library / Temporary), Generate button. Default facial protection ON for detected portraits. Show unobtrusive price estimate or 'may incur AI cost' before paid calls. Progress state with cancel if supported. Results: original/edited before-after slider, Regenerate, Change Style, Download PNG/JPEG/WebP, Save to Library (if temporary). History/library in small secondary navigation, not main editing screen. Accessible keyboard controls, touch support, responsive layout, loading/error/empty states. Avoid claims of exact facial preservation or genuine recovered detail from AI upscale.

Styles: cinematic; natural portrait cleanup; professional studio; natural enhancement; vintage film; black-and-white; background change; upscale. Background Change requires a short instruction (or selected background preset) before generating. Upscale can be classical upscaling when AI is unavailable; label it clearly.

## 3. Architecture
Recommended MVP: Next.js App Router + React + TypeScript + Tailwind; browser Canvas 2D for preview and simple deterministic transformations, Sharp/libvips on server only if necessary and within runtime limits; Supabase Auth (single allowlisted user), Postgres with row-level security, private Supabase Storage; Vercel for frontend and short-lived route handlers; AI gateway with provider adapters and a database-backed job lifecycle. Never hold long image inference requests open inside a Vercel request if time limits are exceeded: use provider async jobs + signed callbacks/webhooks where available or a managed on-demand worker/queue. Poll job status. If affordable queue execution is unavailable, ship synchronous short-running provider integration with explicit timeout and documented limitation. Avoid permanent GPU, VPS, Redis, Celery and dedicated FastAPI until required.

All paid provider keys server-side only. Provider adapters: capabilities(), estimateCost(), submitEdit(), getStatus(), cancelIfSupported(), normalizeResult(). Choose by capabilities, expected cost, image size, privacy and health; never silently fall back to a more expensive provider. Browser deterministic filters first where possible; AI for generative tasks only. Treat 'hybrid' as browser/CPU processing plus optional cloud AI; self-hosted GPU is not required.

## 4. Editing engine
Immutable originals; each output is a new version linked to original and source style, optional instruction, provider/model, settings and timestamp. Normalize EXIF orientation, respect ICC profiles, constrain oversized uploads, strip sensitive metadata on public downloads by default. Avoid automatically altering a face for cinematic or enhancement styles when non-generative colour correction suffices. For portrait styles, create face region protection masks where supported, limit face edits, compare original and output for unintended facial geometry changes and flag review. Similarity checks are not guarantees; no identity swapping. Reject unsupported instructions and explain alternatives. Explicit opt-in before transmitting an image to external AI provider, with provider/privacy notice.

## 5. API contracts (JSON unless multipart)
POST /api/assets/upload-init {filename,mime,size,storageMode} -> {assetId,signedUploadUrl,expiresAt}; client uploads directly to private storage; POST /api/assets/:id/complete -> {assetId,width,height,status}; server validates actual file bytes/type/dimensions and malware policy before marking usable.
GET /api/styles -> {styles:[{id,label,description,requiresInstruction,previewUrl,aiRequired}]}
POST /api/jobs {assetId,styleId,instructions?,storageMode,protectFace:true,idempotencyKey} -> {jobId,status:'queued',estimatedCostInr?,requiresConsent?,requiresApproval?}; never charge/dispatch until consent and budget approval completed. Prefer separate POST /api/jobs/:id/approve {consentToProvider:true,approveCost:true} -> {status}.
GET /api/jobs/:id -> {id,status:'queued'|'processing'|'succeeded'|'failed'|'cancelled',progress?,resultAssetId?,errorCode?,errorMessage?,costInr?}; POST /api/jobs/:id/cancel -> {status} (best effort; cancellation may not stop provider charges).
GET /api/projects -> {projects:[...]}; GET /api/projects/:id -> project with versions; POST /api/projects/:id/retain -> {storageMode:'persistent'}.
POST /api/exports {resultAssetId,format:'png'|'jpeg'|'webp',quality?} -> {downloadUrl,expiresAt}; download URL short-lived, access checked.
DELETE /api/projects/:id -> {deleted:true} with storage deletion scheduled and recorded.
All APIs require authenticated user, validate payloads with Zod, rate limit, return structured errors and never expose storage paths or provider secrets.

## 6. Database schema (initial)
profiles(id uuid PK references auth.users, email text unique, created_at timestamptz);
projects(id uuid PK, owner_id uuid FK, title text, storage_mode text check in ('temporary','persistent'), expires_at timestamptz nullable, created_at timestamptz, updated_at timestamptz);
assets(id uuid PK, project_id uuid FK, owner_id uuid FK, kind text check in ('original','result','preview','export'), storage_key text unique, mime text, byte_size bigint, width int, height int, sha256 text, created_at timestamptz);
versions(id uuid PK, project_id uuid FK, source_asset_id uuid FK, result_asset_id uuid FK nullable, style_id text, instructions text nullable, protect_face boolean, provider text nullable, model text nullable, created_at timestamptz);
jobs(id uuid PK, owner_id uuid FK, project_id uuid FK, version_id uuid FK, provider_job_id text nullable, status text, cost_estimate_inr numeric, actual_cost_inr numeric nullable, approved_at timestamptz nullable, consent_at timestamptz nullable, idempotency_key text, error_code text nullable, created_at timestamptz, updated_at timestamptz, unique(owner_id,idempotency_key));
usage_ledger(id uuid PK, owner_id uuid FK, job_id uuid FK nullable, amount_reserved_inr numeric, amount_actual_inr numeric nullable, currency text, recorded_at timestamptz);
RLS: every row owner-scoped; never allow client-side writes to ledger, jobs' billing fields, or provider status. Use service role only on trusted server. Private storage paths owner/project scoped, verified server-side. Include indexes on owner_id, project_id, status, expires_at and timestamps. Migration SQL and seed style metadata required.

## 7. Budget guardrails
Hard monthly combined target <= INR 2,000. Start allocation: INR 500 infrastructure, INR 1,200 AI, INR 300 reserve; targets only, NOT verified vendor prices. Allow configurable MAX_TOTAL_INR=2000, MAX_AI_INR=1200, MAX_JOB_INR and MAX_DAILY_INR. Track expected INR cost using provider quote/pricing config plus FX/tax margin. Atomic budget reservation before submission; reconcile on completion; avoid race conditions and duplicate billing with idempotency. Disable paid AI when reliable cost estimate is unavailable or insufficient budget; free local presets remain available. Show clear limit reached state. Vendor-side spending limits/alerts must also be configured; app-side counters alone cannot guarantee a true hard cap due to delayed billing, FX, taxes or provider-side charges. Never provision paid resources or subscribe to a paid tier without user approval.

## 8. Storage and privacy
Persistent library remains until user deletes. Temporary projects default 7-day retention (configurable); deletion cron removes DB rows and underlying files, including previews/exports, after expiry; retain audit metadata only as needed. Explicit consent for provider transmission. No training on personal photos unless user separately opts in (do not assume vendor policies). Signed URLs, encryption in transit and at rest, metadata stripping for exports, file validation, per-file max size initially 20 MB, per-image pixel limit configurable (e.g. 40 megapixels), total storage quotas. Confirm final limits after provider testing. Backups, restore tests and privacy policy for deployment.

## 9. Repository layout
ai-image-studio/
  app/(auth)/login/page.tsx
  app/(studio)/page.tsx
  app/(studio)/library/page.tsx
  app/api/assets/upload-init/route.ts
  app/api/assets/[id]/complete/route.ts
  app/api/styles/route.ts
  app/api/jobs/route.ts
  app/api/jobs/[id]/route.ts
  app/api/jobs/[id]/approve/route.ts
  app/api/jobs/[id]/cancel/route.ts
  app/api/projects/route.ts
  app/api/projects/[id]/route.ts
  app/api/projects/[id]/retain/route.ts
  app/api/exports/route.ts
  app/api/webhooks/[provider]/route.ts
  components/studio/{UploadZone,StyleGrid,Instructions,GenerateButton,Progress,BeforeAfter,ResultActions}.tsx
  lib/{auth,db,storage,validation,budget,images}/
  lib/ai/{gateway,types,providers}/
  supabase/migrations/
  tests/{unit,integration,e2e}/
  public/style-previews/
  docs/{architecture,api,privacy,deploy,runbook}.md
  .env.example
  README.md
Use actual valid Next.js route conventions; adapt the sketch as necessary.

## 10. Phased build
Phase 0: validate provider capabilities/prices, platform free-tier limitations, authentication, image format/size limits, privacy, deployment constraints. Produce risk register and cost assumptions. Ask user before any paid action.
Phase 1: single-user auth, upload, private storage, style grid, optional prompt, deterministic cinematic/black-and-white/enhance, compare/download, persistent/temporary storage, mobile responsive UI.
Phase 2: one genuine AI editing provider adapter, consent/approval, cost ledger and hard-stop logic, async status, failure/retry, portrait protection checks, studio/background change.
Phase 3: secondary provider, upscale, simple batch processing through repeated same style (backend capability, no complex UI), improved exports and quality checks.
Phase 4: production hardening, provider outage recovery, retention cleanup, audit logs, restore test, mobile/browser performance, security and accessibility.
Do not claim a feature is complete until its end-to-end test passes. If a provider capability is unavailable or over budget, show it as disabled with a clear explanation, never simulate a completed AI edit.

## 11. Test plan / acceptance criteria
Unit: style config, validation, EXIF, cost estimation, reservation/reconciliation, expiration and idempotency. Integration: upload-init/complete, RLS access isolation, AI adapter mock, provider callbacks signature validation, job state transitions, export signed URLs, cleanup and deletion. E2E Playwright: login; upload; choose style; optional instruction; generate; before/after; download; change style; regenerate; save persistent; temporary expiry; error/retry; mobile viewport; keyboard navigation. Test real provider separately with small controlled images and user-approved budget. Quality: source immutable, no unexpected facial modification for non-generative presets, no guarantee of perfect facial match for generative edits. Security: file spoofing, oversized/decompression bombs, malicious SVG disallowed, unauthorized asset reads, prompt injection in metadata/instructions, webhook spoofing, key leakage, duplicate requests. Budget: concurrent requests cannot overspend internal reservation limit; provider-side alerts still required.

## 12. Claude Code master instructions
You are the lead full-stack engineer. Implement this specification incrementally. Start by reading this file and producing: (1) proposed implementation steps, (2) assumptions/blockers, (3) infrastructure cost estimates requiring verification, and (4) precise permissions needed. Do not provision cloud services, install paid products, or send real photos to AI providers without approval. Favor readable maintainable code and minimal dependencies. Keep UI extremely simple: Upload → Style → Optional Instructions → Generate → Before/After → Download. Implement functional features, not mock screens; use mocks only in tests and label demos clearly. Commit after each phase, run lint/typecheck/tests, document setup commands and deployment steps. Use environment variables for secrets, provide .env.example without values. Ask for API credentials through secure environment configuration, never chat text or git. Maintain CHANGELOG and report completed vs pending capabilities accurately. Stop and ask for a decision when a blocker impacts privacy, billing, deployment, or user experience.

## 13. Remaining blockers for implementation
1. Cloud accounts/region and eligibility for free tiers (Vercel, Supabase or alternatives).
2. AI provider accounts and image-editing/upscaling model availability, pricing and policies.
3. Consent to send uploaded portraits to third-party inference.
4. User login identity / allowlist configuration (do not place email in source).
5. Upload and export limits, accepted formats, expected monthly edit volume.
6. Retention period: provisional 7 days for temporary projects.
7. Domain choice: managed subdomain initially or custom domain (may cost extra).
8. Cloud access and permissions for Claude Code; explicit approval for any paid provisioning.
9. Define quality acceptance samples for portrait preservation and style fidelity.

## 14. Definition of done
A deployed HTTPS private web app that, on both phone and desktop, allows the authorized user to upload a photo, choose a visual style, optionally describe changes, generate a real result, inspect before/after, download it, retain or delete it, and never silently incur AI charges beyond approved budget rules. Clear disclosure of provider limits, face-preservation limitations and temporary retention.

## V2.1 ADDENDUM — OPTIONAL REFERENCE IMAGE (2026-11-16)
This addendum supersedes any earlier workflow that omitted a reference image.

### Updated minimal user flow
1. Upload one required main photo.
2. Optionally upload one reference image (JPG/PNG/WebP), with thumbnail, remove and replace controls.
3. When a reference is uploaded, choose one purpose: `style`, `pose`, `outfit`, `background`, or `same_person_face`. Default to `style`. Hide this control otherwise.
4. Choose one editing style; optionally enter custom instructions.
5. Click Generate. Show progress, before/after, regenerate, change style, and download.
No extra editing panels or manual masking UI are required for this feature.

### Semantics and priority
- Main image is always the source of the subject and original identity.
- Style reference: colour, lighting, contrast and overall mood; do not copy people or text.
- Pose reference: guide body positioning and framing where feasible; protect main subject identity.
- Outfit reference: guide clothing design, not face or identity.
- Background reference: guide environment and scenery.
- Same-person face reference: additional identity guidance only; never perform arbitrary face swap. The user must confirm they have rights/permission to use uploaded reference images.
- Custom instructions may refine the selected purpose but must not silently override face protection. If instructions conflict with protection, explain the conflict before generation.
- Never promise pixel-exact facial consistency from generative models. Prefer pixel-preserving face compositing or masked edits when technically feasible, and allow the user to compare against the original.

### Storage, schema, and lifecycle
- Extend assets with `role` enum (`main`, `reference`, `output`) and optional `reference_purpose` enum; or add a `project_references` table (`id`, `project_id`, `asset_id`, `purpose`, `created_at`). Use project ownership policies and private buckets.
- Keep the main image immutable. Reference image is an independent asset and may be removed without deleting the original.
- Temporary projects must delete both source and reference according to the same configured retention policy; persistent projects retain both until user deletion.
- Strip EXIF location data from generated exports by default. Validate file MIME/magic bytes, dimensions, upload size and decode safely.

### API changes
- `POST /api/assets/upload-url` accepts `role: main|reference` and returns signed upload URL plus asset identifier; validate authorization and quota.
- `POST /api/projects/{id}/reference` JSON: `{ "assetId": "uuid", "purpose": "style|pose|outfit|background|same_person_face" }`; one active reference per project for MVP; replacement is atomic.
- `DELETE /api/projects/{id}/reference` detaches the active reference and schedules cleanup according to retention policy.
- `POST /api/jobs/generate` accepts `{ "projectId": "uuid", "mainAssetId": "uuid", "referenceAssetId": "uuid|null", "referencePurpose": "style|pose|outfit|background|same_person_face|null", "styleId": "string", "instructions": "string", "preserveFace": true }`. Backend resolves authorized storage objects; never trust client paths.
- Job records persist the reference asset ID and purpose, model/provider, status, estimated and actual cost, output asset and errors. Idempotency key required to prevent accidental duplicate paid jobs.

### AI gateway behavior
- Cap reference upload size and dimensions, produce privacy-safe resized inference copies, and select only providers/models that actually support the needed image inputs and editing mode.
- For unsupported reference purposes, return a clear unsupported-mode response before any paid request; do not silently ignore the reference.
- Enforce the existing INR 2,000/month budget with per-job cost estimate/reservation, daily caps and a hard stop on new paid jobs.
- Delete provider-side temporary artifacts where the provider permits; disclose external processing in the UI.

### Acceptance tests
- Generation works with no reference.
- Uploading a reference reveals purpose selection; changing or removing it updates the job payload.
- All five reference purposes produce correctly routed provider requests or an explicit unsupported-mode response.
- Unauthorized asset IDs are rejected; expired signed URLs fail; invalid files are rejected.
- The main image remains unchanged; original and reference are deletable under policy; temp retention cleans both.
- Duplicate Generate clicks cannot incur duplicate charges; budget cap blocks paid processing.
- Mobile and desktop support reference thumbnails and accessible controls.
- Same-person face reference does not trigger a face swap and outputs can be compared with the main image.

### Claude Code execution instructions
Implement this addendum as a small extension of the V2 UI and data/API layer, without adding a new dashboard. First inspect the existing repository, migrate schema safely, update types/validation, implement upload and reference selection, add provider capability checks, write integration tests, and only then enable paid AI generation after explicit approval.
