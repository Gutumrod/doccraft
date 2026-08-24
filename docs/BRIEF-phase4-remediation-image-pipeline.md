# DocCraft — Phase 4 Remediation Brief: Item Image Persistence Pipeline

> **Phase:** 4 Remediation — Local Persistence + Image Guard
> **Status:** READY FOR REMEDIATION IMPLEMENTATION
> **Date:** 2026-08-24
> **Repository:** `Gutumrod/doccraft`
> **Branch:** `master`
> **Baseline HEAD:** `c9f8f0b` before documentation-only review commit
> **Trigger:** `GATE_REVIEW_PHASE3_PHASE4_2026-08-24.md`
> **Source of Truth:** `PRD.md` → `SYSTEM_ARCHITECTURE.md` → `ROADMAP.md` → `IMPLEMENTATION_PLAN.md`

## 1. Objective
Close the only identified Phase 4 scope defect: implement the V1 item-image client-side persistence pipeline required by the authoritative contracts without introducing backend storage or changing unrelated domain/calculation behavior.

## 2. Required Behavior
- User can attach an image to an item only through the existing optional item-image capability.
- Image input must be processed client-side before persistence.
- Decode/resize to a bounded working dimension appropriate for document thumbnails/print presentation.
- Compress to an encoded browser-safe format supported by the implementation.
- Measure the **encoded persisted representation**, not only source file bytes.
- If encoded size is above the defined per-image guard, retry reduction within bounded attempts or reject.
- Rejection must surface an actionable user-facing error and preserve current in-memory document state.
- Autosave/restore and JSON export/import must preserve accepted image data according to the chosen schema representation.
- Storage quota failure must continue to fail safely as Phase 4 currently does.

## 3. Architecture Constraints
- Browser-first only; no Supabase, API route, cloud storage, auth, or server image processing.
- No PDF-generation dependency.
- Do not alter Phase 1 calculation formulas or tax rules.
- Do not silently broaden document schema. Any schema change required to persist image data must be explicit, versioned, migration-safe, and reviewed before implementation.
- Keep image processing isolated from calculation/domain logic where possible.
- Do not assume a fixed browser LocalStorage quota.
- Never hard-code credentials or external service keys.

## 4. Intake Before Coding
The implementer must inspect the actual current representation of:
- `DocCraftDocument` and `LineItem`
- `BlockVisibility.itemImages`
- `DocumentPreview` item-image presentation
- editor line-item controls
- persistence validator/migration/export envelope
- existing Phase 4 unit and E2E tests

If accepted image persistence cannot be represented without changing the canonical schema, stop and document the minimum schema amendment before coding. Do not hide the change inside UI state.

## 5. Required Tests
- valid image input is resized/compressed before persistence
- encoded-size guard accepts a normal image
- oversized image is reduced within bounded attempts or rejected safely
- unsupported/corrupted image input is rejected without state loss
- autosave → refresh restores accepted image
- JSON export → import preserves accepted image
- storage quota failure with image data preserves current editor state and export path
- existing 92 unit tests and Phase 2–4 E2E regression remain green
- print mode renders accepted item image without editor controls or critical layout overflow

## 6. Gate 4 Remediation Acceptance
Gate 4 may return to review only when:
- image resize/compression/encoded-size guard is implemented against the reviewed representation
- persistence/import/export behavior is covered by tests
- storage failure still preserves in-memory work
- no backend/cloud/PDF scope drift is introduced
- unit, typecheck, lint, build, and Playwright E2E pass in a runnable browser environment
- `PHASE4_IMPLEMENTATION_EVIDENCE.md` receives a remediation addendum with exact files, commands, results, limitations, and diff summary

## 7. Explicit Non-Scope
- image hosting/CDN
- reusable product image library
- cloud sync
- OCR or AI image processing
- document template/theme expansion
- PromptPay QR implementation
- billing/payment confirmation

## 8. Stop Conditions
Stop remediation and return to documentation review if:
- the required image representation forces an incompatible schema change without a migration path
- browser storage behavior would require a fixed quota assumption
- implementation requires backend/cloud storage to satisfy V1
- Phase 1 calculation or tax contracts would need modification

## 9. Handoff
After remediation implementation and evidence are complete, rerun independent Gate 4 review. Phase 5 remains implementation-blocked until Gate 3 and Gate 4 are both PASS.
