# DC01 — Agent Test PRE — 2026-09-09

> Purpose: establish a reproducible baseline before accepting Round 2 agent changes.
> Product: DocCraft (DC01)
> Baseline commit: `a52e5708449500305f15e91f107ba0882b17fa46`
> Production: `https://dc01.wstera.com`
> Decision boundary: testing/evidence only; no Phase 7, no production implementation changes.

## Source of Truth

Read before executing:
- `docs/CURRENT_STATUS.md`
- `docs/HANDOFF-DC01-ADVERSARIAL-SECURITY-ROUND1-2026-09-08.md`
- `docs/ADVERSARIAL_SECURITY_ROUND1_2026-09-08.md`
- `docs/BRIEF-public-pilot-adversarial-remediation-round2-2026-09-08.md`
- `docs/BRIEF-public-pilot-pv-gate-2026-09-08.md`

## Baseline Isolation

Fresh detached worktree was created at baseline `a52e570`; the active dirty Round 2 branch was not reset or modified.
Dependencies were installed with `pnpm install --frozen-lockfile` from the baseline lockfile.
The temporary worktree was removed after evidence collection.

## Fresh Baseline Results
| Check | Result |
|---|---|
| install frozen lockfile | PASS |
| lint | PASS |
| typecheck | PASS |
| unit | PASS — 150/150, 12 files |
| build | PASS — static output |
| legacy security gateway selftest | PASS |
| Chromium + Edge E2E | PASS — 84/84 |
| clean local page load `pageerror` | PASS — none |
| `pnpm audit --prod` | FAIL — 2 Critical + 1 High |
| full `pnpm audit` | FAIL — 2 Critical + 2 High + 2 Moderate |

## Fresh Production Baseline Probes

- HTTP root/path/query/static asset redirect to canonical HTTPS with `308`.
- sensitive/config paths tested remain non-exposed; tested write methods return `405`.
- tested CORS, framing, XSS, persisted XSS and prototype-pollution controls remain effective.
- production CSP still contains `script-src 'self' 'unsafe-inline'`.
- production currently emits React minified error `#418` on a clean load.
- React `#418` was not reproduced by a fresh local build of the same `a52e570` source.
- TLS 1.0 and TLS 1.1 capped requests still reached HTTP 200; F-02 remains open pending House impact review.

## PRE Verdict
**BASELINE FUNCTIONAL REGRESSION: PASS.**

**SECURITY / PILOT READINESS: HOLD.** Fresh dependency intelligence invalidates the older "no known vulnerabilities" statement for the current dependency set. This is baseline risk, not a Round 2 regression.

Current runtime package findings:
- `next@16.3.1`: two current Critical advisories; patched line begins at `16.3.3`.
- transitive `sharp@0.35.3`: current High advisory; patched line begins at `0.35.4`.
- full development audit additionally reports `js-yaml` High and Vitest/@vitest/mocker Moderate findings.

The production React #418 mismatch is also a live-production defect, but because a fresh build from the identical baseline source has no pageerror, root cause must not be assigned to source code without deployment/cache evidence.

`PILOT-001` remains HOLD. This PRE document does not authorize deployment or Phase 7.