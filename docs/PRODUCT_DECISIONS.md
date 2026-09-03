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
