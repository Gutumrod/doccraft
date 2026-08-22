# DocCraft — Phase 2 Execution Brief

> **Phase:** 2 — Editor + Modular Blocks
> **Status:** CLOSED — GATE 2 PASS after independent remediation; Phase 3 not opened
> **Date:** 2026-08-22
> **Repository:** `Gutumrod/doccraft`
> **Local root:** `D:\AI-Workspace\projects\saas-product-hub\products\DocCraft`
> **Branch:** `master`
> **Baseline HEAD:** `205ede9`
> **Source of Truth:** `PRD.md` → `SYSTEM_ARCHITECTURE.md` → `ROADMAP.md` → `IMPLEMENTATION_PLAN.md`
> **Precondition:** D0 PASS + Gate 1 PASS; Phase 1 domain contract is closed except for separately reviewed defect remediation

## 1. Objective
สร้าง client-side document editor ที่ผู้ใช้กรอกข้อมูลธุรกิจ ลูกค้า รายการ และ adjustments ได้ครบ core data-entry loop โดยใช้ canonical `DocCraftDocument` และ Phase 1 calculation/validation เป็น authority เดียวของ business rules.

Phase 2 ต้องทำ responsive editor shell + modular block visibility + live calculation feedback โดยยังไม่สร้าง A4 print engine, persistence, PromptPay payload หรือ backend.

## 2. Current Repo Intake
- `app/page.tsx` ยังเป็น foundation scaffold และยังไม่มี editor
- `app/globals.css` มีเพียง Tailwind import + global baseline
- ไม่มี form/state dependency เพิ่มเติม; เริ่มจาก React built-ins ก่อน
- Phase 1 domain modules อยู่ใต้ `src/domain/**` และ Gate 1 ผ่าน 47/47 tests
- working tree มี D0/Phase 1 evidence/remediation changes ที่ต้องถือเป็น pre-existing baseline; Phase 2 diff ต้องแยกให้ชัด

## 3. In Scope
- replace scaffold home with DocCraft editor application shell
- create initial in-memory `DocCraftDocument` state conforming to Phase 1 schema
- document type selector for all 5 types
- tax-invoice option must be visibly unavailable/blocked until eligibility requirements are satisfied
- business profile editor: entity type, VAT status, display name, tax ID, address, branch type/number
- customer editor: display name, tax ID, address, branch type/number
- repeatable line-item editor: description, quantity, unit price, line discount, add/remove row
- document-level discount controls
- VAT enabled control constrained by VAT registration
- WHT enabled/rate + explicit eligible line selection
- deposit none/percent/fixed controls
- terms and notes fields
- block visibility controls for business/customer/items/item images/adjustments/payment/terms/notes/signatures
- hide/show block must change presentation only and must not erase underlying state
- live totals/error feedback by calling Phase 1 calculation/validation; UI must not duplicate formulas
- desktop >=1024px: editor + live preview shell
- compact <1024px: editor/preview switcher + touch-friendly primary actions
- representative phone 375–430px and tablet 431–1023px behavior

## 4. Explicit Non-Scope
- A4 sizing, pagination, print stylesheet or `window.print()` — Phase 3
- LocalStorage/IndexedDB/autosave/schema migration/JSON import-export — Phase 4
- image compression/persistence pipeline — Phase 4; Phase 2 may show item-image block state only, not persistent upload
- PromptPay identifier/payload/CRC/QR rendering — Phase 5
- Supabase/Auth/backend/API routes/cloud sync — Phase 7+
- subscription billing/payment verification — Phase 8+

- no PDF generation library or server-side document generation
- no quotation→invoice→receipt conversion, Excel reports, E-Sign, inventory or accounting features
- no redesign of Phase 1 tax/calculation formulas unless a real contradiction/defect is found; stop and amend contract before changing domain behavior

## 5. UI / State Invariants
- canonical `DocCraftDocument` remains the source of editor state shape
- calculated totals are derived from `calculateDocument()` and never stored as authoritative editable fields
- `entityType` must never auto-set `vatStatus`
- switching `vatStatus` to `not_registered` must prevent VAT charge; UI may disable VAT but must not invent tax rules
- tax invoice selection must fail closed: user cannot obtain a UI state that visually implies a valid tax invoice when eligibility validation fails
- WHT basis selection must use line-item IDs and remain explicit
- document discount/WHT interaction remains governed by Gate 1 Amendment A1
- hiding any modular block must preserve its data in current in-memory state
- validation errors must be actionable and associated with relevant field/section where possible
- UI must not mutate document state outside React state-update boundaries
- Phase 2 must not rely on browser persistence to complete the editor loop

## 6. Responsive Contract
### Desktop — `>=1024px`
- editor and live preview visible simultaneously
- editor remains usable without horizontal page overflow
- primary actions remain reachable while editing long forms

### Compact — `<1024px`
- explicit Editor / Preview switcher
- no requirement to render desktop split-pane
- touch targets and controls must remain usable at 375px width
- representative tablet widths 431–1023px stay in compact mode, not desktop mode

