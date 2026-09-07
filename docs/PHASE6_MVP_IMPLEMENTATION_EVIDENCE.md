# PHASE 6 — MVP Integration, Hardening & Release Candidate Evidence

> **Product:** DocCraft (DC01)
> **Date:** 2026-09-07
> **Phase baseline:** `master @ 2b4b9d18a76ab329e9228d41c94bbbf9f780fbee`
> **Production:** `https://dc01.wstera.com`
> **Status:** READY FOR INDEPENDENT GATE 6 REVIEW — Gate 6 is not self-closed by this implementation session.

## 1. Scope and Release Boundary

Phase 6 integrated and hardened the already-approved V1 only. No Phase 7+ capability was opened.

Implemented release work:
- static-export production path for the existing browser-first application
- zero-dependency local static server used by release E2E
- Cloudflare Worker static-asset deployment configuration for `dc01.wstera.com`
- Public Pilot notice covering local storage, no cloud backup, no telemetry, PromptPay limitation and tax/accounting disclaimer
- real support entry point through DocCraft GitHub Issues with best-effort/no-SLA wording
- Chrome + Microsoft Edge release E2E matrix
- production smoke script for the deployed surface
- bounded production CSP/security-header hardening after Cloudflare RUM injection was observed

Explicitly not added:
- login/auth
- Supabase/backend/cloud sync
- billing/subscription/payment confirmation/webhook
- server-side PDF generation
- third-party analytics SDK or application telemetry
- Phase 7/8/9 features
## 2. Fresh Verification — Current Phase 6 Tree

Fresh verification was rerun after the Phase 6 release changes and production hardening:

| Check | Result |
|---|---|
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS — 12 files / 147 tests |
| `pnpm build` | PASS — Next.js 16.3.1 static export |
| Chrome release E2E | PASS — 42/42 |
| Microsoft Edge release E2E | PASS — 42/42 |
| `git diff --check` | PASS — CRLF warnings only |

The first long Edge run produced one item-image print test failure while the remove button was already hidden. A targeted rerun of the affected Edge item-image suite passed 3/3, and the later clean final Edge run passed all 42/42 tests. The final release matrix therefore has no unresolved Edge failure.

Boundary scans on the current implementation found:
- runtime dependencies only `next`, `qrcode.react`, `react`, `react-dom`
- no forbidden Supabase/Auth/backend/PDF-engine runtime imports
- no application network API calls in the scanned app/source paths
- production `out/` secret-pattern scan: `NO_SECRET_PATTERN_HITS_IN_OUT`

No unresolved P0/P1 defect is known at evidence-pack preparation time.

## 3. Deployment Evidence

Deployment provider: Cloudflare Workers static assets on the existing WSTERA Cloudflare account.

Deployment configuration:
- Worker name: `wstera-dc01`
- custom domain: `dc01.wstera.com`
- assets directory: `./out`
- no Worker bindings required
- deploy command: `pnpm build && pnpm dlx wrangler@4.129.0 deploy`
Wrangler dry-run evidence:
- 29 static files read from `out/`
- total upload metadata produced successfully
- `No bindings found.`
- `--dry-run: exiting now.`
- exit code `0`

Production deployment evidence:
- initial production version: `d8524885-b6c9-4e73-b3f5-3b0ba85ece91`
- post-header hardening known-good version: `d0b116fb-84c9-42e7-b15b-122eb1762b55`
- `dc01.wstera.com` attached as Cloudflare custom domain
- live DNS resolves through Cloudflare
- live HTTP response: `200 OK`
- response includes CSP, Permissions-Policy, Referrer-Policy, X-Content-Type-Options and X-Frame-Options headers

The deployed application is a static browser application. It does not require login, backend credentials, Supabase, payment-gateway credentials or server-side persistence for the V1 core loop.

## 4. Production Smoke and Telemetry Boundary

A production smoke was executed directly against `https://dc01.wstera.com` in installed Chrome and Microsoft Edge.

Both browsers passed:
- HTTP 200 and `DocCraft` title
- Public Pilot notice visible
- representative line-item edit
- PromptPay enabled with `081-234-5678`
- `net_payable` amount resolved and QR visible with `1,000.00`
- browser-local persistence survives reload
- print-media preview remains visible
- Public Pilot notice is excluded from print

