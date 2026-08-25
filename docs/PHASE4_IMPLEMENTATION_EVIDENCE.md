# DocCraft — Phase 4 Implementation Evidence

> **Phase:** 4 — Local Persistence + JSON Backup  
> **Date:** 2026-08-23  
> **Verdict:** NOT YET GATE-REVIEWED — automated checks pass; independent human review is still required before Gate 4 can be marked PASS. See Section 0.  
> **Repository:** `Gutumrod/doccraft`  
> **GitHub:** `Gutumrod/doccraft`  
> **Branch:** `master`  
> **Baseline HEAD:** `2b2fa80` — `Phase 3: A4 preview + native print (Gate 3 evidence recorded, review pending)`  
> **Preconditions:** Phase 1 Gate 1 PASS + Phase 2 Gate 2 PASS + Phase 3 — implementation complete, automated checks pass, **Gate 3 review still pending** (see `PHASE3_IMPLEMENTATION_EVIDENCE.md`). Phase 4 was opened before Gate 3 completed independent review; per the user this was a deliberate, directed decision, not an oversight, but it is a real deviation from `IMPLEMENTATION_PLAN.md`'s stated sequencing rule ("ห้ามเปิด Phase ถัดไปจน Gate ปัจจุบันผ่าน independent review") and should be visible here rather than papered over.  

---

## 0. Provenance Note
This document's Sections 1–8 were originally authored by an automated agent process that self-declared "GATE 4 VERDICT: PASS" and listed "Phase 3 PASS" as a satisfied precondition. Neither was accurate: no independent human review had occurred for Gate 4, and Phase 3 itself is still awaiting independent review (see `PHASE3_IMPLEMENTATION_EVIDENCE.md` Section 0 for the same issue found and corrected there). Per `ROADMAP.md`'s own policy — "checkbox/report จาก agent ไม่ใช่หลักฐานการผ่าน" — those claims are corrected here. The technical claims in Sections 2–7 (files, test counts, failure-mode matrix) were independently re-verified on 2026-08-23 by re-running every command fresh against the actual working tree: 92/92 unit tests, 29/29 Playwright E2E, clean typecheck/lint/build — all confirmed to match.

## 1. Executive Summary & Remediation Architecture

Phase 4 establishes a robust, client-side, local-first persistence and backup architecture for DocCraft V1.

### Structural vs. Domain Validation Architecture:
1. **Structural Validation (Persistence & Backup Layer):**
   - Pure type, shape, enum, version, envelope, and metadata safety.
   - Preserves all type-correct editable states created during in-progress user editing:
     - `documentNumber`: requires string type (allows empty string `""`).
     - `issueDate`: requires string type (allows empty string `""`).
     - `dueDate`: requires string type when defined (allows empty string `""`).
     - `items`: requires array type with structurally valid line items.
     - Numeric fields (`quantity`, `unitPrice`, `discount.value`, `deposit.value`, `wht.ratePercent`): requires finite `number` type.
     - Internal identity/referential invariants are enforced for untrusted restore/import: at least one line item, unique line-item IDs, and WHT basis IDs must be unique references to existing line items.
     - In-progress drafts with empty fields or domain calculation issues are **never rejected or wiped** on refresh or JSON backup round-trip.
2. **Metadata & Identity Invariants (Strictly Enforced):**
   - `id`: requires non-empty string.
   - `schemaVersion`: requires `CURRENT_SCHEMA_VERSION = 1`.
   - `createdAt` & `updatedAt`: requires valid non-empty strings (no timestamp synthesis during import/restore).
   - `savedAt` (persisted envelope) & `exportedAt` (export envelope): requires valid non-empty strings.
3. **Domain Validation & Native Print (Editor Layer):**
   - Dynamic business/domain validation and calculation (`calculateDocument()`) runs on every render in the Editor and DocumentPreview.
   - When business rules fail (`!calcResult.ok`), the Editor displays the global validation alert banner (`global-validation-alert`), and native print triggers (`btn-print-document`, `btn-preview-print`, `btn-mobile-print`) remain **strictly disabled and fail-closed**.
