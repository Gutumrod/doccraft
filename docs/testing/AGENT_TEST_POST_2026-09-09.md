# DC01 — Agent Test POST — 2026-09-09

> Purpose: verify the current uncommitted Round 2 candidate after agent work, without claiming production deployment.
> Branch: `security/public-pilot-adversarial-2026-09-08`
> Committed base: `a52e5708449500305f15e91f107ba0882b17fa46`
> Candidate state: dirty working tree; Round 2 not committed and not deployed.

## Candidate Scope Observed

Round 2 currently changes the security boundary and image pipeline:
- separate HTTP-only redirect Worker configuration
- HTTPS static asset delivery no longer declares an all-path Worker entry point
- generated CSP hashes replace broad `script-src 'unsafe-inline'` in the built artifact
- pre-decode JPEG/PNG/WebP source header inspection
- source dimension limit: 4096px long edge / 16,777,216 total pixels
- updated security boundary, smoke and image tests

No Auth, Supabase, Billing or Phase 7 dependency was observed in this candidate.

## Fresh Candidate Results

| Check | Result |
|---|---|
| lint | PASS |
| typecheck | PASS |
| unit | PASS — 154/154, 13 files |
| build + CSP hash finalization | PASS — 3 HTML / 3 inline hashes |
| security boundary selftest | PASS |
| Chromium + Edge E2E | PASS — 84/84 |
| Wrangler HTTP redirect dry-run | PASS |
| Wrangler main static deploy dry-run | PASS — 31 assets |
| `git diff --check` | PASS; line-ending warnings only |
| clean candidate local `pageerror` | PASS — none |
| dynamic inline-script probe | PASS — blocked (`null`) |
| `pnpm audit --prod` | FAIL — 2 Critical + 1 High |
| full `pnpm audit` | FAIL — 2 Critical + 2 High + 2 Moderate |
| production smoke with Round 2 expectations | FAIL — production still serves old broad inline CSP |

## F-03 Real Compressed-Image Retest

A valid grayscale PNG fixture was generated with:
- dimensions: 6000 × 6000
- compressed file size: 35,069 bytes
- therefore far below the 12 MiB source-byte limit

Uploaded through the actual local candidate item-image input:
- rejected in 14 ms
- error: source exceeds 4096px / 16,777,216-pixel security boundary
- browser page errors: none

**F-03 candidate verdict: LOCALLY REMEDIATED / REAL FIXTURE PASS.**

## Round 2 Boundary Status
- F-01: architecture/config candidate is locally coherent and Wrangler dry-runs pass, but production proof is absent. **NOT CLOSED.**
- F-02: TLS 1.0/1.1 still accepted by current production. **OPEN / HOUSE IMPACT REQUIRED.**
- F-03: real compressed-image test passes before decode. **LOCALLY CLOSED; production unverified.**
- F-04: generated hash CSP works locally and blocks a dynamic inline script. **LOCALLY REMEDIATED; production unverified.**
- F-05: current shell `wrangler whoami` reports not authenticated; prior broad OAuth token was not reproduced. Dedicated least-privilege deploy identity is still not proven, and this shell cannot deploy production. **OPEN / CHANGED STATE.**
- F-06: GitHub now reports `master` protected, but required status checks are off and repository rulesets are empty. **PARTIALLY REMEDIATED.**

## POST Verdict

**FUNCTIONAL / LOCAL SECURITY REGRESSION: PASS.** Round 2 candidate has stronger local evidence than the baseline and does not regress the covered V1 flows.

**PILOT / PRODUCTION SECURITY VERDICT: HOLD.** Do not deploy or onboard `PILOT-001` from this result alone because:
1. fresh dependency audit has Critical runtime findings;
2. Round 2 is still uncommitted and production has not received it;
3. current production has a reproducible React #418 hydration mismatch that fresh local builds do not reproduce;
4. F-01/F-04 require post-deploy evidence;
5. F-02/F-05/F-06 still need closure or explicit disposition.

No production code was changed by this test pass.
## Superseding Security/Regression Update — 2026-09-09

After the initial POST evidence above, the candidate was hardened further before commit/deploy:
- `next` upgraded to `16.3.3`
- `eslint-config-next` upgraded to `16.3.3`
- `vitest` upgraded to `4.1.11`
- transitive `sharp` pinned to `0.35.4`
- transitive `js-yaml` pinned to `4.3.2`
- full `pnpm audit` now reports **0 vulnerabilities**

A shared Playwright fixture now fails every E2E test that emits an unexpected browser `pageerror`; all 84 Chromium/Edge cases still pass. The production adversarial browser runner now also fails when captured page errors are non-empty.

Fresh post-hardening rerun:
- lint PASS
- typecheck PASS
- unit PASS — 154/154
- build PASS — Next `16.3.3`, CSP hashes finalized
- E2E PASS — 84/84 with strict pageerror gate
- security boundary selftest PASS
- full dependency audit PASS — 0 vulnerabilities
- `git diff --check` PASS; line-ending warnings only

**Updated local verdict: ROUND 2 CANDIDATE PASS.**
Production remains pending because this candidate is not yet deployed and the current Wrangler shell has no authenticated approved production identity. F-02/F-05/F-06 remain open/disposition items as described in the summary.
