# DocCraft — Product Decision Records

> This file records product owner (คุณฟรี) decisions that must not be silently changed.
> Each entry is dated, signed off as an owner instruction, and referenced by the evidence
> trail it resolves.

## D-2026-09-03 — Keep the JSON backup UI controls hidden

- **Date:** 2026-09-03
- **Owner instruction:** คุณฟรี (product owner) — recorded by Claude (Commander).
- **Decision:** Option 2 — **KEEP the hide.** The JSON backup UI controls
  (`btn-import-json`, `btn-export-json`, `btn-mobile-export` in `src/ui/editor/DocCraftEditor.tsx`)
  remain hidden, as the owner intentionally ordered.
- **Rationale:** The JSON backup feature is **not in active use**. The owner hid the entry
  points deliberately because the feature is not relied on by customers today.
- **Scope of the decision:** The capability **handler is retained** — code was not deleted,
  only the UI entry points are hidden. JSON Import/Export is therefore **not a V1
  customer-facing backup contract**; it is a capability-held-but-not-exposed, to be surfaced
  in a later phase or as a paid/deferred capability when warranted.
- **Resolves:** `docs/OPEN-FINDING-json-backup-controls-2026-09-03.md` → **RESOLVED**.
- **Documents amended to match shipped reality:** `docs/PRD.md`, `docs/ONBOARDING_AND_SUPPORT.md`,
  additive note in `docs/GATE4_INDEPENDENT_REVIEW_2026-08-26.md`, `docs/CURRENT_STATUS.md`.
- **Residual note:** The JSON export/import schema round-trip and quota-failure behavior remain
  intact in the source and are still exercised by the persistence test suite (E2E drives the
  hidden controls via `dispatchEvent`). No production code, test, price, or commercial claim was
  changed by this decision.
- **Status:** ACTIVE — future work to surface JSON backup must re-enter scope review per
  `ONBOARDING_AND_SUPPORT.md` §6 before the controls are re-exposed.

## D-2026-09-16 — Expand DocCraft toward a Business Document Launcher

- **Date:** 2026-09-16
- **Owner instruction:** คุณฟรี (product owner).
- **Decision:** DocCraft will continue beyond the current five transactional V1 document types toward a **Business Document Launcher / Structured Business Document Studio** for common office and SME documents.
- **Target UX:** `Open DocCraft → choose document → fill structured fields → preview → print / Save as PDF through the browser`.
- **Product boundary:** DocCraft must remain structured-document-first and **must not become a Word clone or blank-page free-form editor as its primary experience**.
- **Expansion direction:** document families may include Sales & Billing, Operations, Purchasing, Office, and HR/Internal Administration. Candidate types include Purchase Order, Delivery Note, Service Report, Purchase Request, Goods Receipt, Memo, Business Letter, Meeting Agenda/Minutes, Leave Request, OT Request, Employee Certificate, expense/reimbursement forms, and asset borrow/return forms.
- **Architecture direction:** future expansion should generalize a document-definition/schema layer and shared reusable blocks instead of implementing unrelated hard-coded editors per template.
- **International direction:** preserve a common DocCraft core and isolate country-specific terminology, tax/payment/legal fields and document conventions into locale/country packs where practical.
- **V1 protection:** this decision does **not** change the current V1 PRD, current five supported document types, PV gate, or existing roadmap gates. Promotion into implementation scope requires an explicit PRD/roadmap extension with acceptance criteria.
- **Canonical direction document:** `docs/PRODUCT_DIRECTION_BUSINESS_DOCUMENT_LAUNCHER.md`.
- **Status:** ACTIVE — approved post-V1 product direction.
