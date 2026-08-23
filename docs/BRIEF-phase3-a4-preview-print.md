# DocCraft — Phase 3 Execution Brief

> **Phase:** 3 — A4 Preview + Native Print
> **Status:** RETROACTIVE INTAKE — implementation already existed in the working tree when this brief was written; see Section 0
> **Date:** 2026-08-23
> **Repository:** `Gutumrod/doccraft`
> **Branch:** `master`
> **Baseline HEAD:** `978a197` — `Phase 1 remediation + Phase 2: editor and modular blocks (Gate 2 PASS)`
> **Source of Truth:** `PRD.md` → `SYSTEM_ARCHITECTURE.md` → `ROADMAP.md` → `IMPLEMENTATION_PLAN.md`
> **Precondition:** D0 PASS + Gate 1 PASS + Gate 2 PASS

## 0. Process Note — Read Before Trusting This Document
`DOCUMENTATION_READINESS_INDEX.md` (2026-08-22 revision) states Phase 3 "remains unopened pending explicit intake and brief." That intake/brief step did not happen before implementation started — Phase 3 code (print stylesheet, print actions, A4 preview, representative fixtures, unit + E2E tests) was already present and functionally complete in the working tree before this brief existed.

This document is written **after the fact** to bring the repository back into line with the project's own Phase-1/Phase-2 convention (Brief → Implement → Evidence → Gate Review). It records the scope as implemented, not as originally planned, and should not be read as proof that the pre-implementation intake step was actually followed. `PHASE3_IMPLEMENTATION_EVIDENCE.md` still requires independent human gate review before Gate 3 can be marked PASS — no agent self-report, including this one, satisfies that requirement per `ROADMAP.md`'s own policy ("checkbox/report จาก agent ไม่ใช่หลักฐานการผ่าน").

## 1. Objective
เชื่อม live editor state เข้ากับ A4 portrait preview ที่พิมพ์ออกทาง browser native print pipeline (`window.print()`) ให้สิ่งที่เห็นในหน้าจอกับสิ่งที่ print ออกมาตรงกัน โดยไม่มี PDF generator ของแอปเอง

## 2. Current Repo Intake (as found)
- `src/ui/preview/DocumentPreview.tsx` มี live presentation preview จาก Phase 2 อยู่แล้ว แต่ยังไม่มี A4/print styling
- `app/globals.css` มีเฉพาะ Tailwind import + baseline จาก Phase 2
- ไม่มี print stylesheet, `@page` rule, หรือ `window.print()` call ใดๆ ก่อนหน้านี้
- Phase 2 Gate PASS evidence อยู่ใน `PHASE2_IMPLEMENTATION_EVIDENCE.md`

## 3. In Scope
- A4 portrait preview component/styling แยกจาก editor chrome (`.a4-document-sheet`)
- print stylesheet (`@page`, `@media print`) สำหรับ A4 พร้อม margin
- print action (`window.print()`) เข้าถึงได้จาก desktop header, preview pane, และ mobile bottom bar
- print mode ซ่อน editor/navigation/action controls ทั้งหมด (`.no-print`)
- page-break/pagination rules (`print-avoid-break`, `thead` repeat) สำหรับ content ยาว
- representative fixtures: 1 หน้า, 2+ หน้า (22 items), Thai text ยาว, long customer/address, item images, minimal blocks
- fail-closed printing: บล็อกการพิมพ์เมื่อเอกสารยัง invalid ตาม `calculateDocument()`
- mobile/compact viewport ต้อง force preview ให้แสดงใน print media แม้ active tab จะเป็น editor

## 4. Explicit Non-Scope
- PDF generation library หรือ server-side document generation — ห้ามเด็ดขาดใน V1 ตาม `ROADMAP.md`
- LocalStorage/IndexedDB/autosave/schema migration — Phase 4
- PromptPay identifier/payload/CRC/QR rendering — Phase 5
- Supabase/Auth/backend/API routes/cloud sync — Phase 7+
- quotation→invoice→receipt conversion, Excel reports, E-Sign — Phase 9 candidates only

## 5. Print/UI Invariants
- `DocCraft ไม่ generate PDF เอง` — "Save as PDF" เป็นความสามารถของ browser/OS print dialog เท่านั้น
- print stylesheet ต้องไม่เปลี่ยน calculation formulas หรือ document state
- `handlePrint()` ต้อง fail-closed: ไม่เรียก `window.print()` เมื่อ `calculateDocument()` คืนค่า invalid
- editor chrome (header, nav, forms, mobile bar, validation banners) ต้องถูกซ่อนสมบูรณ์ใน print media
- A4 preview sheet ต้องไม่มี clipping/overlap ที่ทำให้ข้อมูลเอกสารอ่านไม่ได้

## 6. Test Strategy
- Vitest สำหรับ pure calculation ต่อ fixtures (`tests/ui/preview-print.test.ts`)
- Playwright สำหรับ native print invocation, print-media emulation, fixture rendering, responsive print visibility, fail-closed guard (`tests/e2e/phase3-print.spec.ts`)
- Phase 1/2 regression tests ต้องยังผ่านตลอด

## 7. Required Phase 3 Evidence
`docs/PHASE3_IMPLEMENTATION_EVIDENCE.md` ต้องบันทึก:
- files changed/created และ dependency diff (ต้องเป็น `none` สำหรับ PDF/print library)
- unit/domain/E2E ผลจริงจากการรันคำสั่ง ไม่ใช่ copy จาก brief
- reference-environment manual print check บน Chrome/Edge จริง
- known limitations และ scope-drift scan
- reviewer verdict: ต้องมาจาก independent review จริง ไม่ใช่ agent self-declare

## 8. Stop Conditions
- ต้องแก้ Phase 1 formula หรือ Phase 2 state contract เพื่อให้ print ทำงาน
- ต้องเพิ่ม PDF library หรือ server-side rendering
- Phase 1/2 regression tests fail โดยไม่มี reviewed contract amendment

## 9. Phase Boundary
Phase 3 จบที่ A4 preview + native print ที่ทำงานถูกต้องข้าม viewport และ fixture ที่กำหนด **Phase 4 (persistence) ต้องไม่เปิดจนกว่า Gate 3 จะผ่าน independent review จริง — ไม่ใช่แค่ automated test เขียว**