## 7. Planned Production Paths
Implementation should stay close to these paths unless intake finds a concrete conflict; if structure changes materially, update this brief before coding:
- `app/page.tsx` — route entry only; compose the editor feature
- `app/globals.css` — application/responsive styling only; no Phase 3 print CSS
- `src/ui/editor/DocCraftEditor.tsx` — client editor shell/state owner
- `src/ui/editor/create-initial-document.ts` — create valid in-memory initial document
- `src/ui/editor/editor-state.ts` — pure state-update helpers where useful
- `src/ui/editor/sections/DocumentSection.tsx`
- `src/ui/editor/sections/BusinessSection.tsx`
- `src/ui/editor/sections/CustomerSection.tsx`
- `src/ui/editor/sections/ItemsSection.tsx`
- `src/ui/editor/sections/AdjustmentsSection.tsx`
- `src/ui/editor/sections/TermsNotesSection.tsx`
- `src/ui/editor/BlockVisibilityControls.tsx`
- `src/ui/preview/DocumentPreview.tsx` — live presentation preview only, not A4/print implementation

Components may be consolidated when that reduces needless fragmentation, but domain/UI boundaries must remain explicit.

## 8. Test Strategy
Existing tools only unless a missing capability is proven:
- Vitest for pure editor-state/default-document/update helpers
- existing Phase 1 domain tests remain regression protection
- Playwright for real browser editor flow and responsive behavior

Planned tests:
- `tests/ui/editor-state.test.ts`
- `tests/e2e/phase2-editor.spec.ts`

Do not add Testing Library/jsdom/form-state libraries by default. Any new dependency requires justification in Phase 2 evidence.

## 9. Required Automated Scenarios
### Unit / state integration
1. initial document conforms to current schema version
2. changing entity type does not change VAT status
3. disabling VAT registration prevents VAT-enabled editor state from remaining effective
4. add/remove/update line item preserves unique stable IDs
5. hide/show a block preserves its stored data
6. WHT eligible-line selection uses existing line IDs and cleans references when a line is removed
7. editor state passed to `calculateDocument()` returns expected totals/errors

### Browser / Playwright
1. create/edit a normal quotation from the default state
2. add a second line, apply discount and see live totals update
3. VAT-registered flow can enable VAT and exposes eligible Tax Invoice path
4. non-registered flow cannot present a valid Tax Invoice state
5. WHT eligible-line control changes calculated WHT basis/amount
6. block hide → show preserves the field value entered before hiding
7. 375px phone completes representative editor flow without horizontal blocking overflow
8. representative 768px tablet uses compact Editor/Preview switcher
9. >=1024px desktop renders editor + preview simultaneously

## 10. UX / Accessibility Baseline
- every form control has a visible label or equivalent accessible name
- keyboard interaction must reach core controls in logical order
- errors must not rely on color alone
- disabled controls must explain the condition when the reason is not obvious
- destructive row removal must be deliberate and must not silently remove unrelated state
- empty/default states must be usable without sample business data being mistaken for real user data

## 11. Verification Commands
Run from DocCraft standalone repository root:
- `pnpm test`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- `pnpm test:e2e`

Before and after implementation also record:
- `git status -sb`
- `git log -1 --oneline --decorate`
- `git diff --name-only`
- `git diff --stat`
- dependency/package diff

Phase 1 regression tests must remain green throughout Phase 2.

## 12. Gate 2 — PASS Criteria
Gate 2 may pass only when all are true:
- core business/customer/item/adjustment editor flow works in a real browser
- all 5 document types are represented and Tax Invoice is fail-closed when ineligible
- UI derives totals/errors from Phase 1 domain functions without formula duplication
- block hide/show preserves underlying in-memory data
- line add/remove/update and WHT basis references remain internally consistent
- desktop >=1024px has editor + live preview shell
- phone 375–430px and representative tablet 431–1023px use compact mode and complete the core data-entry loop
- no blocking horizontal overflow at required viewports
- unit/domain tests, typecheck, lint, build and Playwright all pass
- no LocalStorage/print/PromptPay/backend/billing implementation drift
- reviewer inspects actual files, browser behavior and git diff; report-only claims do not count

## 13. Required Phase 2 Evidence
Create `docs/PHASE2_IMPLEMENTATION_EVIDENCE.md` before Gate 2 verdict and record:
- intake repo state and Phase 1 dirty-baseline note
- files changed/created
- dependency changes and justification, including `none` when unchanged
- unit/domain/E2E commands and exact results
- viewport/browser checks performed
- screenshots or concise manual observations when automated assertions cannot prove layout behavior
- known limitations
- scope-drift scan
- final git status/diff summary
- reviewer verdict: `PASS` or `REMEDIATE`

## 14. Stop Conditions
Stop Phase 2 and return to documentation/review if:
- UI requires changing a Phase 1 money/tax invariant rather than consuming it
- implementing requested behavior requires persistence, print engine, PromptPay payload, backend or other later-phase capability
- current document model cannot represent a required V1 editor field without contract change
- responsive acceptance cannot be proven with current layout approach
- a new dependency materially changes architecture or introduces server/backend coupling
- Phase 1 regression tests fail and the cause is not an intentional, reviewed contract amendment

## 15. Phase Boundary
Phase 2 ends at a usable responsive in-memory editor + live presentation preview shell.

A4 fidelity, print pagination, native print behavior and print fixtures remain Phase 3 and must not be pulled forward merely to make the Phase 2 preview look final.

**Phase 3 must not open until independent Gate 2 review returns PASS.**
