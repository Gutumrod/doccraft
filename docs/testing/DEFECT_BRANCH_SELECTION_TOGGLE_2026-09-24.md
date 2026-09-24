# DC01 — Branch Selection Toggle Defect — 2026-09-24

## Reported Defect
Owner found that both `สาขาของสถานประกอบการ` and `สาขาของลูกค้า` could be selected as `สำนักงานใหญ่` or `สาขา`, but an active selection could not be cleared.

## Root Cause
The document model already permits `branchType` to be unset. The two editor sections only set a branch type on click and had no toggle-off path.

## Fix
For both Business and Customer branch controls:
- clicking an inactive choice selects it
- clicking the active choice again clears `branchType`
- clearing a selection also clears `branchNumber` to prevent hidden stale branch data
- selecting `สาขา` again starts with an empty branch number after a clear

Changed files:
- `src/ui/editor/sections/BusinessSection.tsx`
- `src/ui/editor/sections/CustomerSection.tsx`
- `tests/e2e/phase2-editor.spec.ts`

## Verification Before Deploy
- lint: PASS
- typecheck: PASS
- unit: PASS — 154/154
- build: PASS
- E2E: PASS — 86/86 across Chrome + Edge
- new toggle regression: PASS on both browser projects
- dependency audit: PASS — 0 known vulnerabilities
- security boundary selftest: PASS
- `git diff --check`: PASS; line-ending warnings only

## Deployment
- branch: `fix/branch-type-toggle-2026-09-24`
- code commit: `f5f4951`
- production URL: `https://dc01.wstera.com`
- main deployment version: `e84767c8-955f-4562-a159-80fdee44722f`

## Production Defect Probe
- Chrome: `PROD_BRANCH_TOGGLE_PASS`, `PAGE_ERRORS=[]`
- Edge: `PROD_BRANCH_TOGGLE_PASS`, `PAGE_ERRORS=[]`
- both Business and Customer can select → click active choice again → clear
- branch number input hides on clear and reopens empty when `สาขา` is selected again

**Defect verdict: FIXED AND VERIFIED ON PRODUCTION.**

## Separate Finding During Production Smoke
The existing production smoke expects HTTP → HTTPS status `308`, but the live edge currently returns `301 Moved Permanently` to the correct canonical HTTPS URL.

This was observed after deploying only the main DocCraft static app; the HTTP redirect worker/shared edge configuration was not changed by this defect fix.

Status: **OPEN / SEPARATE FROM THIS DEFECT**. Do not silently change shared/House routing from this branch.
