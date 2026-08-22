# DocCraft — Product Engineering Roadmap

> **Status:** Execution Contract — Documentation Freeze
> **Version:** 2.0
> **Rule:** Phase ถัดไปเปิดได้เมื่อ phase ปัจจุบันผ่าน acceptance gate และ review แล้วเท่านั้น
> **D0 Freeze:** ห้ามแก้ production code เพิ่มจน `DOCUMENTATION_READINESS_INDEX.md` ผ่าน D0 Documentation Gate
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
- templates/themes
- E-Sign/public customer links after security/privacy approval

**Gate:** แต่ละ capability ต้องมี PRD extension และ acceptance criteria ก่อน implement

## Roadmap Policy
- ไม่มี fixed sprint/date promise ในเอกสารนี้จนประเมิน repo จริง
- checkbox/report จาก agent ไม่ใช่หลักฐานการผ่าน
- pricing หรือ marketing campaign ไม่สามารถเร่ง capability ข้าม gate ได้