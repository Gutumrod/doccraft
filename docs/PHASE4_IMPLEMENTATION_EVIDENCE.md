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
