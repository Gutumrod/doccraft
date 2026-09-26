# Current-State Overlay — 2026-09-25 (Public Hostname Migration)

**Canonical production:** `https://doccraft.wstera.com`
**Legacy compatibility host:** `https://dc01.wstera.com` — still serves the same app (no cross-host redirect)
**Product code:** `DC01` (internal identifier, unchanged)
**Policy:** parent `Gutumrod/saas-product-hub@8873bbc8e62fe578a5ba75d0083a9e44d800dfbb` `docs/platform/PRODUCT_PUBLIC_NAMING_AND_HOSTNAME_POLICY.md`
**Evidence:** `docs/HOSTNAME_MIGRATION_DOCCRAFT_2026-09-25.md`

- Worker `wstera-dc01` version `2f204f27-2d9a-4b79-b9d8-02ed1c00e00a` serves both custom domains `doccraft.wstera.com` and `dc01.wstera.com`.
- Worker `wstera-dc01-http-redirect` version `b899965e-d3d8-4cbb-801c-cbca9d6a777a` holds routes `http://doccraft.wstera.com/*` and `http://dc01.wstera.com/*`.
- Live HTTP on both hosts currently returns `301` to the same host/path/query over HTTPS (zone edge answers before the Worker route). The `301` vs `308` contract gap is a separate open finding (`docs/testing/DEFECT_BRANCH_SELECTION_TOGGLE_2026-09-24.md`), not changed by this migration.
- Drafts are browser-local per origin: a draft saved on `dc01.wstera.com` is not visible on `doccraft.wstera.com`. Users move drafts via JSON backup export/import.
- Application source is the branch-toggle fix state (`f5f4951`) plus hostname config; Phase 7 remains frozen.

The 2026-09-08 status below is preserved as dated history; where it conflicts with this overlay, this overlay wins.

---

# Current Status - 2026-09-08

**Product:** DocCraft (DC01)
**Repository branch:** `master`
**Phase 5 durable checkpoint:** `2b4b9d18a76ab329e9228d41c94bbbf9f780fbee`
**Reviewed Phase 6 implementation:** `01115cc908adcbc4224d3d7878f8680da287439e`
**Production:** `https://dc01.wstera.com`
**Working state:** Gates 1–6 are PASS / CLOSED. Public Pilot / PV Gate is OPEN for real-user evidence collection, but `PILOT-001` is temporarily HOLD while Owner-directed adversarial security validation is completed. Baseline Public Pilot hardening PASS on 2026-09-08; Phase 7 remains frozen.
**Purpose:** current-state overlay only; historical gate/evidence documents keep their own dated authority.

## Verified Current State

Gates 1 through 6 are PASS / CLOSED. Phase 6 Release Candidate is closed at reviewed implementation `01115cc908adcbc4224d3d7878f8680da287439e`. Independent review is preserved in `GATE6_INDEPENDENT_REVIEW_2026-09-07.md`.

Phase 6 completed evidence:
- lint / typecheck / build PASS
- unit tests 147/147 PASS
- Chrome release E2E 42/42 PASS
- Microsoft Edge release E2E 42/42 PASS
- `git diff --check` PASS with CRLF warnings only
- static production deploy to `dc01.wstera.com`
- production smoke PASS in Chrome + Edge
- no-login/no-backend/no-secret/no-PDF-engine boundary verified
- native production print evidence captured for Chrome + Edge
- actual production rollback exercise completed successfully
- PRD V1 acceptance matrix recorded in `PHASE6_MVP_IMPLEMENTATION_EVIDENCE.md`
## Production Release Candidate Evidence

Cloudflare Worker:
- name: `wstera-dc01`
- custom domain: `dc01.wstera.com`
- Gate 6 known-good version at closure: `d0b116fb-84c9-42e7-b15b-122eb1762b55`
- current Public Pilot security version: `722b573b-8dbb-4a50-b1ea-d880f6a03a5b`
- rollback-probe version: `468d1a08-cc06-472a-99aa-249db918344f`
- rollback was executed back to the known-good version and Wrangler restored it to 100% traffic
- live HTTPS production returns HTTP 200 with hardened response headers; HTTP requests redirect 308 to HTTPS

