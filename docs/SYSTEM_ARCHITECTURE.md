# DocCraft — System Architecture Specification

> **Status:** Authoritative Architecture Contract — Documentation Freeze
> **Version:** 2.0 Reality-Aligned
> **Source of Truth:** Must conform to `PRD.md`
> **Target:** Browser-first V1, backend optional only in post-MVP phases

## 1. Architecture Principles

DocCraft V1 ต้องทำ core loop ได้ครบโดยไม่ login, ไม่ใช้ Supabase และไม่ต้องมี payment gateway credentials

Core runtime:
`Editor State → Domain Validation/Calculation → A4 Preview → Local Persistence → window.print() → native browser print dialog`

หลักสำคัญ:
- UI แยกจาก domain calculation
- calculated totals เป็น derived state ห้ามแก้ตรง
- storage failure ห้ามทำให้ in-memory document หาย
- marketing/commercial feature ห้ามเข้ามาใน V1 architecture หากไม่มีใน PRD

### Locked V1 Runtime & Tooling
- Framework: Next.js 16.3.1 — App Router
- UI runtime: React 19.2.8 / React DOM 19.2.8
- Language: TypeScript 5.9.3, strict mode
- Styling: Tailwind CSS 4.3.3 + explicit print CSS where required
- Package manager: pnpm 11.21.0
- Lint: ESLint 9 + eslint-config-next 16.3.1
- Unit/domain tests: Vitest
- Browser/E2E tests: Playwright 1.62.1
- V1 core loop must remain client/browser-first; no Supabase, auth, payment gateway, or server API is required for Phase 1–6
- No PDF-generation library in V1; printing stays on `window.print()`

Version choices above are pinned from working local toolchains in this repository environment; upgrades require an explicit dependency review rather than silent drift.

## 2. V1 Topology

```text
Browser
├─ Modular Editor UI
├─ Document Domain + Validation
├─ Calculation Engine
├─ A4 Preview / Print Styles
├─ PromptPay Payload Generator
├─ Local Persistence Adapter
└─ JSON Import/Export
```

ไม่มี backend dependency ใน V1
## 3. Domain Boundaries

แยกโมดูลอย่างน้อย:
- `document-domain`: schema, document types, block visibility
- `tax-domain`: entity type, VAT registration, tax-invoice validation
- `calculation`: discounts, VAT, WHT, deposits, rounding
- `promptpay`: identifier validation, EMV payload, CRC
- `persistence`: autosave, schema migration, import/export, quota handling
- `print`: A4 layout and multi-page rules

Tax contract:
- `entityType` และ `vatStatus` เป็นคนละค่า
- tax invoice capability อิง VAT registration + required fields
- VAT rate และ rounding policy ต้องกำหนดจากจุดเดียว
- WHT basis ต้องเลือกเฉพาะรายการที่เกี่ยวข้อง ไม่ใช้ยอดรวมทั้งเอกสารโดยอัตโนมัติ

## 4. Local Persistence

Local persistence เป็น convenience storage ไม่ใช่ durable database

Requirements:
- autosave current draft
- schema version + migration path
- catch quota/security/storage errors
- JSON export ต้องทำได้แม้ local persistence เขียนไม่สำเร็จ
- import ต้อง validate ก่อน replace state
- image pipeline ต้อง resize/compress แล้วตรวจ encoded size จริง; ถ้ายังเกิน limit ต้องลดซ้ำหรือ reject พร้อมข้อความชัดเจน

ห้าม hard-code assumption ว่า browser มี LocalStorage 5MB แน่นอน
## 5. Print Architecture

V1 ใช้ browser native print pipeline (`window.print()` + print CSS) เท่านั้น DocCraft ไม่มี PDF generation engine ใน V1; การเลือก `Save as PDF` เป็นความสามารถของ browser/OS print dialog และอยู่นอกการควบคุม output ของแอป

Reference environment: Chrome/Edge desktop

ต้องมี fixtures สำหรับ:
- 1 หน้า
- 2+ หน้า
- รายการยาว
- ภาษาไทยยาว
- มี/ไม่มีรูป

`break-inside: avoid` เป็น best-effort rule ไม่ใช่ guarantee ว่า pagination จะเหมือนกันทุก browser

## 6. PromptPay Boundary

PromptPay generator ใช้เฉพาะ QR payment instruction บนเอกสารของผู้ใช้
- client-side generation
- optional amount = deposit หรือ net payable ตาม explicit selection
- validate target + amount
- test known payload/CRC vectors

V1 ไม่มี payment confirmation, webhook หรือ paid-status automation

## 7. Post-MVP Backend Boundary

Phase 7+ หลัง PV Gate: Supabase candidate สำหรับ Auth, Postgres, Storage, sync และ RLS
Phase 8+: billing entitlement/backend webhook ต้องออกแบบแยกจาก document PromptPay QR
Phase 9+: E-Sign/public links ต้องผ่าน privacy/security review ก่อน

## 8. Security & Reliability Rules

- ห้าม hard-code credentials
- external/backend secrets ห้ามอยู่ใน client bundle
- imported data ถือเป็น untrusted input
- corrupted data ต้อง fail safely
- backend multi-tenant data ต้อง enforce authorization server-side/RLS
- ทุก phase ต้องมี evidence ก่อนถือว่าผ่าน

## 9. Explicitly Deferred

Supabase sync, auth, subscription billing, E-Sign, Excel reports, AI, inventory, accounting ledger และ e-Tax integration ไม่อยู่ใน V1 architecture