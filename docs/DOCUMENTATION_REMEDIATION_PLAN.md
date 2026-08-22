# DocCraft — Documentation Remediation Plan

> **Status:** Historical Remediation Record — current D0 tracked by `DOCUMENTATION_READINESS_INDEX.md`
> **Date:** 2026-08-22
> **Purpose:** Keep all product documents reality-aligned before implementation

## 1. Authoritative Order
1. `PRD.md` — product scope/behavior
2. `SYSTEM_ARCHITECTURE.md` — technical boundaries
3. `ROADMAP.md` — product phases/gates
4. `IMPLEMENTATION_PLAN.md` — implementation execution detail mapped to ROADMAP phases
5. `PRODUCT_VALIDATION_PLAN.md` / `MVP_METRICS_AND_ANALYTICS.md` / `ONBOARDING_AND_SUPPORT.md` / `RELEASE_AND_OPERATIONS_RUNBOOK.md` / `TERMS_PRIVACY_AND_DATA_NOTICE.md` — validation and launch operations
6. `BUSINESS_MODEL.md` / `MONETIZATION_AND_PAYMENT_FLOW.md` / `COMMERCIAL_PACKAGING.md` / `CUSTOMER_LIFECYCLE_AND_BILLING_POLICY.md` / `SERVICE_OPERATIONS.md` — commercial and paid operations
7. `PRODUCT_ONE_PAGER.md` / `SALES_PLAYBOOK.md` — derived messaging

`DOCUMENTATION_READINESS_INDEX.md` เป็น coordination/index สำหรับ D0 และไม่ override ลำดับข้างต้น

เอกสารลำดับล่างห้ามขยาย capability ที่เอกสารลำดับบนยังไม่อนุมัติ

## 2. Remediation Applied
- แยก `entityType` ออกจาก `vatStatus`
- ย้าย E-Sign, cloud, billing, Excel reports ออกจาก V1
- แยก document PromptPay QR ออกจาก DocCraft billing
- ลด LocalStorage เป็น convenience persistence พร้อม failure/backup contract
- เปลี่ยน browser print claim เป็น reference-environment/test-fixture contract
- เปลี่ยน pricing, margin, cost และ growth projections เป็น hypotheses
- แตก roadmap เป็น Phase 0–9 พร้อม gate policy
- เพิ่ม marketing claims guardrail

## 3. Current Product Baseline
V1 = browser-first, no-login document studio

Core loop:
`Document Type → Input → Blocks → Calculation → A4 Preview → Print via native browser dialog`

V1 backup = JSON Import/Export
V1 ไม่มี backend dependency
