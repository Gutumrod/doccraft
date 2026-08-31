# BRIEF — DocCraft Sell-Ready Execution

> **Status:** EXECUTION PLAN — NOT LAUNCH AUTHORIZATION
> **Source of truth:** `PRD.md` → `SYSTEM_ARCHITECTURE.md` → `ROADMAP.md` → `IMPLEMENTATION_PLAN.md`
> **Purpose:** พา DocCraft จาก local-first MVP ที่ยังมี gate ค้าง ไปถึง paid commercial launch ที่รับเงินลูกค้าได้อย่างวางใจ โดยไม่ข้าม validation, security, billing หรือ operations

## 1. Sell-ready destination

DocCraft ถือว่า **SELL READY** เมื่อผู้ใช้เป้าหมายสามารถสมัคร ใช้ Pro cloud workflow จ่ายเงิน ต่ออายุ ยกเลิก ส่งออกข้อมูล และขอปิดบัญชีได้จริง โดย:

- Free core loop สร้างเอกสาร → preview → native print ทำงานบน phone/tablet/desktop ตาม PRD;
- real users พิสูจน์ repeat usage และ pain ที่ยอมจ่าย ไม่ใช่แค่ internal/demo usage;
- Auth, cloud sync, tenant isolation, conflict/recovery และ local-to-cloud migration ผ่าน integration/E2E;
- billing provider, entitlement, renewal/failure/grace/cancel/refund/reconciliation ตรงกันทั้ง UI, backend, terms และ operator procedure;
- production deploy, monitoring, rollback, support, privacy, export/deletion และ incident response ถูกทดลองจริง;
- ไม่มี unresolved CRITICAL/HIGH และไม่มี MEDIUM ที่ไม่ได้รับ explicit acceptance;
- paid launch ผ่าน independent review และ owner launch decision.

**SELL READY ไม่เท่ากับ:** build ผ่าน, Free MVP deploy ได้, PromptPay QR บนเอกสารทำงาน หรือมี pricing page. PromptPay document QR เป็นคำสั่งชำระเงินของลูกค้าผู้ใช้ DocCraft ไม่ใช่ระบบเก็บค่าสมาชิก DocCraft.

## 2. Invariants / non-goals

- Free V1 core ต้องไม่ถูกทำให้พิการย้อนหลังเพื่อบังคับขาย Pro.
- Phase 7 ห้ามเปิดก่อน PV Gate มี real-user evidence; Phase 8 ห้ามเปิดก่อน Phase 7 ผ่าน tenant/recovery gates.
- ห้าม lock ราคาสาธารณะจาก hypothesis (`฿290/เดือน`, `฿2,490/ปี`, lifetime) โดยไม่มี validation/cost evidence.
- ห้ามขาย lifetime ก่อนมี cost, entitlement persistence และ discontinuation policy.
- ห้ามอ้าง e-Tax/accounting certification, guaranteed tax correctness หรือ identical PDF across browsers.
- ห้าม deploy/merge/รับเงินจริงจาก brief นี้โดยไม่มี gate และ authorization แยก.

## 3. Execution tickets

### DC-SR-01 — Close Gate 3 with native print evidence

ทดสอบ one-page และ 22-item multi-page fixtures บน native Chrome/Edge; ตรวจ A4 white background, UI leakage, clipping/splitting, Thai text และ Save as PDF availability. ต้องมี fresh screenshots/PDF, browser/OS/build/HEAD และ independent PASS. ห้ามเปิด Phase 4.1 ก่อนผ่าน.

### DC-SR-02 — Implement and close Phase 4.1 Business Logo

ทำตาม approved brief: validated PNG/JPEG/WebP → canonical JPEG/WebP, guards, failed replacement preserves accepted logo, hide/show without deletion, migration, refresh/JSON round-trip, no-logo regression และ A4 print. Gate ต้องรวม unit/E2E/native print, responsive/accessibility/storage failure และ independent review.

### DC-SR-03 — Implement and close Phase 5 PromptPay document QR

เพิ่มเฉพาะ payment instruction: identifier/amount validation, EMV payload/CRC, deposit/net/no-fixed-amount, invalid-state UI และ print-safe QR. ต้องมี known/negative vectors, print regression และ copy guardrail; ห้ามอ้าง payment confirmation หรือ subscription billing.

### DC-SR-04 — Phase 6 MVP hardening and release candidate

พิสูจน์ PRD V1 ทุก gate: document/tax/calculation, responsive core loop, persistence/migration/quota failure, JSON recovery, image/logo, PromptPay, native print, accessibility, dependency/security scan. ต้องมี full static/test/build/E2E/manual matrices, `PHASE6_MVP_IMPLEMENTATION_EVIDENCE.md` และ independent release verdict.

### DC-SR-05 — Production pilot operations

Deploy Free MVP สำหรับ controlled pilot: บันทึก provider/domain/config/owner, monitoring, release/rollback rehearsal, support intake, privacy notice, consented/anonymous metrics และ production smoke สำหรับ create/preview/print/restore/export/import/PromptPay. ห้ามมี secret ใน client bundle.

### DC-SR-06 — Real-user Pilot Validation Gate

เก็บ evidence จาก freelancer/contractor, custom workshop/service shop และ micro-SME: funnel, repeat behavior, support themes, interviews และ willingness-to-pay. ผลต้องตัดสินชัดว่า iterate V1 / open Phase 7 / stop or reposition. Phase 7 เปิดได้เฉพาะ PASS.

### DC-SR-07 — Commercial contract lock

ล็อก package matrix, limits, billing periods, provider, renewal, retry/grace, downgrade/expiry, retention/export/deletion, cancellation, refund/credit, support entitlement, cost model และ legal/tax responsibility ของ DocCraft billing. Lifetime excluded จนกว่าจะผ่าน guardrail.

### DC-SR-08 — Phase 7 Pro Cloud Foundation

ทำ Auth, Supabase schema/RLS, approved sync/history, reusable customer/catalog, local-to-cloud migration, conflict policy, export/deletion และ backup/restore. Gate: clean migration replay, cross-tenant/object authorization negatives, concurrency/conflict, rollback/retry, restore drill และ two-tenant E2E + security review.

### DC-SR-09 — Phase 8 Commercial Billing

ทำ checkout, signed webhook, atomic unique-event claim, explicit processing state, entitlement state machine, retries/lease/dead-letter where applicable, cancellation/refund, audit และ reconciliation. Gate ต้องครอบคลุม duplicate/concurrent/non-consecutive replay (`A → B → A`), out-of-order, succeeded-payment/missing-entitlement, mismatch/outage และ provider-backed sandbox E2E.

### DC-SR-10 — Paid production launch gate

ต้องผ่าน staging-to-production rehearsal, controlled real payment/refund เมื่ออนุมัติ, monitoring/alerts, restore/rollback, support/billing/privacy ownership, public terms/pricing parity, independent code/security/operations review และ owner GO.

## 4. Global verification

ทุก ticket ต้องบันทึก base/HEAD, files, commands/outputs, manual evidence, limitations, diff/security scan, reviewer และ verdict. Environment ที่จำเป็นแต่ไม่มี = `BLOCKED`, ไม่ใช่ PASS. Stateful/external paths ต้องทดสอบ unauthorized, invalid, duplicate, concurrent, delayed และ partial failure ตามความเสี่ยง.

## 5. Immediate next action

ทำ **DC-SR-01 เท่านั้น** ก่อน แล้วเดิน ticket-by-ticket. ห้ามรวม builder, independent review และ launch authorization เป็น self-verdict เดียว.