4. **Single Canonical Definition of Schema Version:**
   - `CURRENT_SCHEMA_VERSION = 1` is defined exclusively in `src/domain/document/types.ts`. All other modules import or re-export it from `src/domain/document/types.ts`.
5. **Storage Resilience & Untrusted Payload Security:**
   - `SecurityError` and `QuotaExceededError` on `window.localStorage` are safely caught and return structured failure results without unhandled exceptions or corrupting in-memory state.
   - Malformed JSON, corrupted envelope keys, unsupported schema versions, and version mismatches are rejected before touching application state.
6. **Item Image Persistence (Deferred-by-Schema):**
   - The canonical `DocCraftDocument` schema defines `blocks.itemImages: boolean` for UI layout presentation. Binary image upload, client-side canvas compression, and image data storage remain deferred without modifying the closed Phase 1 domain schema.

---

## 2. Files Created & Modified

### Domain & Types:
- `src/domain/document/types.ts` — Sole canonical definition of `CURRENT_SCHEMA_VERSION = 1`.
- `src/domain/document/schema.ts` — Re-exports `CURRENT_SCHEMA_VERSION` from `./types`.

### Persistence Module Layer (`src/persistence/`):
- `src/persistence/types.ts` — Defined `PersistedDocumentEnvelope`, `ExportDocumentEnvelope`, `StorageStatus`, `PersistenceError`, and `PersistenceResult<T>` importing canonical `CURRENT_SCHEMA_VERSION`.
- `src/persistence/errors.ts` — Standardized persistence error codes (`STORAGE_UNAVAILABLE`, `STORAGE_QUOTA_EXCEEDED`, `STORAGE_WRITE_FAILED`, `CORRUPTED_PAYLOAD`, `UNSUPPORTED_SCHEMA_VERSION`, `INVALID_DOCUMENT_STRUCTURE`, `ENVELOPE_VALIDATION_FAILED`, `DOMAIN_VALIDATION_FAILED`, `FILE_READ_ERROR`).
- `src/persistence/validation.ts` — Pure runtime structural validator enforcing type safety and structural invariants without discarding editable in-progress values.
- `src/persistence/migration.ts` — Pure version negotiation and envelope validator (`migratePersistedEnvelope`, `migrateExportEnvelope`) requiring `savedAt`, `exportedAt`, `app: 'DocCraft'`, and strict version matching.
- `src/persistence/storage.ts` — Safe `localStorage` adapter (`saveDraft`, `loadDraft`, `clearDraft`, `isStorageAvailable`) with `SecurityError` and `QuotaExceededError` protection.
- `src/persistence/import-export.ts` — JSON export serializer, browser download trigger (`doccraft-${doc.documentNumber}.json`), and untrusted JSON backup parser.

### UI Integration:
- `src/ui/editor/DocCraftEditor.tsx` — Integrated debounced autosave, client-mount draft restoration, "ส่งออก JSON" button, "นำเข้า JSON" button with file picker, "สร้างใหม่" document reset button, autosave status badge, and storage error alerts (all marked with `.no-print`).

### Automated Test Suites:
- `tests/persistence/persistence.test.ts` — 30 unit tests covering storage adapter, in-progress draft autosave/restore, SecurityError/quota failures, envelope metadata, schema negotiation, duplicate/zero line-item identity invariants, and WHT referential integrity.
- `tests/e2e/phase4-persistence.spec.ts` — 11 Playwright E2E tests validating autosave/refresh restore, in-progress draft recovery, JSON round-trip, corrupted/duplicate-ID import rejection with state preservation, quota failure tolerance, and print/responsive checks.

---

## 3. Dependency Diff

- **Dependencies added:** `none`
- **devDependencies added:** `none`
- **Lockfile modified:** `no`

