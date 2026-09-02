# DocCraft — Gate 3 Native Print Acceptance — 2026-09-01

> **Status:** MANUAL MATRIX PASS — AWAITING INDEPENDENT HUMAN GATE VERDICT
> **Phase:** 3 — A4 Preview + Native Print
> **Branch:** `master`
> **Baseline HEAD:** `1b4be25` (`docs: add sell-ready execution plan`)
> **Environment:** Windows 11 Pro 10.0.26200 build 26200; Google Chrome 152.0.7977.65
> **Rule:** This record does not self-declare Gate 3 PASS because the remediation builder and final independent reviewer must remain separate.

## 1. Native-print defect found

Fresh Chrome native Print Preview on the representative `one-page` fixture exposed a real pagination defect: the fixture rendered as `2 sheets` / `1/2` even though it is the one-page reference case.

Evidence before remediation:
- `docs/evidence/GATE3_ONE_PAGE_NATIVE_PRINT_2026-09-01.png`
- physical A4 background was white;
- editor/application controls did not leak into print;
- pagination was wrong: the reference one-page document spilled to page 2.

Root cause measured in print media: the document preview was about 1288 CSS px high because screen-oriented spacing and padding (`mb-8`, card padding, table row padding, signature spacing) were reused unchanged in print.

## 2. Scoped remediation

The fix is print-only and does not change screen layout or document calculations:
- compact print spacing/padding for document header, customer/payment cards, item table, totals, terms/notes and signatures;
- semantic print classes added to `DocumentPreview.tsx`;
- Phase 3 E2E now asserts the representative one-page fixture stays within a conservative 1000 px print-height budget.

Remediation files:
- `app/globals.css`
- `src/ui/preview/DocumentPreview.tsx`
- `tests/e2e/phase3-print.spec.ts`

## 3. Fresh native acceptance matrix

### Representative one-page fixture
- Chrome native Print Preview reports `1 sheet` and footer `1/1` after remediation.
- All business/customer/items/totals/payment/terms/notes/signature content remains on the physical page.
- White A4 background confirmed; no editor UI leakage or critical clipping observed.
- Evidence: `docs/evidence/GATE3_ONE_PAGE_NATIVE_PRINT_2026-09-01_FIXED.png`.

### Representative 22-item multi-page fixture
- Chrome native Print Preview reports `3 sheets`.
- Page 1 contains rows 1–10 without a row split at the page boundary.
- Page 2 continues through row 22 and totals without a meaningful row split or critical clipping.
- Page 3 contains payment, terms, notes and signatures intact.
- White A4 background and no editor/application UI leakage confirmed across inspected pages.
- Evidence: `docs/evidence/GATE3_MULTI_PAGE_NATIVE_PRINT_2026-09-01_P1.png`, `P2.png`, `P3.png`.

PDF-capable destinations installed in the verified environment: `Microsoft Print to PDF` and `PDF-XChange Lite`.

## 4. Fresh automated verification after remediation

- `pnpm test` → PASS, 118/118 across 10 test files.
- `pnpm typecheck` → PASS.
- `pnpm lint` → PASS.
- `pnpm build` → PASS on Next.js 16.3.1.
- `pnpm test:e2e` → PASS, 33/33 Playwright Chromium scenarios.
- `git diff --check` → PASS; line-ending warnings only.

The first E2E attempt after the Windows reinstall was environment-blocked because the Playwright Chromium runtime was missing. `pnpm exec playwright install chromium` restored the test environment; the full 33/33 rerun then passed.

## 5. Working-tree boundary

The verified working tree also contains pre-existing Codex changes outside this Gate 3 remediation:
- `src/ui/editor/DocCraftEditor.tsx`
- `tests/e2e/phase4-item-images.spec.ts`
- `tests/e2e/phase4-persistence.spec.ts`

Those changes hide JSON backup controls from the standard UI and adapt E2E access to the hidden controls. They were preserved and included in the full regression run, but they are not claimed as part of the Gate 3 print fix.

`next-env.d.ts` was previously modified by Next.js generation after the Windows reinstall; the current final working tree no longer reports it as modified.

## 6. Gate disposition

The technical closure criteria that previously blocked Gate 3 are now evidenced on the current working tree: representative one-page native print, 22-item multi-page native print, white physical-page background, no editor leakage, no observed critical clipping/meaningful row split, PDF-capable destination availability, and green automated regression.

**Current disposition: READY FOR INDEPENDENT FINAL REVIEW. Gate 3 is not self-declared PASS by this remediation session.**

Required final action: a separate human reviewer must inspect this record, the actual diff and the native-print screenshots and then record `PASS` or `REMEDIATE`. Phase 4.1 remains unopened until that separate verdict is recorded.