Production smoke final result:
- `CHROME PASS`
- `EDGE PASS`
- `PRODUCTION_SMOKE_PASS https://dc01.wstera.com`
During the first production smoke, Cloudflare injected a request to `static.cloudflareinsights.com`. That contradicted the selected Public Pilot **No telemetry** mode, even though it was provider-side rather than application code.

Bounded remediation:
- added static response headers through `public/_headers`
- CSP restricts script/connect sources to same-origin
- redeployed the same static application

Post-remediation browser evidence:
- Cloudflare Insights request is blocked by CSP
- no successful third-party response is observed by the production smoke
- application functionality remains green in both reference browsers

This evidence does not claim the Cloudflare account-level analytics feature is disabled globally; it proves the deployed browser surface does not successfully load the injected third-party beacon under the current CSP.

## 5. Rollback Exercise — Performed, Not Merely Documented

Rollback was exercised against production using two byte-equivalent Phase 6 deployments.

1. Known-good hardened production version: `d0b116fb-84c9-42e7-b15b-122eb1762b55`.
2. An identical rollback-probe deployment was created: `468d1a08-cc06-472a-99aa-249db918344f`.
3. Wrangler rollback was executed to the known-good version.
4. Wrangler reported `SUCCESS` and restored `d0b116fb-84c9-42e7-b15b-122eb1762b55` to 100% traffic.
5. Fresh deployment listing records the rollback event with message `Phase 6 rollback verification to known-good static release`.
6. A subsequent live request to `https://dc01.wstera.com` returned HTTP 200 with the hardened response headers.

Current known-good production rollback point at evidence preparation time:
`d0b116fb-84c9-42e7-b15b-122eb1762b55`

## 6. Native Reference-Browser Print Evidence

Fresh production native-print evidence was captured from `https://dc01.wstera.com`.
Evidence files:
- `docs/evidence/PHASE6_CHROME_NATIVE_PRINT_PRODUCTION_2026-09-07.png`
  - SHA-256 `83A8ED337C7B56ED7808B3E67852CD7BE6E013BB4C5BBC4A3EA5AB8130BA11D0`
  - Chrome native print preview opened from production
  - reports `1 sheet of paper`
  - no editor/application controls inside the printed physical page
  - no critical clipping or overlap visible
- `docs/evidence/PHASE6_EDGE_NATIVE_PRINT_PRODUCTION_A4_2026-09-07.png`
  - SHA-256 `B128EE951C090FE57AD9642E994D09136D138E2DE84DCE6B8B465883446D5555`
  - Microsoft Edge native print preview opened from production
  - paper size visibly set to `A4`
  - reports `Total: 1 sheet of paper`
  - document remains intact without application UI leakage

Chrome's same-day Gate 5 Owner acceptance remains the explicit A4 + one-sheet + real PromptPay QR proof for Chrome (`GATE5_PROMPTPAY_NATIVE_PRINT_OWNER_ACCEPTANCE_2026-09-07.png`). Phase 6 did not change the document print layout; it added the Public Pilot notice as `no-print` and moved hosting to static production. Fresh Phase 6 Chrome production print proves the production surface still opens the native dialog and remains one sheet. The independent reviewer must decide whether this combined evidence satisfies the final reference-browser print contract; this implementation session does not self-certify Gate 6.

## 7. PRD V1 Acceptance Evidence Matrix

| # | PRD acceptance requirement | Phase 6 evidence | Status |
|---|---|---|---|
| 1 | Tax/VAT states independent; invalid tax invoice blocked | domain tax tests + Chrome/Edge editor E2E valid/invalid tax flows | PASS |
| 2 | Discounts, VAT, WHT, deposits, rounding covered | `tests/domain/calculation.test.ts`, rounding/tax suites; 147/147 unit PASS | PASS |
| 3 | 375–430px phone and tablet core loop without blocking overflow | Phase 2 responsive E2E passes in Chrome and Edge | PASS |
| 4 | One-page and multi-page A4 print without editor UI leakage | existing Gate 3 native A4 closure + fresh Phase 6 Chrome/Edge print regression; Edge production A4 screenshot | PASS evidence assembled; reviewer confirmation required |
| 5 | Native print dialog; environment PDF destination available | fresh production native dialogs in Chrome/Edge; PDF-XChange Lite visible; Chrome same-day Gate 5 A4 evidence | PASS evidence assembled; reviewer confirmation required |
| 6 | Refresh restores current draft | persistence E2E in both browsers + production smoke reload | PASS |
| 7 | Storage failure surfaced without destroying in-memory work | storage quota/error unit + E2E passes in both browsers | PASS |
| 8 | Exported JSON imports into a clean session and reproduces document | persistence round-trip tests/E2E pass; capability remains intentionally hidden from standard V1 UI per Owner decision | PASS |
| 9 | PromptPay known vectors pass; invalid identifiers rejected | PromptPay unit suite + Phase 5 E2E in Chrome/Edge + production smoke | PASS |
| 10 | End-to-end V1 works without login, Supabase or gateway credentials | static export, runtime/dependency scan, no network API hits, production smoke | PASS |
| 11 | Business logo survives upload/hide/show/refresh/round-trip/print without clipping | Phase 4.1 unit/E2E and current Chrome/Edge release suites | PASS |