Package manifest diff:
```json
"dependencies": {
  "next": "16.3.1",
  "react": "19.2.8",
  "react-dom": "19.2.8"
}
```
Zero external storage, database, or backend SDK dependencies added.

---

## 4. Persisted Envelope & Export Format

### Storage Draft Envelope:
```json
{
  "storageFormatVersion": 1,
  "schemaVersion": 1,
  "savedAt": "2026-08-23T15:49:27.123Z",
  "document": {
    "id": "doc-uuid",
    "documentType": "quotation",
    "documentNumber": "QT-0001",
    "issueDate": "2026-08-23",
    "schemaVersion": 1,
    "createdAt": "2026-08-23T15:49:27.123Z",
    "updatedAt": "2026-08-23T15:49:27.123Z",
    ...
  }
}
```

### Exported Backup JSON:
```json
{
  "app": "DocCraft",
  "storageFormatVersion": 1,
  "schemaVersion": 1,
  "exportedAt": "2026-08-23T15:49:27.123Z",
  "document": {
    "id": "doc-uuid",
    "documentType": "quotation",
    "documentNumber": "QT-0001",
    "issueDate": "2026-08-23",
    "schemaVersion": 1,
    "createdAt": "2026-08-23T15:49:27.123Z",
    "updatedAt": "2026-08-23T15:49:27.123Z",
    ...
  }
}
```

---

## 5. Automated Verification Results (Final Verification)

### A. Unit & Domain Tests (`pnpm test`)
```text
$ vitest run

 ✓ tests/scaffold.test.ts (1 test)
 ✓ tests/domain/rounding.test.ts (8 tests)
 ✓ tests/domain/tax-validation.test.ts (10 tests)
 ✓ tests/domain/document.test.ts (12 tests)
 ✓ tests/domain/calculation.test.ts (16 tests)
 ✓ tests/ui/preview-print.test.ts (5 tests)
 ✓ tests/ui/editor-state.test.ts (10 tests)
 ✓ tests/persistence/persistence.test.ts (30 tests)

 Test Files  8 passed (8)
      Tests  92 passed (92)
   Duration  364ms
```
- **Total Automated Unit/Domain Tests:** 92 passed (100% PASS)

### B. TypeScript Typecheck (`pnpm typecheck`)
```text
$ tsc --noEmit
Exit code: 0 (No type errors)
```

### C. Linting (`pnpm lint`)
```text
$ eslint .
Exit code: 0 (0 errors, 0 warnings)
```

### D. Production Build (`pnpm build`)
```text
▲ Next.js 16.3.1 (Turbopack)
✓ Running next.config.ts took 10ms
Creating an optimized production build ...
✓ Compiled successfully in 311ms
Running TypeScript ...
Finished TypeScript in 744ms ...
Collecting page data using 4 workers ...
Generating static pages using 4 workers (0/3) ...
✓ Generating static pages using 4 workers (3/3) in 171ms
Finalizing page optimization ...

Route (app)
┌ ○ /
└ ○ /_not-found

○ (Static) prerendered as static content
Exit code: 0
```

