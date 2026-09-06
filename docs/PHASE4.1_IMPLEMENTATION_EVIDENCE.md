# DocCraft Phase 4.1 — Business Logo Implementation Evidence

**Ticket:** DC-SR-01
**Date:** 2026-09-06
**Status:** CLOSED — OWNER NATIVE PRINT + INDEPENDENT QA PASS
**Branch:** `master`
**Base HEAD:** `b942a2213d12f0ef3a063b1b1cea4ccd4a3a104d`
**Execution mode:** preserved partial implementation; no restart/reset

## Authority

- `BRIEF-phase4.1-business-logo-branding-block.md`
- `BUILD-TO-SELL-EXECUTION-2026-09-06.md`
- `ROADMAP.md`
- Gate 3 is historical/closed and was not reopened.
- Scope remained local-first/no-login; no backend, auth, cloud, billing, or Phase 5+ work was added.

## Implementation Summary

- Schema bumped from v2 to v3.
- Added document-level `branding.logo` and `blocks.businessLogo`.
- Added v1/v2 → v3 migration preserving document identity/timestamps/items.
- New/migrated documents default `blocks.businessLogo = true`.
- Added client-side PNG/JPEG/WebP logo processing.
- Canonical persisted logo format is JPEG/WebP data URL with positive dimensions.- Logo limits: max long edge 512 px; max persisted data URL 128 KiB.
- WebP is preferred; JPEG fallback composites a white background.
- Failed replacement does not mutate the previously accepted logo.
- Hide/show changes visibility only and preserves persisted logo data.
- Added editor upload/replace/remove flow and fixed-header preview/print rendering.
- Added structural validation, corrupted-import rejection, persistence/JSON round-trip coverage.

## Verification — Secretary Re-run

| Command | Result |
|---|---|
| `npm run lint` | PASS, exit 0 |
| `npm run typecheck` | PASS, exit 0 |
| `npm run test` | PASS, 11 files / 136 tests, exit 0 |
| `npm run build` | PASS, Next.js 16.3.1 production build, exit 0 |
| `npm run test:e2e` | PASS, 36/36 Chromium tests, exit 0 |
| `git diff --check` | PASS, exit 0; LF→CRLF warnings only |

Phase 4.1-specific E2E evidence includes:
- upload → preview;
- unsupported replacement → inline error + prior logo preserved;
- hide/show → logo data preserved;
- refresh → logo persists;
- print-media controls hidden;
- no-logo and transparent-source cases;
- long business header avoids horizontal overflow;
- logo remains bounded in print CSS.
## Review / Closure State

**Phase 4.1 is CLOSED.** All required closure evidence is now present.

1. Independent Stage QA: `agent-qwen`, task `t_7c87a5cc`, PASS.
2. Deterministic integration verification: PASS.
3. Final relay evidence for `t_b77aaa67`: PASS.
4. Owner native Chrome print-preview acceptance: PASS on 2026-09-06 after the logo-scale remediation.
5. Owner also accepted the no-logo / transparent-source / long-header manual matrix requested for closure.

The earlier Claude session lock is historical and released; it is not a remaining blocker.

## Execution Evidence / Provenance

- Preserved pre-existing Phase 4.1 partial working tree; no reset/clean/restart.
- Same-ticket alternate worker: `agent-codex`, task `t_0b77e126`.
- Codex completed stale schema-v3 test updates and added Phase 4.1 unit/E2E coverage.
- Secretary independently reran lint, typecheck, unit, build, E2E, and diff-check gates.
- No commit, push, merge, deploy, Council, Module Hub Scan, KMO work, or production mutation occurred in this checkpoint.

**Checkpoint verdict:** PASS / CLOSED — DC-SR-01 complete.
## Owner Native-Print Checkpoint — 2026-09-06 17:15–17:22 (+07:00)

Owner opened the current Phase 4.1 working tree remotely through a temporary Cloudflare Quick Tunnel and reached the real Chrome native print dialog successfully.

Observed PASS evidence before visual remediation:
- public remote access loaded DocCraft and client interaction worked;
- native print dialog opened from the public URL;
- representative one-page A4 layout rendered without structural breakage;
- uploaded KMO business logo rendered in native print preview.

Owner finding: the print logo was functionally correct but visually too small. The prior print contract bounded the logo at approximately 16 px high / 96 px wide.

Targeted remediation:
- print logo footprint increased to 40 px high with 160 px maximum width;
- `object-fit: contain` and left-centered object positioning preserve a bounded fixed-header placement;
- no schema, persistence, calculation, backend, auth, billing, or unrelated layout scope changed.

Post-remediation verification:
- production build PASS;
- Phase 4.1 targeted Chromium E2E: 2/2 PASS;
- lint PASS;
- typecheck PASS;
- unit tests: 11 files / 133 tests PASS;
- full Chromium E2E: 35/35 PASS;
- `git diff --check` PASS;
- public tunnel smoke: HTTP 200, title `DocCraft`, browser errors 0;
- external print-media measurement for transparent test logo: 40 x 40 CSS px.

At this intermediate checkpoint closure was still pending manual acceptance; this condition is superseded by the Owner Final Manual Acceptance section below.

## Owner Final Manual Acceptance + Numbering Usability Remediation — 2026-09-06 18:23–18:36 (+07:00)

Owner accepted the remediated logo scale in native Chrome print preview and completed the requested manual closure checks.

During the same sell-readiness review, Owner identified a document-number UX defect: changing document type did not update the standard prefix, allowing combinations such as Work Order + `QT-0001`.

Approved bounded remediation:
- standard prefixes: Quotation `QT`, Invoice `INV`, Receipt `RC`, Work Order `WO`, Tax Invoice `TAX`;
- preserve the suffix when switching types;
- preserve custom numbering that does not match a DocCraft-managed prefix;
- keep Tax Invoice fail-closed semantics, including consistent prefix rollback when tax-invoice state auto-downgrades to Invoice.

Verification after this remediation:
- lint PASS;
- typecheck PASS;
- unit tests: 11 files / 136 tests PASS;
- production build PASS;
- Chromium E2E: 36/36 PASS;
- `git diff --check` PASS;
- public production-tunnel smoke: HTTP 200, browser errors 0;
- external behavior smoke: `QT-0001 -> WO-0001 -> INV-0001`, custom `KMO-2026-091` preserved.

**Final DC-SR-01 verdict: CLOSED.** Next bounded ticket is DC-SR-02 (Phase 5 PromptPay document QR), which requires a fresh plan before implementation.