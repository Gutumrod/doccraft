# DocCraft — Implementation Plan

> **Status:** Phase 2 CLOSED — Gate 2 PASS after independent remediation; Phase 3 pending explicit intake/opening
> **Date:** 2026-08-22
> **Source of Truth:** `PRD.md` → `SYSTEM_ARCHITECTURE.md` → `ROADMAP.md` → `IMPLEMENTATION_PLAN.md`
> **Role:** เอกสารนี้ขยาย execution detail ของ ROADMAP เท่านั้น ห้ามเปลี่ยน product scope, architecture boundary หรือ phase sequencing เอง
> **D0:** PASS — implementation may proceed only under the current phase gate
> **Execution rule:** ทำทีละ Phase; ห้ามเปิด Phase ถัดไปจน Gate ปัจจุบันผ่าน independent review

## 0. Execution Protocol
ก่อนแก้โค้ดทุก Phase ต้องอ่าน repo state จริงก่อน: branch, `git status`, current commit, package manager, dependencies, existing tests และไฟล์ที่เกี่ยวข้อง

ทุก Phase ต้องมี 4 ขั้น:
1. **Intake** — inspect implementation ปัจจุบันและระบุ files/components ที่ Phase จะยุ่งเกี่ยว
2. **Brief** — เขียน execution brief พร้อม scope / non-scope / acceptance criteria ก่อนลงมือ
3. **Implement + Verify** — ทำเฉพาะ scope และรัน automated/manual verification ที่กำหนด
4. **Gate Review** — reviewer ตรวจไฟล์จริง, diff จริง, tests จริง; ห้ามเชื่อรายงาน READY/PASSED อย่างเดียว

กติกา repository:
- ก่อน resume Phase 1 หลัง D0 ต้องแยก `products/DocCraft` เป็น standalone Git repository ตาม `RELEASE_AND_OPERATIONS_RUNBOOK.md`
- ห้าม commit/push อัตโนมัติจนได้รับคำสั่ง
- ห้ามเพิ่ม backend, auth, Supabase หรือ billing ใน Phase 1–6
- ห้ามสร้าง PDF engine; V1 ใช้ `window.print()` เท่านั้น
- ห้ามขยาย capability จาก Business/Sales docs ถ้า PRD ไม่รองรับ
- dependency ใหม่ต้องมีเหตุผลและตรวจว่า browser-first V1 ยังทำงานได้

## R0 — Repository Intake & Build Contract (Pre-Implementation)
**Mapping:** ขั้นนี้ไม่ใช่ ROADMAP Phase 0; ROADMAP Phase 0 = Documentation Contract และปิดก่อนเริ่ม implementation แล้ว

**เป้าหมาย:** ทำให้แผนนี้ผูกกับ repo จริงก่อนเขียน production code
### งาน
- inventory repo structure, existing app/code/tests/config
- ระบุ runtime/framework/package manager จากไฟล์จริง ไม่ assume
- ตรวจ scripts: dev/build/lint/typecheck/test
- ตรวจว่ามี implementation เก่าที่ต้อง preserve/migrate หรือไม่
- สร้าง baseline verification ก่อนเปลี่ยนโค้ด
- map PRD V1 requirements → planned modules/files หลังเห็น repo จริง

### Deliverables
- `R0_REPO_INTAKE.md`
- baseline command/test results
- Phase 1 execution brief ที่อ้าง path จริง

### R0 Gate
- working tree และ baseline state ถูกบันทึก
- stack/build/test contract ถูกยืนยันจาก repo จริง
- ไม่มี unresolved architecture decision ที่ block Phase 1

## Phase 1 — Domain Model + Calculation Engine
**เป้าหมาย:** สร้าง business logic ที่ deterministic และไม่ผูก UI/storage

