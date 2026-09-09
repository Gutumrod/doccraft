# DC01 — Test Summary and Improvements — 2026-09-09

> Current local verdict: **ROUND 2 CANDIDATE PASS / PRODUCTION POST PENDING**
> PRE: prior Owner/manual testing + reproducible baseline evidence.
> POST: production validation after this reviewed candidate is deployed.

## PRE Baseline

- Baseline commit: `a52e5708449500305f15e91f107ba0882b17fa46`
- Unit: PASS — 150/150
- Chromium + Edge E2E: PASS — 84/84
- Fresh local baseline pageerror: none
- Prior Owner/manual testing: already completed before Round 2
- Owner does **not** rerun PRE.

## Round 2 Candidate — Current Result

- lint: PASS
- typecheck: PASS
- unit: PASS — 154/154, 13 files
- build + CSP hash finalization: PASS
- security boundary selftest: PASS
- Chromium + Edge E2E: PASS — 84/84
- global E2E browser `pageerror` gate: PASS
- Wrangler HTTP redirect dry-run: PASS
- Wrangler HTTPS static deploy dry-run: PASS
- `git diff --check`: PASS; line-ending warnings only

## Dependency Remediation

Security dependency findings from PRE are now remediated in the candidate:
- `next`: `16.3.1` → `16.3.3`
- `eslint-config-next`: `16.3.1` → `16.3.3`
- `vitest`: `3.2.6` → `4.1.11`
- `sharp`: forced to patched `0.35.4`
- `js-yaml`: forced to patched `4.3.2`
- full `pnpm audit`: **0 vulnerabilities**

The `sharp` and `js-yaml` pins live in `pnpm-workspace.yaml` because pnpm 11 no longer reads `pnpm.overrides` from `package.json`.

## Security Improvements Proven Locally

- F-03: valid 6000×6000 compressed PNG is rejected before browser decode.
- F-04: generated CSP hashes block unapproved inline script execution locally.
- F-01 candidate: HTTP-only redirect Worker is separated from HTTPS static asset delivery.
- E2E now fails on unexpected browser `pageerror` instead of silently passing.
- production adversarial browser test now fails if any captured pageerror is observed.

## Production Items Still Open

- Round 2 is not yet deployed to `dc01.wstera.com`.
- Current production still reflects the PRE build and previously emitted React `#418`.
- F-01/F-04 require live post-deploy evidence before closure.
- F-02 TLS 1.0/1.1 remains House-owned impact work; DC01 must not change the shared zone independently.
- F-05 deploy identity remains open: current Wrangler shell is not authenticated and no dedicated least-privilege production credential is proven.
- F-06 is partial: `master` is protected, but required status checks/rulesets still need explicit closure or disposition.

## Required Order From Here

1. Review and commit the tested candidate.
2. Push the branch for traceability.
3. Deploy only with an approved Cloudflare production identity.
4. Run production smoke, strict pageerror gate, bounded adversarial checks, and live F-01/F-04 verification.
5. If automated production POST passes, Owner runs `OWNER_MANUAL_TEST_POST_2026-09-09.md` once.
6. Compare POST against the already-closed PRE baseline and issue the final pilot/security verdict.

`PILOT-001` remains HOLD until production POST and remaining security dispositions are complete. Phase 7 remains frozen.

## Production POST Update — 2026-09-09

Round 2 is now deployed to production.

Deployment evidence:
- source commit: `8c29254`
- redirect Worker: `8d271814-327b-48b7-9ba6-3b314f9b6aa0`
- main DocCraft deployment: `10063532-44e1-4f57-951e-69c171e4ad03`

Post-deploy automated result:
- production smoke PASS on Chrome and Edge
- HTTP→HTTPS canonical redirect PASS
- edge adversarial PASS
- browser adversarial PASS
- `PAGE_ERRORS=[]`
- prior production React `#418` no longer reproduces
- live CSP uses generated script hashes and no broad inline-script allowance

**Current verdict: AUTOMATED PRODUCTION POST PASS / OWNER MANUAL POST READY.**

Remaining non-Owner items:
- F-02 TLS legacy-protocol disposition remains House-owned
- F-05 dedicated least-privilege deploy identity remains governance work; this deployment used the authenticated account OAuth profile
- F-06 repository protection is still partial until required status checks/ruleset disposition is closed

Owner should now execute `OWNER_MANUAL_TEST_POST_2026-09-09.md`. Final pilot verdict follows Owner evidence plus remaining security/governance disposition.
