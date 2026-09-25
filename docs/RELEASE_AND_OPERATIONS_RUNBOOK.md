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

## 10. Public Pilot Security Hardening Amendment — 2026-09-08

Security implementation checkpoint: `fb34f055180015124ac190c36f5728dd681d21f0`.

Current production security deployment:
- Worker: `wstera-dc01`
- version: `722b573b-8dbb-4a50-b1ea-d880f6a03a5b`
- runtime binding: `ASSETS`
- `run_worker_first: true`, so application and static asset paths pass through the security gateway
- HTTP is redirected with `308` to the same HTTPS path/query
- gateway accepts only GET/HEAD; other methods return `405`
- HSTS/CSP/anti-framing/noindex and related response headers are applied at the edge

Verification:
- lint / typecheck / build PASS
- unit 150/150 PASS
- Chromium 42/42 PASS
- Microsoft Edge 42/42 PASS
- full dependency audit: no known vulnerabilities
- production smoke PASS in Chrome + Edge
- HTTP root and static asset probes both return `308` to HTTPS
- sensitive source/config probes return `404`

Immediate pre-final-gateway version `01c4d9d4-45ab-4050-9b87-f789ed386077` is retained as an availability rollback point, but reintroduces the known HTTP static-asset residual and is not the preferred steady-state security posture.

Canonical evidence: `PUBLIC_PILOT_SECURITY_READINESS_2026-09-08.md`. Adversarial/destructive validation is the next security activity before onboarding `PILOT-001`.

## 11. Public Hostname Migration Amendment — 2026-09-25

Canonical host ตาม policy `<public_slug>.wstera.com`: **`https://doccraft.wstera.com`** — `DC01` ยังเป็น internal code เหมือนเดิม
หลักฐานเต็ม: `docs/HOSTNAME_MIGRATION_DOCCRAFT_2026-09-25.md`

Runtime ปัจจุบัน:
- Worker `wstera-dc01` (static assets, ไม่มี Worker script บน HTTPS) — custom domains: `doccraft.wstera.com` (canonical) + `dc01.wstera.com` (legacy compatibility)
- Worker `wstera-dc01-http-redirect` — routes `http://doccraft.wstera.com/*` + `http://dc01.wstera.com/*`; upgrade เป็น HTTPS บน host เดิม (ไม่ redirect ข้าม host)
- HTTP ที่ live จริงตอนนี้ตอบ `301` จาก zone edge ก่อนถึง Worker route — gap `301`/`308` เป็น finding แยก ยังไม่ปิด

Legacy `dc01.wstera.com`:
- เสิร์ฟ app ตัวเดียวกันต่อ (dual-serve) จนกว่าจะมี disposition/sunset ที่ Owner อนุมัติ
- **ห้าม redirect `dc01` → `doccraft` แบบ blind:** draft อยู่ใน `localStorage` ของแต่ละ origin ผู้ใช้เดิมจะไม่เห็น draft บน host ใหม่ ต้องมีแผนย้ายข้อมูล (JSON backup export/import) + แจ้งผู้ใช้ก่อน
- ห้ามถอด custom domain `dc01.wstera.com` จนกว่าจะปิด migration อย่างเป็นทางการ

Production smoke:
- canonical: `pnpm smoke:prod` (default `https://doccraft.wstera.com`)
- legacy: `DC01_URL=https://dc01.wstera.com pnpm smoke:prod`
- `DC01_SMOKE_SKIP_HTTP_TRANSPORT=1` ข้ามเฉพาะ assert HTTP→`308` แบบประกาศชัด (พิมพ์ `TRANSPORT_ASSERT_SKIPPED observed=<status>` และผลเป็น `PRODUCTION_SMOKE_APP_PASS_TRANSPORT_SKIPPED` ไม่ใช่ `PRODUCTION_SMOKE_PASS`)
- adversarial probes รับ `DC01_URL` เหมือนกัน (default canonical)

Rollback (ไม่เสีย branch-toggle/security fix):
- main: `wrangler rollback e84767c8-955f-4562-a159-80fdee44722f --name wstera-dc01` — version ก่อน migration (asset ชุดเดียวกัน แต่ custom domain เป็น trigger แยกจาก version: ถ้าจะถอด `doccraft.wstera.com` ต้อง deploy config ที่ไม่มี route นั้น)
- redirect: `wrangler rollback 8d271814-327b-48b7-9ba6-3b314f9b6aa0 --name wstera-dc01-http-redirect` + ถอด route `http://doccraft.wstera.com/*` ถ้าต้องการ