### E. Playwright E2E Test Suite (`pnpm test:e2e`)
```text
$ playwright test

Running 29 tests using 3 workers

  ✓  Phase 2 — DocCraft Editor + Modular Blocks E2E › 1. create/edit a normal quotation from the default state (457ms)
  ✓  Phase 3 — A4 Preview + Native Print E2E › 1. print button invokes window.print() natively (500ms)
  ✓  Phase 4 — Local Persistence + JSON Backup E2E › 1. autosave & refresh restores current draft accurately (627ms)
  ✓  Phase 2 — DocCraft Editor + Modular Blocks E2E › 2. add a second line, apply discount and see live totals update (214ms)
  ✓  Phase 3 — A4 Preview + Native Print E2E › 2. preview-embedded and mobile print buttons also invoke window.print() (229ms)
  ✓  Phase 4 — Local Persistence + JSON Backup E2E › 2. empty document number restores accurately on refresh with validation error and print disabled (328ms)
  ✓  Phase 3 — A4 Preview + Native Print E2E › 3. print media emulation hides editor chrome and preserves A4 document preview (205ms)
  ✓  Phase 2 — DocCraft Editor + Modular Blocks E2E › 3. VAT-registered flow can enable VAT and exposes eligible Tax Invoice path (269ms)
  ✓  Phase 2 — DocCraft Editor + Modular Blocks E2E › 4. non-registered flow cannot present a valid Tax Invoice state (156ms)
  ✓  Phase 3 — A4 Preview + Native Print E2E › 4. representative one-page quotation fixture renders complete document structure (194ms)
  ✓  Phase 4 — Local Persistence + JSON Backup E2E › 3. empty issue date restores accurately on refresh with validation error and print disabled (321ms)
  ✓  Phase 3 — A4 Preview + Native Print E2E › 5. representative multi-page fixture contains all 22 rows with break-avoid rules (180ms)
  ✓  Phase 3 — A4 Preview + Native Print E2E › 6. Thai text and long customer/address strings render cleanly without layout overflow (172ms)
  ✓  Phase 2 — DocCraft Editor + Modular Blocks E2E › 5. WHT eligible-line control changes calculated WHT basis/amount (414ms)
  ✓  Phase 4 — Local Persistence + JSON Backup E2E › 4. in-progress tax invoice draft restores on refresh with validation errors visible and print disabled (341ms)
  ✓  Phase 3 — A4 Preview + Native Print E2E › 7. optional blocks toggle in preview and render accurately (184ms)
  ✓  Phase 2 — DocCraft Editor + Modular Blocks E2E › 6. block hide → show preserves the field value entered before hiding (203ms)
  ✓  Phase 3 — A4 Preview + Native Print E2E › 8. 375px mobile and 768px tablet force document preview visible in print media even from Editor tab (187ms)
  ✓  Phase 2 — DocCraft Editor + Modular Blocks E2E › 7. 375px phone completes representative editor flow without horizontal blocking overflow (208ms)
  ✓  Phase 4 — Local Persistence + JSON Backup E2E › 5. export JSON -> reset state -> import JSON round-trip reproduces document (328ms)
  ✓  Phase 2 — DocCraft Editor + Modular Blocks E2E › 8. representative 768px tablet uses compact Editor/Preview switcher (208ms)
  ✓  Phase 3 — A4 Preview + Native Print E2E › 9. fail-closed printing: invalid document disables print controls and blocks window.print() (284ms)
  ✓  Phase 4 — Local Persistence + JSON Backup E2E › 6. backup round-trip for in-progress domain-invalid draft restores draft, shows errors, and blocks print (299ms)
  ✓  Phase 2 — DocCraft Editor + Modular Blocks E2E › 9. >=1024px desktop renders editor + preview simultaneously (150ms)
  ✓  Phase 4 — Local Persistence + JSON Backup E2E › 7. corrupted or invalid JSON import is rejected and preserves previous document state (224ms)
  ✓  Phase 4 — Local Persistence + JSON Backup E2E › 8. duplicate line-item IDs from untrusted backup are rejected and current state is preserved (222ms)
  ✓  Phase 4 — Local Persistence + JSON Backup E2E › 9. simulated storage quota error surfaces notice while editor and export remain operational (367ms)
  ✓  Phase 4 — Local Persistence + JSON Backup E2E › 10. responsive viewports render cleanly with persistence controls without overflow (158ms)
  ✓  Phase 4 — Local Persistence + JSON Backup E2E › 11. Phase 3 print output strictly hides all persistence and backup UI controls (152ms)

29 passed (4.3s)
Exit code: 0
```

---

## 6. Failure Modes & In-Progress Recovery Matrix

