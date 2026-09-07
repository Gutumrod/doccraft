# Current Status - 2026-09-07

**Product:** DocCraft (DC01)
**Repository branch:** `master`
**Phase 5 implementation baseline:** `15a58ccca221a9d568513f103b9d163cdc9dd382`
**Working state:** Phase 5 implementation is uncommitted; Gate 5 is PASS / CLOSED after Owner native-print acceptance, bounded remediation, and independent re-review.
**Purpose:** current-state overlay only; historical gate/evidence documents keep their own dated authority.

## Verified Current State
Gate 1 through Gate 5 are closed. **Phase 5 / DC-SR-02 PromptPay Document QR is PASS / CLOSED** on 2026-09-07. Phase 6 remains unopened.

Public Pilot V1 PromptPay contract is locked to:
- mobile phone identifier
- National ID / Tax ID 13 digits
- amount mode: no fixed amount, deposit, or net payable

Identifier types outside that set, payment confirmation, slip verification, gateway/webhook, subscription billing, backend/auth/cloud sync, and server-side QR generation are outside this phase.

## Phase 5 Implementation State
- canonical schema advanced from v3 to v4
- `payment.promptPay` explicitly stores `enabled`, `identifierType`, `identifier`, and `amountMode`
- migration chain is deterministic: v1 -> v2 -> v3 -> v4
- legacy v3 documents migrate with PromptPay disabled by default
- PromptPay normalization, validation, amount resolution, EMV payload, and CRC live in a separate domain module
- calculation/tax/WHT/deposit engine remains PromptPay-agnostic
- QR presentation uses validated payload only
- invalid active PromptPay state fails closed and blocks print
- hiding the Payment block preserves PromptPay data and removes it from print validity
- PromptPay configuration survives local autosave/refresh and JSON export/import
- amount formatting rejects scientific notation and positive values that round to `0.00`; payload builder also fails closed on invalid direct input

## Final Automated Verification
- lint PASS
- typecheck PASS
- unit: 12 files / 147 tests PASS
- production build PASS
- Chromium E2E: 39/39 PASS
- `git diff --check` PASS
- PromptPay known static/dynamic payload + CRC vectors PASS
- Phase 2–4.1 regression E2E remains green

## Gate 5 Closure — 2026-09-07
**GATE 5 — PASS / CLOSED**

Owner native Chrome preview/print acceptance: **PASS**
- A4 selected in native Chrome print dialog
- 1 sheet of paper
- PromptPay QR remains readable and layout is intact
- Owner confirmed the QR resolves to the correct PromptPay account and amount

Independent review chronology:
- initial independent review: `GATE 5 — REMEDIATE` due one HIGH amount-format edge case where scientific notation could enter EMV tag 54
- bounded remediation added canonical decimal amount validation plus payload-builder defense-in-depth
- post-remediation verification: 12 files / 147 unit tests PASS, 39/39 Chromium E2E PASS, lint/typecheck/build/diff-check PASS
- independent re-review: `GATE 5 — PASS`; CRITICAL/HIGH/MEDIUM/LOW = none

Evidence:
- `GATE5_INDEPENDENT_REVIEW_2026-09-07.md`
- `GATE5_REMEDIATION_EVIDENCE_2026-09-07.md`
- `GATE5_INDEPENDENT_REREVIEW_2026-09-07.md`
- `evidence/GATE5_PROMPTPAY_NATIVE_PRINT_OWNER_ACCEPTANCE_2026-09-07.png`

## Next Action
Phase 6 is the next roadmap phase but is **NOT OPENED** by this Gate 5 closure. Prepare/review the Phase 6 execution plan before any Phase 6 production-code changes.

## Change Rule
Update this file when branch/gate/runtime reality changes. Do not rewrite historical evidence to make an old result look current.