### งาน
- canonical `DocCraftDocument` schema + `schemaVersion`
- document types: quotation, invoice, receipt, work_order, conditional tax_invoice
- business profile: `entityType` แยกจาก `vatStatus`
- tax-invoice eligibility validation
- line items, quantity, unit price, per-line/document discount ตาม PRD
- VAT, WHT taxable/service basis, deposit และ final payable
- document-level discount allocation ลด WHT basis แบบ proportional ตาม PRD ก่อนคำนวณ WHT
- explicit money rounding policy และ pure calculation pipeline
- validation result/error model ที่ UI เรียกใช้ได้ภายหลัง
### Required Tests
- entity type × VAT status combinations
- tax_invoice locked/unlocked states
- zero/decimal quantity and price boundaries ตาม validation contract
- percent/fixed discounts และ invalid discount
- VAT on/off, WHT basis, deposit modes
- rounding cases ที่ทำให้ floating-point ผิดได้
- calculation ไม่ mutate input state

### Gate 1
- domain/calculation tests ผ่านทั้งหมด
- typecheck/lint/build baseline ไม่ regress
- calculation module ไม่มี React/browser/storage dependency
- reviewer เทียบ formulas กับ PRD โดยตรง

## Phase 2 — Editor + Modular Blocks
**เป้าหมาย:** ผู้ใช้สร้างและแก้เอกสารครบ core data-entry loop

### งาน
- editor state เชื่อม canonical domain model
- business/document/customer/item forms
- document-type selector พร้อม conditional tax_invoice lock
- repeatable line-item editor
- optional blocks ตาม PRD เช่น notes, images, tax/WHT/deposit/payment information
- block visibility ต้องไม่ลบ persisted underlying data
- calculation errors/warnings แสดงตรง field/section ที่เกี่ยวข้อง
- desktop >=1024: editor + live preview shell
- compact <1024: editor/preview switcher + touch-friendly actions

### Gate 2
- phone 375–430px, tablet 431–1023px และ desktop >=1024px ใช้ core loop ได้
- ไม่มี horizontal UI overflow ที่ block การใช้งาน
- hide/show block ไม่ทำข้อมูลหาย
- invalid tax_invoice ไม่สามารถสร้าง output ที่ดู valid ได้
## Phase 3 — A4 Preview + Native Print
**เป้าหมาย:** preview และสิ่งที่ browser ส่งเข้า print pipeline สอดคล้องกัน

### งาน
- A4 portrait preview component แยกจาก editor chrome
- print stylesheet สำหรับ A4
- page-break/pagination rules สำหรับ content ยาว
- fixtures: 1 หน้า, 2+ หน้า, Thai text, long customer/address, long item table, optional images/blocks
- print action ใช้ `window.print()`
- print mode ซ่อน editor/navigation/action controls ทั้งหมด
- reference environment = current supported Chrome/Edge desktop ตาม architecture
- manual check ว่า browser/OS dialog แสดง Save as PDF เมื่อ environment รองรับ โดยไม่ถือเป็น app feature

### Gate 3
- representative fixtures print ไม่มี editor UI รั่ว
- ไม่มี critical clipping/overlap ที่ทำให้ข้อมูลเอกสารหายหรืออ่านไม่ได้
- multi-page content ไม่ตัด row/section แบบเสียความหมายตาม rules ที่กำหนด
- ไม่มี PDF generation dependency/code path ใน V1

## Phase 4 — Local Persistence + JSON Backup
**เป้าหมาย:** ใช้งาน no-login ได้จริงโดย failure ของ storage ไม่ทำลายงานปัจจุบัน

### งาน
- versioned local persistence adapter แยกจาก UI
- autosave + restore current draft
- migration strategy สำหรับ schemaVersion
- storage availability/quota/error detection
- failure state ต้องแจ้งผู้ใช้แต่รักษา in-memory document
- image resize/compression + encoded-size guard ก่อน persistence
- JSON export พร้อม schema/version metadata
- JSON import validation, reject malformed/incompatible payload อย่างปลอดภัย
### Gate 4
- refresh restore ผ่านเมื่อ storage ใช้งานได้
- storage unavailable/quota failure ไม่ทำ current in-memory document หาย
- export → clear → import round-trip ได้ข้อมูลเทียบเท่าต้นฉบับ
- corrupted/unknown schema import ถูก reject พร้อม actionable error
- ไม่มี hard-coded browser quota assumption

## Phase 5 — PromptPay QR on Document
**เป้าหมาย:** เพิ่ม payment instruction ในเอกสาร โดยไม่สร้าง payment collection/billing system

