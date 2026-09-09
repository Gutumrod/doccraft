# HANDOFF — DC01 Public Pilot Adversarial Security Round 1 — 2026-09-08

> **Product:** DocCraft (DC01)
> **Repository:** `D:\AI-Workspace\projects\saas-product-hub\products\DocCraft`
> **Branch:** `security/public-pilot-adversarial-2026-09-08`
> **Branch baseline / current committed HEAD:** `a52e5708449500305f15e91f107ba0882b17fa46`
> **Production:** `https://dc01.wstera.com`
> **Current production Worker version:** `722b573b-8dbb-4a50-b1ea-d880f6a03a5b`
> **Mode:** controlled defensive/adversarial validation of Owner-controlled DC01 only
> **Current decision:** `PILOT-001 HOLD`

## 1. Source of Truth for This Handoff

Read these files before doing anything:
- `docs/CURRENT_STATUS.md`
- `docs/PUBLIC_PILOT_SECURITY_READINESS_2026-09-08.md`
- `docs/ADVERSARIAL_SECURITY_ROUND1_2026-09-08.md`
- `docs/BRIEF-public-pilot-pv-gate-2026-09-08.md`
- `docs/RELEASE_AND_OPERATIONS_RUNBOOK.md`
- `docs/PRODUCT_VALIDATION_PLAN.md`

Do not infer state from chat summaries. Inspect repository, production, and the files above directly.
## 2. Durable Security Baseline Already Completed

Before Round 1, Public Pilot hardening was completed and pushed:
- implementation checkpoint `fb34f055180015124ac190c36f5728dd681d21f0`
- documentation checkpoint `a52e5708449500305f15e91f107ba0882b17fa46`
- Worker gateway forces HTTP → HTTPS with `308`
- application and static assets traverse the security gateway
- only GET/HEAD are accepted; other tested methods return `405`
- HSTS, CSP, anti-framing, noindex, nosniff, referrer and permissions headers are present
- application telemetry claim was corrected to distinguish DocCraft telemetry from provider operational logging
- oversized JSON/logo/item-image source guards were added
- Vitest upgraded to `3.2.6`; full dependency audit reported no known vulnerabilities

Fresh hardening verification before Round 1:
- lint PASS
- typecheck PASS
- build PASS
- unit **150/150 PASS**
- Chromium E2E **42/42 PASS**
- Microsoft Edge E2E **42/42 PASS**
- production smoke PASS in both browsers
- `git diff --check` PASS apart from line-ending warnings
## 3. Round 1 Test Artifacts Present on Branch

Current untracked Round 1 artifacts:
- `docs/ADVERSARIAL_SECURITY_ROUND1_2026-09-08.md`
- `scripts/security-adversarial-round1.mjs`
- `scripts/security-adversarial-browser-round1.mjs`
- `scripts/security-csp-residual-probe.mjs`

These are evidence/harness files from the controlled Round 1 validation. Review them before modification; do not silently discard or rewrite findings.

Round 1 covered bounded validation of:
- transport/redirect/header poisoning
- methods, traversal, sensitive-path exposure, CORS and framing
- reflected/stored XSS and CSP egress behavior
- malformed LocalStorage and prototype-pollution payloads
- source/deployment artifact and secret-pattern exposure
- upload/import resource-abuse guards
- bounded concurrent-request behavior
- TLS posture, deployment credential blast radius and Git source-control integrity

No volumetric quota exhaustion was performed and no Phase 7/Auth/Supabase/Billing work was opened.
## 4. Round 1 Findings That Must Drive Next Work

### F-01 — HIGH — Worker quota / availability boundary
`assets.run_worker_first: true` makes every matching request, including static assets, invoke Worker code. This creates a free-tier request-budget exposure for a zero-fixed-cost Public Pilot.

**Status:** blocking `PILOT-001`.

**Next work:** find and prove a bounded architecture/configuration that preserves the security boundary without unconditional Worker invocation on all static traffic, or establish another zero-fixed-cost availability control. Do not perform a quota-exhaustion attack merely to prove the issue.

### F-02 — MEDIUM — TLS 1.0/1.1 accepted
Round 1 observed successful legacy TLS negotiation.

**Next work:** assess the blast radius of a zone-wide minimum TLS 1.2 change before touching Cloudflare because other `wstera.com` services may share the zone. No zone-wide setting change without House impact review.

### F-03 — MEDIUM — compressed-image decode resource abuse
A highly compressed large-dimension PNG bypassed source-byte limits and consumed significant browser decode/canvas time.

