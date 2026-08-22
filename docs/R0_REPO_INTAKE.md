# DocCraft — R0 Repository Intake

> **Status:** Historical R0 PASS snapshot — repository foundation verified; current implementation remains frozen by D0
> **Date:** 2026-08-22
> **Repository root:** `D:\AI-Workspace\projects\saas-product-hub`
> **Product path:** `products\DocCraft`

## 1. Ground Truth
`products\DocCraft` is not a standalone Git repository. `git rev-parse --show-toplevel` resolves to the parent monorepo `saas-product-hub`.

Current Git state observed from the product path:
- branch: `master`
- upstream: `origin/master`
- local branch: ahead by 1 commit
- HEAD: `8ef8364 docs(roadmap): backfill reasoning for the 2026-08-21 admission reorder`
- existing unrelated working-tree changes are present in platform docs/registry
- `products\DocCraft` itself is currently untracked from the monorepo perspective

## 2. Product Files Present
At initial intake DocCraft contained only `docs/`. R0 remediation created the minimal scaffold: `app/`, `tests/`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, Next/TypeScript/Tailwind/ESLint/Vitest/Playwright configs and product `.gitignore`.

No Phase 1 business/domain logic has been implemented yet.

## 3. Portfolio Registration
Initial intake found no DocCraft entry. R0 remediation added `key: "doccraft"` with `path: "products/DocCraft"`, `commercial_status: "prototype"`, architecture=true and operations/commercial/support=false.

## 4. Runtime / Tooling Contract
`SYSTEM_ARCHITECTURE.md` now explicitly locks Next.js 16.3.1, React 19.2.8, TypeScript 5.9.3 strict, Tailwind CSS 4.3.3, pnpm 11.21.0, ESLint 9 + eslint-config-next 16.3.1, Vitest 3.0.5 and Playwright 1.62.1.

The V1 contract still forbids backend/Auth/Supabase/payment/PDF-engine dependencies for Phase 1–6 core behavior.

## 5. Preserve / Migration Assessment
No existing DocCraft application code exists, so there is no product code to preserve or migrate at R0.

The assets that must be preserved are the documentation contracts, especially:
`PRD.md` → `SYSTEM_ARCHITECTURE.md` → `ROADMAP.md` → `IMPLEMENTATION_PLAN.md`.

## 6. R0 Remediation Result
Resolved:
1. runtime/tooling contract locked in `SYSTEM_ARCHITECTURE.md`;
2. minimal executable scaffold created;
3. DocCraft registered in `docs/products/registry.yaml`;
4. baseline commands established and verified.

Parent repo remains intentionally dirty from unrelated pre-existing work. This is recorded as a scope-control caution, not a Phase 1 blocker; no commit/push may mix unrelated changes.

## 7. Baseline Verification Evidence
- `pnpm install` → PASS after explicitly allowing only `esbuild` and `unrs-resolver` build scripts via pnpm 11 `allowBuilds`
- `pnpm lint` → EXIT 0
- `pnpm typecheck` → EXIT 0
- `pnpm test` → EXIT 0; scaffold test 1/1 passed
- `pnpm build` → EXIT 0; Next.js 16.3.1 production build completed and `/` prerendered statically
- Phase 1 brief created at `docs/BRIEF-phase1-domain-calculation.md`

## 8. R0 Verdict — Historical
**PASS at R0 time.** Repository foundation was executable and verified, so Phase 1 was eligible to open under `BRIEF-phase1-domain-calculation.md`.

Phase 1 implementation subsequently began. The current D0 Documentation Freeze supersedes that earlier permission: no further production-code changes may occur until D0 passes and repository separation is completed.
