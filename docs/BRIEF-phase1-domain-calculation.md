# DocCraft — Phase 1 Execution Brief

> **Phase:** 1 — Domain Model + Calculation Engine
> **Status:** CLOSED — GATE 1 PASS; Phase 2 not opened
> **Date:** 2026-08-22
> **Repository root:** `D:\AI-Workspace\projects\saas-product-hub\products\DocCraft`
> **Remote:** `https://github.com/Gutumrod/doccraft.git`
> **Source of Truth:** `PRD.md` → `SYSTEM_ARCHITECTURE.md` → `ROADMAP.md` → `IMPLEMENTATION_PLAN.md`

## Objective
สร้าง domain model, validation และ calculation engine ที่ deterministic, testable และไม่ผูกกับ React, browser API, persistence หรือ backend

## In Scope
- canonical `DocCraftDocument` schema + `schemaVersion`
- document types: `quotation`, `invoice`, `receipt`, `work_order`, `tax_invoice`
- `entityType` แยกจาก `vatStatus`
- tax-invoice eligibility validation
- line item arithmetic
- line/document discount
- VAT eligibility + calculation
- WHT basis/rate calculation
- deposit percentage/fixed modes
- net payable
- centralized rounding policy
- structured validation errors/results

## Explicit Non-Scope
- React form/editor UI
- A4 preview / print CSS
- LocalStorage / JSON import-export
- PromptPay QR
- Supabase/Auth/backend/API routes
- billing/subscription/payment verification
- PDF generation
- Phase 2+ capabilities

## Planned Production Paths
สร้างเฉพาะเมื่อ implementation เริ่ม:
- `src/domain/document/types.ts`
- `src/domain/document/schema.ts`
- `src/domain/tax/types.ts`
- `src/domain/tax/validation.ts`
- `src/domain/calculation/types.ts`
- `src/domain/calculation/rounding.ts`
- `src/domain/calculation/calculate.ts`
- `src/domain/validation/result.ts`

ถ้าระหว่าง implementation พบว่า path นี้ขัดกับ framework/tooling จริง ต้องแก้ brief ก่อน ไม่เปลี่ยน silently

## Planned Test Paths
- `tests/domain/document.test.ts`
- `tests/domain/tax-validation.test.ts`
- `tests/domain/calculation.test.ts`
- `tests/domain/rounding.test.ts`

Test runner: Vitest 3.0.5
Type contract: TypeScript 5.9.3 strict

## Domain Invariants
- calculated totals เป็น derived output ห้าม persist เป็น authoritative input
- `entityType` ห้ามใช้ infer VAT registration
- `tax_invoice` valid เฉพาะ VAT registered + required tax fields ครบ
- VAT disabled/non-registered state ต้องไม่เกิด VAT charge
- WHT ต้องคำนวณจาก taxable/service basis ที่ explicit ไม่ใช่ subtotal ทั้งเอกสารโดยอัตโนมัติ
- document discount ต้องลด WHT basis แบบ proportional allocation ตาม PRD ก่อนคำนวณ WHT
- rounding policy ต้องอยู่จุดเดียวและถูกเรียกใช้ทุก calculation path
- pure calculation function ห้าม mutate input

## Required Test Matrix
1. entity type × VAT status ทุก combination
2. tax_invoice locked/unlocked + missing required fields
3. quantity/unit price integer + decimal boundaries
4. line discount และ document discount
5. VAT on/off + ineligible VAT state
6. WHT basis + supported rates + zero basis
7. deposit percentage/fixed/disabled modes
8. discount + VAT + WHT + deposit combined cases
9. rounding edge cases ที่เสี่ยง floating-point drift
10. invalid negative/NaN/non-finite numeric inputs ตาม validation contract
11. input immutability

## Verification Commands
รันจาก `products\DocCraft`:
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

## Phase 1 Gate
PASS ได้เมื่อ:
- domain/calculation tests ผ่านทั้งหมด
- lint/typecheck/test/build exit 0
- production domain modules ไม่มี React/browser/storage/backend imports
- reviewer เทียบ formula และ tax state rules กับ PRD §4–6 โดยตรง
- git diff ไม่มี Phase 2+ scope drift
- implementation evidence ระบุ files changed, commands/results, limitations และ reviewer verdict

ห้ามเปิด Phase 2 จน Gate 1 ได้ `PASS` จากการตรวจไฟล์จริงและ test evidence จริง
