# DocCraft — Product Engineering Roadmap

> **Status:** Execution Contract — D0 Approved Baseline
> **Version:** 2.1 — V1 Business Logo Amendment
> **Rule:** Phase ถัดไปเปิดได้เมื่อ phase ปัจจุบันผ่าน acceptance gate และ review แล้วเท่านั้น
> **D0:** PASS — Phase 1 may proceed under its current execution brief
> **Execution Detail:** `IMPLEMENTATION_PLAN.md` เป็นแผนปฏิบัติการที่ต้อง map 1:1 กับ Phase 1–9 ของ ROADMAP นี้; งาน Repository Intake เป็น pre-implementation step (`R0`) ไม่ใช่ ROADMAP Phase 0

## Phase 0 — Documentation Contract
- normalize terminology และ source-of-truth hierarchy
- แยก entity type / VAT status
- lock V1 / post-MVP boundaries
- lock claims guardrail และ acceptance gates

**Gate:** เอกสารหลักไม่มี scope contradiction ที่ทราบอยู่

## Phase 1 — Domain Model + Calculation Engine
- document schema + schema version
- tax/VAT state model
- discounts, VAT, WHT, deposit, rounding
- pure calculation tests + validation tests

**Gate:** calculation edge cases และ invalid tax states ผ่าน automated tests

## Phase 2 — Editor + Modular Blocks
- desktop editor/live preview layout
- mobile editor/preview switcher
- block visibility without deleting persisted data
- document/business/customer/item forms

**Gate:** core data-entry loop ใช้งานได้ทั้ง phone 375–430px, representative tablet widths 431–1023px และ desktop >=1024px
## Phase 3 — A4 Preview + Print
- A4 portrait baseline + print-safe layout
- Print action เรียก native browser print dialog ผ่าน window.print(); ไม่มี PDF generator ใน V1
- Reference-environment manual check: ผู้ใช้ไปถึงตัวเลือก Save as PDF ใน browser/OS print dialog ได้เมื่อ environment รองรับ
- one-page / multi-page handling
- Thai text and long-table fixtures
- Chrome/Edge reference print verification

**Gate:** representative fixtures print ผ่าน native browser print dialog (window.print()) โดยไม่มี editor UI รั่วและไม่มี critical clipping; DocCraft ไม่ generate PDF เอง — Save as PDF เป็นความสามารถของ browser/OS dialog

## Phase 4 — Local Persistence + Backup
- autosave + restore
- schema migration
- image resize/compression/encoded-size guard
- quota/error recovery
- JSON export/import + validation

**Gate:** refresh restore, corrupted import และ storage failure behavior ผ่าน

## Phase 4.1 — Business Logo / Branding Block
- optional single business logo in fixed document-header placement
- source upload PNG/JPEG/WebP; canonical client-side JPEG/WebP persistence with logo-specific dimension/encoded-size guards
- preserve aspect ratio; no free-drag, arbitrary positioning or unrestricted resize
- hide/show without deleting stored logo; failed replacement preserves previous accepted logo
- schema migration + local restore + JSON export/import round-trip
- A4 preview/native print regression with logo/no-logo fixtures and long business-header content
- no backend/auth/cloud asset dependency

**Gate:** logo upload/validation/failure recovery/persistence/JSON round-trip/preview/native print tests ผ่าน; documents without logo and calculation/tax suites have no regression; independent review confirms no critical header/table overflow

## Phase 5 — PromptPay Document QR
- PromptPay identifier validation
- EMV payload + CRC tests
- explicit amount mode: deposit / net payable / no fixed amount

**Gate:** known test vectors ผ่านและ invalid target ถูก reject

## Phase 6 — MVP Hardening & Release Candidate
- end-to-end core loop
- mobile/desktop regression
- calculation and print regression
- no-login/no-backend smoke test

**Gate:** PRD V1 acceptance gates ผ่านครบก่อน release
## PV — Pilot Validation & Operational Readiness Gate
Phase 7 ห้ามเปิดเพียงเพราะ Phase 6 code ผ่าน ต้องมีหลักฐานเพิ่มจาก `PRODUCT_VALIDATION_PLAN.md`, `MVP_METRICS_AND_ANALYTICS.md`, `ONBOARDING_AND_SUPPORT.md`, `RELEASE_AND_OPERATIONS_RUNBOOK.md` และ `TERMS_PRIVACY_AND_DATA_NOTICE.md`.

**Gate:** Public Pilot operationally ready + real-user evidence shows repeat usage and recurring pain that justifies Cloud/Pro investment; otherwise iterate V1 without opening Phase 7.

## Phase 7 — Pro Cloud Foundation
**Precondition:** PV Gate = PASS
- Auth
- Supabase schema + RLS
- document sync
- reusable customers/catalog
- local-to-cloud migration path

**Gate:** tenant isolation, sync conflict behavior และ recovery tests ผ่าน

## Phase 8 — Commercial Billing
- entitlement model
- supported recurring payment rail
- webhook idempotency/reconciliation
- configurable pricing

**Gate:** billing lifecycle และ entitlement transitions ผ่าน integration tests

## Phase 9 — Post-MVP Workflow
Candidates only after validation:
- quotation → invoice → receipt conversion
- Excel/monthly reports
- advanced templates/themes (single fixed business logo block shipped in V1 Phase 4.1; this candidate covers broader visual customization)
- E-Sign/public customer links after security/privacy approval

**Gate:** แต่ละ capability ต้องมี PRD extension และ acceptance criteria ก่อน implement

## Roadmap Policy
- Phase 4.1 เป็น approved V1 insertion ก่อน Phase 5; Phase 5 ห้ามเปิดจน Gate 4.1 ผ่านตาม sequencing rule
- ไม่มี fixed sprint/date promise ในเอกสารนี้จนประเมิน repo จริง
- checkbox/report จาก agent ไม่ใช่หลักฐานการผ่าน
- pricing หรือ marketing campaign ไม่สามารถเร่ง capability ข้าม gate ได้