| Test Scenario | Expected Behavior | Automated Test Reference | Status |
| :--- | :--- | :--- | :---: |
| **Empty `documentNumber` Refresh Recovery** | Exact empty draft restored; validation error visible; print disabled | `tests/e2e/phase4-persistence.spec.ts:2` & `tests/persistence/persistence.test.ts:1` | **PASS** |
| **Empty `issueDate` Refresh Recovery** | Exact empty draft restored; validation error visible; print disabled | `tests/e2e/phase4-persistence.spec.ts:3` & `tests/persistence/persistence.test.ts:1` | **PASS** |
| **In-Progress Tax Invoice Refresh Recovery** | Exact draft restored; validation error visible; print disabled | `tests/e2e/phase4-persistence.spec.ts:4` & `tests/persistence/persistence.test.ts:1` | **PASS** |
| **Negative Quantity / In-Progress Backup Round-Trip** | Structurally valid negative numeric draft survives backup round-trip and remains domain-invalid | `tests/persistence/persistence.test.ts:4` | **PASS** |
| **Duplicate Line Item IDs** | Rejected before state replacement; existing editor state preserved | `tests/e2e/phase4-persistence.spec.ts:8` & `tests/persistence/persistence.test.ts:4` | **PASS** |
| **Zero Line Items** | Rejected as unreachable editor-state invariant | `tests/persistence/persistence.test.ts:4` | **PASS** |
| **Unknown/Duplicate WHT Basis IDs** | Rejected as referential-integrity violations | `tests/persistence/persistence.test.ts:4` | **PASS** |
| **Missing `savedAt` in Persisted Envelope** | Rejected with `ENVELOPE_VALIDATION_FAILED` | `tests/persistence/persistence.test.ts:2` | **PASS** |
| **Missing `exportedAt` in Export Envelope** | Rejected with `ENVELOPE_VALIDATION_FAILED` | `tests/persistence/persistence.test.ts:2` | **PASS** |
| **Missing `createdAt` / `updatedAt` in Canonical Doc** | Rejected with `INVALID_DOCUMENT_STRUCTURE` without synthesizing | `tests/persistence/persistence.test.ts:3` | **PASS** |
| **SecurityError on Storage Access** | Safely returns `STORAGE_UNAVAILABLE` without throwing unhandled exception | `tests/persistence/persistence.test.ts:1` | **PASS** |
| **Bare Document Import** | Rejected with `ENVELOPE_VALIDATION_FAILED` (envelope required) | `tests/persistence/persistence.test.ts:4` | **PASS** |
| **Envelope Version Mismatch** | Rejected with `ENVELOPE_VALIDATION_FAILED` | `tests/persistence/persistence.test.ts:2` | **PASS** |
| **Malformed Imported File** | User alert shown; current document remains completely unchanged | `tests/e2e/phase4-persistence.spec.ts:7` & `tests/persistence/persistence.test.ts:4` | **PASS** |
| **Storage Quota Exceeded** | Warning banner shown; in-memory document preserved; editing & JSON export continue | `tests/e2e/phase4-persistence.spec.ts:9` & `tests/persistence/persistence.test.ts:1` | **PASS** |
| **Corrupted Stored JSON** | Safely returns `CORRUPTED_PAYLOAD`; application boots into default document | `tests/persistence/persistence.test.ts:1` | **PASS** |

---

## 7. Scope Drift & Boundary Scan

Command executed:
```bash
grep -rnE "PromptPay|crc16|EMV|@supabase|createClient|auth|billing|subscription|stripe|omise|webhook|pdf-lib|jspdf" src/ app/
```
- **Matches:** 1 benign textual fixture match in `src/domain/fixtures/representative-documents.ts` containing the word `PromptPay` as payment-instruction copy only. No PromptPay QR/EMV/CRC implementation is present.
- Zero PromptPay QR EMV payload or CRC generation (Phase 5).
- Zero Supabase, authentication, database, billing, or backend API code (Phase 7+).
- Zero external PDF generators.

---

## 8. Implementation Self-Check Summary (Not a Gate Verdict)