Public Pilot operational mode:
- browser-local storage
- no login
- no cloud backup/sync
- no application telemetry
- Cloudflare-injected Insights beacon is blocked by production CSP
- PromptPay QR is document instruction only, not payment confirmation
- support: DocCraft GitHub Issues, best-effort / no SLA

## Gate 6 Closure — 2026-09-07

Independent review completed against committed implementation `01115cc908adcbc4224d3d7878f8680da287439e` from an isolated detached worktree.

- verdict: `GATE 6 — PASS`
- CRITICAL: none
- HIGH: none
- unresolved P0/P1: none
- mandatory remediation blocking Public Pilot: none
- canonical review: `GATE6_INDEPENDENT_REVIEW_2026-09-07.md`

Public Pilot follow-up / non-blocking:
- M-1 — application-level “no telemetry” wording does not cover Cloudflare provider-layer logging/reporting
- M-2 — production smoke does not directly assert security headers
- M-3 — evidence pack does not preserve raw Wrangler dry-run / rollback / deployments-list transcripts
- M-4 — Chrome may use the printer default Paper size (for example Letter) even when print CSS declares A4

## Public Pilot Security Hardening — 2026-09-08

Canonical evidence: `PUBLIC_PILOT_SECURITY_READINESS_2026-09-08.md`.

- security implementation checkpoint: `fb34f055180015124ac190c36f5728dd681d21f0`
- production Worker version: `722b573b-8dbb-4a50-b1ea-d880f6a03a5b`
- HTTP application and static-asset paths redirect `308` to HTTPS
- HSTS/CSP/anti-framing/noindex/security headers verified on production
- edge gateway rejects methods other than GET/HEAD with `405`
- Vitest critical advisory remediated by upgrade to `3.2.6`; full and production audits report no known vulnerabilities
- source upload and JSON import resource guards added before expensive processing
- lint/typecheck/build PASS; unit 150/150; Chrome 42/42; Edge 42/42; production smoke PASS in both browsers

Gate 6 remains historically PASS/CLOSED. This hardening work resolves the substance of Gate 6 follow-up M-1/M-2 without reopening the gate. M-3/M-4 remain historical findings. Adversarial/destructive security validation is next; no external Pilot participant should be enrolled until that round is reviewed.

## Public Pilot / PV Gate — Opened 2026-09-08

Execution contract: `BRIEF-public-pilot-pv-gate-2026-09-08.md`.

Canonical evidence collection:
- `PUBLIC_PILOT_EVIDENCE_LOG.md`
- `PUBLIC_PILOT_INTERVIEW_GUIDE.md`
- `PV_GATE_DECISION_TEMPLATE.md`

Current evidence state: no external real-user participant has been recorded yet. The next action is to onboard real participants across the three required segments and append observed evidence. Do not infer PV PASS from Owner/internal testing.

Phase 7 / Supabase / Auth / Cloud sync, Phase 8 billing, and Phase 9 post-MVP capabilities remain frozen until PV Gate = PASS and Owner authorizes the next phase.

## Change Rule

Update this file when branch/gate/runtime reality changes. Do not rewrite historical evidence to make an old result look current.

## HTTP Transport Contract Amendment — 2026-09-25

Owner locked the existing production HTTP `301` behavior on 2026-09-25. Current acceptance permits `301` or `308` only for HTTPS on the same host with the original path and query preserved; the prior 301/308 finding is closed by matching automated assertions to this contract. Production smoke must run the transport assertion with no skip. This does not change hostname routing or authorize cross-host redirects or sunset. See `HOSTNAME_MIGRATION_DOCCRAFT_2026-09-25.md` §8.1 and `RELEASE_AND_OPERATIONS_RUNBOOK.md` §11 for the contract; the S10 report records verification evidence.
