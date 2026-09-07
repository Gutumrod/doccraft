# DocCraft — Release & Operations Runbook

> **Status:** Pre-Launch Release Contract
> **Date:** 2026-08-22
> **Scope:** Free MVP/Public Pilot release; Cloud/paid operations require later extension

## 1. Release Principle
No deployment is considered releasable because build succeeds alone. Release requires code/test evidence, browser smoke tests, scope review and rollback readiness.

### Source-Control Decision
DocCraft uses a standalone Git repository rooted at `products/DocCraft`. The parent `saas-product-hub` keeps portfolio registry/reference only and ignores the product working tree.

Repository separation was verified on 2026-08-22: local Git root resolves to `products/DocCraft`, `origin` points to `https://github.com/Gutumrod/doccraft.git`, `master` tracks `origin/master`, and the parent hub ignores `/products/DocCraft/`.

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

## 9. Phase 6 Public Pilot Release Candidate Record — 2026-09-07

Production target:
- provider: Cloudflare Workers static assets
- worker: `wstera-dc01`
- URL: `https://dc01.wstera.com`
- build: `pnpm build`
- deploy: `pnpm build && pnpm dlx wrangler@4.129.0 deploy`
- runtime bindings: none

Verification at release-candidate preparation:
- lint PASS
- typecheck PASS
- unit 147/147 PASS
- Chrome E2E 42/42 PASS
- Microsoft Edge E2E 42/42 PASS
- production smoke PASS in Chrome + Edge
- native production print evidence captured in Chrome + Edge
- `git diff --check` PASS

Rollback evidence:
- known-good hardened version: `d0b116fb-84c9-42e7-b15b-122eb1762b55`
- identical probe version: `468d1a08-cc06-472a-99aa-249db918344f`
- real Wrangler rollback restored known-good version to 100% traffic
- subsequent production HTTP check returned 200

Gate 6 closure — 2026-09-07: **PASS / CLOSED** after independent review of implementation checkpoint `01115cc908adcbc4224d3d7878f8680da287439e`. Canonical verdict: `GATE6_INDEPENDENT_REVIEW_2026-09-07.md`. Next authorized stage is Public Pilot / PV Gate; Phase 7 remains frozen until PV Gate = PASS.