## 8. Public Pilot Operational Readiness Inputs

Publishable pilot inputs now present:
- `PUBLIC_PILOT_USER_NOTICE.md`
- in-product `PilotNotice` with local-first/no-cloud/no-telemetry disclosure
- `MVP_METRICS_AND_ANALYTICS.md` records collection mode **No telemetry**
- `ONBOARDING_AND_SUPPORT.md` records DocCraft GitHub Issues as the Public Pilot support entry point and does not promise an SLA
- release browser matrix: Chrome + Microsoft Edge
- production URL: `https://dc01.wstera.com`
- rollback point exercised and recorded

The support channel is intentionally best-effort for the free Public Pilot. Paid-support contracts remain out of scope.

## 9. Known Limitations / Non-Blockers

- User drafts are browser-local; there is no cloud backup or cross-device sync.
- JSON backup/import capability exists internally but standard V1 controls remain hidden per Owner decision.
- Browser/OS print rendering can differ outside the tested reference environments.
- PromptPay QR is document payment instruction only; DocCraft does not confirm payment receipt.
- Tax Invoice validation expresses application rules, not legal/tax certification.
- Cloudflare may attempt to inject its own analytics beacon at the edge; current CSP blocks that script from executing/loading successfully on the production page.
- Public Pilot has no paid SLA.

None of these items expands Phase 6 scope or independently justifies Phase 7.

## 10. Gate 6 Disposition

Implementation/evidence disposition: **READY FOR INDEPENDENT GATE 6 REVIEW**.

This implementation session does **not** declare `GATE 6 — PASS`.

Required next step after creating a durable Git checkpoint:
- independent reviewer inspects the committed Phase 6 diff, production evidence, native-print screenshots, current production URL, test results, rollback record and this PRD matrix
- reviewer returns exactly `GATE 6 — PASS` or `GATE 6 — REMEDIATE`

Until that independent verdict is PASS:
- Gate 6 remains open
- Public Pilot is deployed for release verification but PV Gate is not started
- Phase 7 remains frozen

## Independent Gate 6 Closure — 2026-09-07

Independent review completed against committed implementation `01115cc908adcbc4224d3d7878f8680da287439e` in isolated worktree `D:\AI-Workspace\runtime\reviews\doccraft-gate6-01115cc`.

- Canonical review: `docs/GATE6_INDEPENDENT_REVIEW_2026-09-07.md`
- Exact reviewer verdict: `GATE 6 — PASS`
- Gate 6: **PASS / CLOSED**
- CRITICAL: none
- HIGH: none
- unresolved P0/P1: none
- mandatory remediation blocking Public Pilot: none

Reviewer findings M-1 through M-4 are preserved as **Public Pilot Follow-up / Non-blocking**:
- M-1 — application-level “no telemetry” wording does not cover Cloudflare provider-layer logging/reporting.
- M-2 — production smoke does not directly assert security headers.
- M-3 — evidence pack does not preserve raw Wrangler dry-run / rollback / deployments-list transcripts.
- M-4 — Chrome may use the printer default Paper size (for example Letter) even when print CSS declares A4.

The builder disposition above remains historical and is not rewritten as a self-declared PASS. The independent reviewer supplied the closure verdict.

Next authorized stage: **Public Pilot / PV Gate**. Phase 7 remains frozen until PV Gate = PASS; Phase 8–9 remain frozen behind the existing roadmap sequence.
