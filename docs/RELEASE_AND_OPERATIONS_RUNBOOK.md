# DocCraft — Release & Operations Runbook

> **Status:** Pre-Launch Release Contract
> **Date:** 2026-08-22
> **Scope:** Free MVP/Public Pilot release; Cloud/paid operations require later extension

## 1. Release Principle
No deployment is considered releasable because build succeeds alone. Release requires code/test evidence, browser smoke tests, scope review and rollback readiness.

### Source-Control Decision
DocCraft target source-control model is a standalone Git repository rooted at `products/DocCraft`. The parent `saas-product-hub` keeps portfolio registry/reference only and should ignore the product working tree after separation.

Before implementation resumes after D0, repository separation must be completed without losing current files/history, or this decision must be explicitly revised through documentation review. Current untracked-in-parent state is not an acceptable long-term release baseline.

## 2. Required Release Pipeline
`Clean scope check → Install → Lint → Typecheck → Unit/Integration → Build → Browser/E2E → Preview verification → Production deploy → Production smoke → Record release`

Required commands must match `package.json`; Phase 6 evidence records exact commands and exit codes.

## 3. Pre-Deploy Gate
- PRD V1 acceptance gates pass
- no unresolved P0/P1 defect
- dependency review shows no accidental backend/PDF engine
- reference Chrome/Edge print matrix passes
- mobile/tablet/desktop core-loop checks pass
- Terms/Data Notice and support contact are publishable
- production configuration contains no secrets in client bundle

## 4. Deployment Contract
Deployment provider/domain are operational choices and are not required for Phase 1–5. Before Public Pilot, record actual provider, production URL, environment variables, build command, deploy command and owner in the release evidence.

Never infer production health from preview/local environment.
## 5. Production Smoke Test
หลัง deploy ต้องตรวจอย่างน้อย:
- home/editor load โดยไม่มี critical console/runtime error
- create representative quotation
- calculation/preview path
- native print action
- refresh restore เมื่อ storage ใช้งานได้
- JSON export/import smoke
- PromptPay block เมื่อ capability ผ่าน Phase 5 แล้ว

## 6. Rollback & Hotfix
ถ้า production มี P0/P1 หลัง release:
1. หยุด promotion/traffic expansion
2. preserve evidence และ release identifier
3. rollback ไป last-known-good เมื่อทำได้ปลอดภัยกว่า hotfix
4. verify production smoke หลัง rollback/hotfix
5. บันทึก cause, impact, fix, prevention

ห้ามแก้ production แบบ unreviewed โดยข้าม source-of-truth contract

## 7. Release Record
ทุก release ต้องเก็บ: version/commit, date, scope, tests, known limitations, supported browser matrix, deployment target, rollback point และ reviewer verdict.

## 8. Operational Readiness Gate
Public Pilot เปิดได้เมื่อ Phase 6 Gate + support/onboarding + data notice + metrics + production smoke พร้อมทั้งหมด

Paid launch ต้องผ่าน `SERVICE_OPERATIONS.md`, `COMMERCIAL_PACKAGING.md` และ `CUSTOMER_LIFECYCLE_AND_BILLING_POLICY.md` เพิ่มเติม