### งาน
- PromptPay target validation ตามชนิด identifier ที่ PRD อนุญาต
- EMV payload builder + CRC
- amount source modes: deposit / net payable / no fixed amount
- QR rendering เป็น presentation ของ validated payload
- invalid target/amount ต้องไม่ render QR ที่ดูใช้งานได้
- แยก module นี้จาก future DocCraft subscription billing อย่างเด็ดขาด

### Gate 5
- known payload/CRC test vectors ผ่าน
- amount mode ทุกแบบผ่าน
- invalid identifier/amount ถูก reject
- QR block print ได้โดยไม่แตก layout

## Phase 6 — MVP Integration, Hardening & Release Candidate
**เป้าหมาย:** พิสูจน์ V1 ทั้งระบบตาม PRD โดยไม่พึ่ง backend/login

### E2E Scenarios
1. quotation ปกติ → calculation → preview → print
2. VAT-registered tax_invoice valid flow
3. invalid tax_invoice blocked flow
4. WHT + deposit + PromptPay document QR
5. long multi-page Thai document
6. refresh restore → JSON export/import recovery
7. storage failure while continuing current document
8. phone/tablet/desktop core loop
### Release Verification
- automated unit/integration tests
- lint + typecheck + production build
- reference-browser manual print matrix
- responsive manual/E2E matrix
- dependency review: ไม่มี accidental backend/PDF engine
- git diff/scope-drift review
- cross-check implementation กับ PRD Acceptance Gates ทุกข้อ

### Gate 6 — MVP Release Gate
MVP ผ่านได้เมื่อ:
- PRD V1 acceptance gates ผ่านครบพร้อม evidence
- ไม่มี unresolved P0/P1 defect
- no-login/no-backend smoke test ผ่าน
- reviewer ตรวจ implementation/diff/test evidence จริง
- สร้าง `PHASE6_MVP_IMPLEMENTATION_EVIDENCE.md` และ release runbook แล้ว

## PV — Pilot Validation & Operational Readiness Gate
Phase 7 ห้ามเปิดจน Phase 6 ผ่านและ `PRODUCT_VALIDATION_PLAN.md` มี real-user evidence พร้อม operational readiness ตาม `MVP_METRICS_AND_ANALYTICS.md`, `ONBOARDING_AND_SUPPORT.md`, `RELEASE_AND_OPERATIONS_RUNBOOK.md` และ `TERMS_PRIVACY_AND_DATA_NOTICE.md`.

**Gate:** repeat usage + recurring cloud/history/reusable-data pain มี evidence เพียงพอที่จะ justify Phase 7; ถ้าไม่ผ่านให้ iterate V1 โดยไม่เปิด Cloud.

## Phase 7 — Pro Cloud Foundation (หลัง PV Gate เท่านั้น)
Auth + Supabase/RLS + document sync + reusable customers/catalog + local-to-cloud migration + conflict/recovery policy

**Gate:** tenant isolation, migration, conflict และ recovery integration tests ผ่าน

## Phase 8 — Commercial Billing (หลัง Phase 7)
entitlement + recurring payment rail ที่รองรับจริง + webhook idempotency/reconciliation + configurable pricing

**Gate:** billing lifecycle และ entitlement transitions ผ่าน integration tests

## Phase 9 — Validated Post-MVP Capabilities
quotation→invoice→receipt conversion, Excel/monthly reports, templates/themes, E-Sign/public links เฉพาะรายการที่ผ่าน product validation และมี PRD extension ก่อน

## Required Evidence Per Phase
ทุก Phase ต้องทิ้งหลักฐานอย่างน้อย: files changed, commands/tests run, results, manual checks, known limitations, git diff summary และ reviewer verdict (`PASS` / `REMEDIATE`).

## Stop Conditions
หยุด Phase ทันทีถ้าพบ contradiction ใหม่ใน Source of Truth, ต้องเปลี่ยน architecture หลัก, scope ต้องข้าม Phase, หรือ test ไม่สามารถพิสูจน์ acceptance criterion ได้ — ต้องแก้เอกสาร/brief และ review ใหม่ก่อนทำต่อ