**STATUS: Automated checks green. Gate 4 verdict is NOT YET PASS — that requires independent human review, which has not happened. Gate 3 also has not been independently reviewed, and Phase 4 was opened ahead of that review by explicit user direction.**

What is actually confirmed, independently rerun on 2026-08-23:
- 92/92 unit/domain tests pass, including storage adapter, envelope migration, and referential-integrity checks.
- 29/29 Playwright E2E scenarios pass, including quota/SecurityError handling, corrupted/duplicate-ID import rejection, and round-trip export→import.
- TypeScript typecheck, ESLint, and production build all pass with 0 errors/warnings.
- Scope-drift scan found no PromptPay/Supabase/billing/PDF-library code.

What is disclosed as an open scope gap, not a bug:
- Item-image upload, client-side compression, and encoded-size guard from the ROADMAP's Phase 4 task list were not built. Section 1.6 defers this to avoid touching the closed Phase 1 schema; if this capability is still wanted for V1, it needs its own scoped follow-up rather than being folded silently into "Gate 4 PASS."

**Recommendation:** do not mark Gate 3 or Gate 4 PASS in `DOCUMENTATION_READINESS_INDEX.md` until a human has reviewed both phases' actual diffs/behavior, per `IMPLEMENTATION_PLAN.md`'s own review requirement. Phase 5 should not open until at least Gate 3 (and ideally Gate 4) receive that review.


---

## 9. Phase 4 Remediation Addendum — Item Image Persistence Pipeline (2026-08-25)

### 9.1 Remediation objective and provenance

This addendum records the continuation and verification of the Phase 4 remediation authorized by `BRIEF-phase4-remediation-image-pipeline.md`.

- Baseline HEAD: `fc80742c98f5135229dae2cc8f0ac4803a149a07`.
- Branch: `master`.
- Remediation started from the existing dirty working tree; no reset, checkout, or discard of prior remediation work was performed.
- No remediation commit existed at verification start. The final commit SHA is reported by the repository history/final handoff after this evidence is committed; a commit cannot stably contain its own SHA.
- No temporary `.phase4_patch_ui.py` or `.phase4_patch_tests.py` helper remained.
- A temporary system-Chrome Playwright config used only to isolate browser-runtime failures was removed before final diff review.

**Objective:** complete the browser-only item-image pipeline without changing Phase 1 calculation/tax contracts, backend/cloud architecture, or native-print strategy.

### 9.2 Canonical schema v2

`CURRENT_SCHEMA_VERSION` is now `2`. `LineItem` has optional canonical `image?: ItemImage` with exactly:

```ts
interface ItemImage {
  dataUrl: string;
  mimeType: 'image/jpeg' | 'image/webp';
  width: number;
  height: number;
}
```

Image metadata/data does not participate in financial, VAT, WHT, deposit, rounding, or tax-invoice calculations.

### 9.3 Explicit v1 → v2 migration behavior

Both persisted local envelopes and exported backup envelopes negotiate schema versions before state replacement.

- Valid v1 envelope + inner v1 document migrates to canonical v2.
- Document ID, line-item IDs, `createdAt`, `updatedAt`, business/customer data, adjustments, payment, blocks, terms, and notes are preserved.
- Legacy v1 items migrate with `image` absent.
- A v1 payload containing any line-item `image` field is rejected instead of silently accepting v2 data in a v1 envelope.
- Canonical v2 envelopes validate directly.
- Future schema versions fail closed.
- Envelope/document schema-version mismatch fails closed.
- Malformed restore/import payloads do not replace active editor state.

### 9.4 Image processing and persistence contract

Centralized constants in `src/image/item-image.ts`:

- accepted source MIME: JPEG, PNG, WebP;
- persisted MIME: JPEG or WebP;
- maximum processed long edge: `960 px`;
- maximum persisted `dataUrl`: `262,144` UTF-8 bytes;
- initial lossy quality: `0.82`;
- maximum encode/reduction attempts: `4`;
- retry dimension scale: `0.85`;
- retry quality decrement: `0.12`.