**Next work:** implement pre-decode supported-image header parsing and reject unreasonable source dimensions/pixel count before `createImageBitmap()` / `Image` decode. Add deterministic tests.
### F-04 — LOW/MEDIUM — CSP inline-script residual
Current Next static bootstrap still requires `script-src 'unsafe-inline'`; a direct inline-script probe executed. No user-controlled HTML/XSS sink was found, and `script-src-attr 'none'` plus egress restrictions worked.

**Next work:** keep as defense-in-depth residual unless a safe hash/nonce/static-bootstrap path can be proven without breaking V1. Do not destabilize Pilot just to remove this residual.

### F-05 — MEDIUM — broad local Cloudflare OAuth credential
The current workstation Wrangler OAuth token has broad account scopes far beyond DC01.

**Next work:** design a least-privilege DC01 deployment credential/profile and migration procedure. Do not overwrite/remove the current working credential until the replacement is tested and rollback is available.

### F-06 — MEDIUM — no GitHub branch/ruleset protection
`master` is currently unprotected and there is no CI/status gate.

**Next work:** add minimum source-integrity controls appropriate to the current Owner workflow, preferably preventing force-push/deletion and adding CI once a reliable workflow exists. Avoid locking the Owner out of the repository.

## 5. Controls Round 1 Already Demonstrated as Effective

- no tested reflected/stored XSS execution
- no prototype pollution observed
- no permissive CORS
- no clickjacking frame load
- no open redirect / response splitting in tested inputs
- no sensitive source/config exposure on tested paths
- no tested high-risk secret pattern in current public history/bundle
- CSP blocked tested external resource/data egress
- bounded 50-request concurrency produced no 5xx
## 6. Required Execution Order for the Next Session

1. Re-read actual repo status, Round 1 report and harness files.
2. Preserve Round 1 evidence before editing production code/config.
3. Remediate **F-01 first** because it is the current Pilot blocker.
4. Remediate **F-03** before inviting arbitrary real users to upload images.
5. Assess F-02 at House/zone level before any TLS setting change.
6. Prepare bounded least-privilege remediation for F-05 and source-integrity remediation for F-06.
7. Rerun lint, typecheck, unit, build, Chrome E2E, Edge E2E, dependency audit, security gateway tests and production smoke after production changes.
8. Rerun only the controlled security probes needed to prove each remediation; no volumetric/destructive escalation.
9. Update `ADVERSARIAL_SECURITY_ROUND1_2026-09-08.md` or create a dated remediation/retest evidence file without falsifying the original findings.
10. Only after no blocking finding remains may the coordinator decide whether `PILOT-001` HOLD can be lifted.

## 7. Stop Boundaries

- Do not open Phase 7/Auth/Supabase/Cloud sync.
- Do not open billing/payment confirmation/Phase 8 or Phase 9.
- Do not use third-party systems as attack targets.
- Do not perform volumetric DDoS/quota-exhaustion tests.
- Do not rotate/delete shared Cloudflare credentials without a verified replacement and House impact review.
- Do not make zone-wide Cloudflare changes without checking other WSTERA services.
- Do not claim PV PASS; real-user evidence is still zero.
## 8. Handoff State

At handoff creation time:
- branch: `security/public-pilot-adversarial-2026-09-08`
- committed base: `a52e5708449500305f15e91f107ba0882b17fa46`
- production security Worker: `722b573b-8dbb-4a50-b1ea-d880f6a03a5b`
- `PILOT-001`: HOLD
- Phase 7: FROZEN

The Round 1 harness/report files and this handoff are intentionally not committed by this handoff step. The next operator must inspect the working tree first and preserve evidence before making further changes.
## 9. Important — Round 2 Work Appeared During Handoff Creation

While this handoff was being written, the working tree changed beyond the original four Round 1 artifacts. Treat this as **in-progress Round 2 remediation work** and do not reset/clean it.

New remediation brief detected:
- `docs/BRIEF-public-pilot-adversarial-remediation-round2-2026-09-08.md`

Current tracked changes now include:
- modified: `package.json`, `public/_headers`, `scripts/phase6-production-smoke.mjs`, `scripts/serve-static.mjs`, `src/image/business-logo.ts`, `src/image/item-image.ts`, related persistence/image tests, `wrangler.jsonc`
- deleted in working tree: `scripts/security-gateway-selftest.mjs`, `worker/security-gateway.mjs`

Additional untracked Round 2 files include:
- `scripts/finalize-security-headers.mjs`
- `scripts/security-boundary-selftest.mjs`
- `src/image/source-inspection.ts`
- `tests/persistence/image-source-inspection.test.ts`
- `worker/http-redirect.mjs`
- `wrangler.http-redirect.jsonc`

Therefore the next operator must first inspect this live Round 2 diff and identify ownership/completion state before making further edits. Do not assume the repository is still only at Round 1 evidence collection.
