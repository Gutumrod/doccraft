# DocCraft — Phase 1 Implementation Evidence

> **Phase:** 1 — Domain Model + Calculation Engine
> **Date:** 2026-08-22
> **Verdict:** GATE 1 PASS
> **Repository:** `Gutumrod/doccraft`
> **Local root:** `D:\AI-Workspace\projects\saas-product-hub\products\DocCraft`
> **Branch:** `master`
> **Baseline HEAD:** `205ede9` — `Initial commit: DocCraft product scaffold`

## 1. Gate Preconditions
D0 Documentation Gate was independently rerun against current files and standalone-repository state and returned PASS.

Repository separation verified: local Git root is DocCraft, `origin` is `https://github.com/Gutumrod/doccraft.git`, `master` tracks `origin/master`, and the parent hub ignores `/products/DocCraft/`.

Phase 2 remained closed throughout this remediation/review.

## 2. Phase 1 Production Scope
Verified production domain files:
- `src/domain/document/types.ts`
- `src/domain/document/schema.ts`
- `src/domain/tax/types.ts`
- `src/domain/tax/validation.ts`
- `src/domain/calculation/types.ts`
- `src/domain/calculation/rounding.ts`
- `src/domain/calculation/calculate.ts`
- `src/domain/validation/result.ts`

## 3. Verified Domain Contracts
- canonical `DocCraftDocument` + `schemaVersion`
- 5 document types: quotation, invoice, receipt, work_order, tax_invoice
- `entityType` and `vatStatus` are independent dimensions
- Tax Invoice requires VAT registration, VAT enabled, tax ID, branch type, and branch number when branch
- line base = quantity × unit price
- line discount before subtotal; document discount after subtotal
- VAT uses centralized `VAT_RATE_PERCENT = 7` and only charges when enabled + VAT registered
- WHT uses explicit eligible line IDs, never implicit full-document basis
- disabled WHT ignores stale rate/basis configuration
- document discount reduces WHT basis proportionally using `eligible line totals × amountAfterDiscount ÷ subtotal`
- deposit supports none/percent/fixed and cannot exceed net payable
- monetary rounding is centralized at 2 decimal places
- calculation is pure and input immutability is tested

### Gate-review hardening
The original remediation only fixed a stale disabled-WHT test expectation. A deeper Gate 1 formula review then found one PRD ambiguity: document-level discount allocation into WHT basis.

The authoritative contract was amended (D0 Amendment A1) and implementation/tests were aligned to proportional allocation. This changes money output deterministically without expanding Phase 1 scope.

External sanity check: Thailand Revenue Department material current in August 2026 confirms VAT remains 7%; this is not a legal/tax compliance certification and future rate changes still require explicit domain review.

## 4. Test Coverage
Test files:
- `tests/domain/document.test.ts`
- `tests/domain/tax-validation.test.ts`
- `tests/domain/calculation.test.ts`
- `tests/domain/rounding.test.ts`
- `tests/domain/helpers.ts`
- scaffold baseline test remains present

## 5. Final Verification Results
Executed from standalone DocCraft repository root:
- `pnpm test` → PASS, 5 test files, **47/47 tests passed**
- `pnpm typecheck` → PASS, exit 0
- `pnpm lint` → PASS, exit 0
- `pnpm build` → PASS, exit 0; Next.js 16.3.1 production build completed
- forbidden domain scan (`react|next|@supabase|localStorage|window.|navigator.`) → **NO_FORBIDDEN_TOKENS**
- Phase 2 path-drift scan → **NO_PHASE2_PATH_DRIFT**

## 6. Scope / Diff Review
Current remediation changes are limited to documentation state/evidence, WHT-basis contract clarification, `src/domain/calculation/calculate.ts`, and `tests/domain/calculation.test.ts`.

No editor/UI, persistence, print, PromptPay, Supabase/Auth/backend, billing, or Phase 2 implementation was added.

The standalone initial commit already contains the pre-existing Phase 1 snapshot, so the current diff does not represent the full historical implementation. Gate review inspected the actual tracked Phase 1 files directly, not only `git diff`.

Git on Windows reported LF→CRLF working-copy warnings; these were not functional failures.

## 7. Known Boundaries
- DocCraft remains a document tool, not legal/tax compliance certification.
- WHT applicability/rate selection remains explicit user/domain input; Phase 1 does not infer every statutory WHT case.
- VAT rate is centralized so future statutory changes can be reviewed in one domain location.
- No Phase 2 behavior is accepted by this gate.

## 8. Reviewer Verdict
**GATE 1 PASS.** Phase 1 satisfies the current PRD, Architecture, Implementation Plan and Phase 1 brief, including D0 Amendment A1.

Phase 1 is closed. Phase 2 remains unopened until explicitly released under a new Phase 2 intake/brief.

No commit or push was performed during this remediation/review pass.