The pipeline attempts WebP first and falls back to JPEG. JPEG fallback paints a white canvas background before drawing the source, preventing transparent pixels from becoming an unintended dark/transparent background. Acceptance is based on the actual final persisted `dataUrl` byte length, not source `File.size`.

### 9.5 Structural image validation and editor behavior

Persistence/import validation rejects unsupported MIME, MIME/data-URL prefix mismatch, invalid base64, external/blob/SVG/HTML URLs, non-positive or >960 px dimensions, oversized persisted data URLs, and unsupported/missing image fields under the strict four-field representation.

Editor behavior verified in code/tests:

- attach/replace mutates only the targeted line item after processing succeeds;
- failed replacement preserves the previous accepted image/document state;
- remove clears only the targeted line-item image;
- image-processing state and inline error are visible; no browser `alert()` is used;
- hiding `blocks.itemImages` preserves canonical image data and showing it again restores the image UI;
- a React hook-order defect in `ItemsSection` was corrected by moving image-processing hooks before the `isVisible` early return.

Preview/print renders canonical `item.image.dataUrl` only when the item-image block is enabled. No fake image placeholder is rendered in the document preview when image data is absent. Editor upload/remove controls remain outside the printable preview and are hidden by the existing Phase 3 print rules.

### 9.6 Unit/domain verification

Final repository command:

```text
pnpm test
Test Files  9 passed (9)
Tests       117 passed (117)
```

`tests/persistence/item-image-remediation.test.ts` adds 23 focused remediation tests covering canonical v2 acceptance, real legacy-v1 migration, v1 image injection rejection, image structural validation, persistence/export round trips, quota-state preservation, hide/show/remove behavior, failed replacement preservation, calculation isolation, supported source MIME handling, JPEG fallback, and the bounded four-attempt failure path.

### 9.7 Typecheck, lint, and build

Final repository commands all completed successfully:

```text
pnpm typecheck
# tsc --noEmit — PASS

pnpm lint
# eslint . — PASS, 0 errors / 0 warnings

pnpm build
# Next.js 16.3.1 production build — PASS
# Static routes: / and /_not-found
```

### 9.8 Playwright verification

The missing Playwright-managed Chromium runtime was installed with the repository's own Playwright version using:

```text
pnpm exec playwright install chromium
# Installed Playwright Chromium / headless-shell revision v1234
```

The exact repository gate command then completed successfully from the normal `playwright.config.ts`:

```text
pnpm test:e2e
Running 32 tests using 4 workers
32 passed (7.2s)
```

This managed-Chromium run includes all existing Phase 2/3/4 regression coverage plus the three new Phase 4 image-pipeline E2E scenarios: attach/persist/reload/export-import/remove/print; unsupported replacement with previous-image preservation; and quota failure with accepted image/editor state plus JSON export remaining available.

A prior diagnostic run against installed Google Chrome also passed 32/32 after one stale Phase 3 placeholder assertion was corrected to assert the actual canonical preview image. That diagnostic config was temporary and was removed before final diff review.

### 9.9 Storage quota, JSON round-trip, and print/image results

- `saveDraft` quota failure returns `STORAGE_QUOTA_EXCEEDED` without mutating the in-memory document/image.
- Accepted image data survives `saveDraft → loadDraft`.
- Accepted image data survives JSON `serialize/export → import`.
- Browser E2E verifies localStorage envelope/document schemaVersion `2` and persisted image data after attachment.
- Reload restores the image; export contains the image; reset/import restores it again.
- Quota failure leaves editor state and JSON export operational.
- Preview and print-media verification show the actual canonical image while upload/remove/editor controls are not printable.
- Responsive image presentation uses constrained dimensions with `object-contain`; system-Chrome E2E found no blocking horizontal overflow in the covered flow.

### 9.10 Files changed by the remediation

Production/remediation files:

- `src/domain/document/types.ts`
- `src/domain/fixtures/representative-documents.ts`
- `src/image/item-image.ts`
- `src/persistence/migration.ts`
- `src/persistence/validation.ts`
- `src/ui/editor/editor-state.ts`
- `src/ui/editor/sections/ItemsSection.tsx`
- `src/ui/preview/DocumentPreview.tsx`

Tests/documentation:

- `tests/persistence/persistence.test.ts`
- `tests/persistence/item-image-remediation.test.ts`
- `tests/ui/preview-print.test.ts`
- `tests/e2e/phase3-print.spec.ts`
- `tests/e2e/phase4-persistence.spec.ts`
- `tests/e2e/phase4-item-images.spec.ts`
- `BRIEF-phase4-remediation-image-pipeline.md`
- `docs/PHASE4_IMPLEMENTATION_EVIDENCE.md`

### 9.11 Scope-drift review, limitations, and disposition

`git diff --check` passes after whitespace cleanup. No diff exists under `src/domain/calculation` or `src/domain/tax`, and the remediation diff contains no Supabase, API-route, backend/cloud, PDF-generation, billing, or payment implementation.

Therefore there are no changes to VAT formulas, WHT formulas, deposit formulas, rounding behavior, or tax-invoice eligibility semantics.

Known limitations remain intentionally within the remediation brief:

- one canonical processed image per line item;
- no crop/editor UI, OCR/AI processing, reusable image library, CDN/cloud image storage, or backend processing;
- browser LocalStorage capacity is environment-dependent and no fixed total quota is assumed;

### 9.12 Reviewer-ready conclusion

**Implementation remediation is complete and all repository verification gates now pass, including the normal Playwright-managed Chromium run (`32/32`).**

This addendum intentionally does **not** self-declare Gate 4 PASS because the project process requires independent reviewer signoff. The recommended disposition is:

> **Implementation remediation complete — ready for independent Gate 4 review.**

No known technical or environment blocker remains for independent Gate 4 review. Gate 4 should be marked PASS only by the designated independent reviewer after reviewing this remediation commit and evidence.

### 9.13 Continuation verification — canonical preview-image assertion (2026-08-25)

This continuation began at existing repository HEAD `d911fc5f30041fe92e8cabf2c2f32027e8be0426` (`Phase 4 remediation: item image persistence pipeline`). That remediation commit already existed before this continuation; no commit or push was performed here.

The remaining stale Phase 3 E2E check was tightened in `tests/e2e/phase3-print.spec.ts`. The `with-images` fixture now verifies both that `preview-item-image-item-1` is visible and that its `src` is a canonical persisted JPEG/WebP data URL matching `^data:image/(jpeg|webp);base64,`. Production code was not changed to satisfy the test.

Current repository verification after that test-only correction:

```text
pnpm test
Test Files  9 passed (9)
Tests       117 passed (117)

pnpm typecheck
# tsc --noEmit — PASS

pnpm lint
# eslint . — PASS, 0 errors / 0 warnings

pnpm build
# Next.js 16.3.1 production build — PASS

pnpm test:e2e
Running 32 tests using 4 workers
32 passed (6.7s)
```

The targeted managed-Chromium run for the corrected Phase 3 scenario also passed `1/1`. The supplemental system-Chrome result remains the previously recorded `32/32`; it was not rerun because the official repository command now passes with Playwright-managed Chromium. `.playwright-system-chrome.config.ts` is absent, and no `.phase4_patch_*` helper remains.

At this continuation's pre-evidence final-diff checkpoint, the only uncommitted file was `tests/e2e/phase3-print.spec.ts` with four inserted assertion lines. The evidence append itself adds this documentation file to the final working-tree diff. `git diff --check` passes. No production, calculation, VAT, WHT, deposit, rounding, tax-invoice eligibility, backend/cloud, Supabase, API route, server database, or PDF-generation file was changed in this continuation.

**Implementation remediation complete — ready for independent Gate 4 review.** This is not a Gate 4 PASS declaration; independent review/signoff remains required.
