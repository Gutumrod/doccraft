# DocCraft — Phase 5 Execution Brief: PromptPay Document QR

> **Phase:** 5 — PromptPay Document QR
> **Status:** PASS — CLOSED (2026-09-07)
> **Prepared:** 2026-08-24
> **Opened:** 2026-09-06 by Owner authorization
> **Repository:** `Gutumrod/doccraft`
> **Branch:** `master`
> **Implementation Baseline:** `15a58ccca221a9d568513f103b9d163cdc9dd382`
> **Open Preconditions:** SATISFIED — Gates 3, 4 and 4.1 closed before Phase 5 opening
> **Source of Truth:** `PRD.md` → `SYSTEM_ARCHITECTURE.md` → `ROADMAP.md` → `IMPLEMENTATION_PLAN.md`

## 0. Gate Notice
Phase 5 was explicitly opened by Owner on 2026-09-06 after the repository was verified clean at the implementation baseline above. The previous August REMEDIATE notice is superseded by the later closed Gates 3, 4 and 4.1 evidence.

Implementation remained bounded to this brief. Gate 5 closed on 2026-09-07 after automated verification, Owner native-print acceptance, one bounded remediation from independent review, and independent re-review PASS.

## 1. Objective
Add a client-side PromptPay QR payment instruction block to DocCraft documents. This capability generates a validated PromptPay EMV payload and QR presentation for the user's customer; it is not DocCraft subscription billing and does not confirm payment.

## 2. In Scope
- PromptPay identifier model and validation for Public Pilot V1: mobile + National ID/Tax ID 13 หลักเท่านั้น
- deterministic EMV payload builder
- CRC calculation and known-vector tests
- explicit amount source modes:
  - deposit amount
  - net payable
  - no fixed amount
- QR rendering from a validated payload
- editor controls for PromptPay target and amount mode
- preview/print presentation of the QR block
- fail-closed behavior: invalid identifier or invalid amount must not render a QR that appears usable
- persistence/JSON backup integration through the canonical document representation that exists after Gate 4 remediation

## 3. Explicit Non-Scope
- payment confirmation or paid-status automation
- bank API integration
- slip verification
- webhook/payment gateway
- DocCraft subscription billing
- recurring payment rail
- Supabase/auth/cloud sync
- server-side QR generation
- PDF generation

## 4. Domain & Architecture Rules
- PromptPay generation remains browser/client-side.
- Payload generation must be deterministic and isolated from React presentation code.
- Identifier normalization/validation occurs before payload generation.
- Amount must be derived from the selected explicit mode; UI must not silently infer deposit vs net payable.
- `no fixed amount` must produce a payload without a fixed transaction amount according to the selected PromptPay contract.
- Invalid/NaN/non-finite/negative amount states must fail closed according to domain validation.
- QR presentation must consume only a successfully validated payload.
- PromptPay document QR must remain completely separate from commercial subscription/billing modules.

## 5. Intake Before Coding
Inspect the final post-remediation definitions for:
- `DocCraftDocument.payment`
- calculation result fields for deposit/net payable
- editor payment block
- `DocumentPreview` payment presentation
- persistence runtime validation and migration
- JSON import/export envelopes

Confirm whether the current canonical schema already has explicit fields sufficient for PromptPay target + amount mode. If not, define the smallest versioned schema amendment and migration before implementation.

## 6. Required Tests
- accepted identifier formats normalize to expected target values
- invalid identifiers are rejected
- known EMV payload vectors match exactly
- CRC vectors match exactly
- deposit amount mode emits the expected amount
- net-payable mode emits the expected amount
- no-fixed-amount mode omits fixed amount correctly
- zero/negative/non-finite/invalid amount cases fail closed as specified
- QR is not rendered for invalid payload state
- PromptPay state survives autosave/refresh and JSON export/import
- QR block remains readable in A4 print media
- Phase 1–4 regression remains green

## 7. Gate 5 Acceptance
Phase 5 may pass only when:
- known PromptPay payload and CRC vectors pass
- every amount mode passes deterministic tests
- invalid target/amount states fail closed
- QR presentation prints without critical layout breakage
- persistence/backup round-trip covers PromptPay state
- no payment-confirmation/billing/backend scope drift is introduced
- unit, typecheck, lint, build, and Playwright E2E all pass
- independent reviewer inspects the actual diff and evidence

Owner native-print acceptance: **PASS — 2026-09-07**
- Native Chrome print preview set to A4 and remained one sheet.
- QR remained readable; no critical layout breakage was observed.
- Owner confirmed the generated QR resolves to the correct PromptPay account and amount.

Independent review chronology:
- initial independent review: `GATE 5 — REMEDIATE` for one HIGH scientific-notation amount-format edge case
- bounded remediation added canonical decimal formatting/validation and direct payload-builder defense-in-depth
- post-remediation verification: 12 files / 147 tests PASS, 39/39 Chromium E2E PASS, lint/typecheck/build/diff-check PASS
- independent re-review: `GATE 5 — PASS`; no CRITICAL/HIGH/MEDIUM/LOW findings remain

## 8. Stop Conditions
Stop Phase 5 and return to documentation review if:
- the implementation would require payment confirmation, webhook, gateway credentials, or server-side payment state
- a schema change is needed but no migration-safe representation is defined
- PromptPay target rules are ambiguous in the authoritative product contract
- QR generation requires weakening Phase 4 persistence validation
- Phase 1–4 regression fails due to a contract conflict

## 9. Handoff State
Phase 5 is **PASS / CLOSED** on 2026-09-07. Identifier scope remains locked to mobile + National ID/Tax ID 13 หลัก, schema v4 is the canonical Phase 5 representation, and no cloud/account/subscription/payment-confirmation scope was introduced. Phase 6 is next in the roadmap but remains unopened until its execution plan is prepared/reviewed.
