# DocCraft — Independent Gate 4 Re-Review

> **Review Date:** 2026-08-26
> **Repository:** `Gutumrod/doccraft`
> **Branch:** `master`
> **Implementation HEAD reviewed:** `22283a0192942fb3670969ef1de18403edeed2ca`
> **Remediation commit:** `d911fc5f30041fe92e8cabf2c2f32027e8be0426`
> **Review test hardening commit on master:** `42bd70d529722e14f7e769c313949f51fe5a3331`
> **Prior Gate review superseded for Gate 4 only:** `docs/GATE_REVIEW_PHASE3_PHASE4_2026-08-24.md`

## 1. Verdict

**GATE 4 — PASS.**

The Phase 4 item-image persistence remediation now satisfies the locked V1 Phase 4 contract. No unresolved Gate 4 blocker remains.

This verdict does **not** close Gate 3. Gate 3 still requires the separate manual Chrome/Edge native print-preview acceptance. Phase 5 therefore remains blocked until Gate 3 is also PASS.

## 2. Independent Review Scope

The re-review inspected the actual remote implementation rather than accepting the implementation evidence at face value. The following areas were checked against `BRIEF-phase4-remediation-image-pipeline.md` and the Phase 4 authority chain:

- canonical document schema and `LineItem.image` representation;
- explicit schema v1 → v2 migration for persisted drafts and exported backups;
- structural validation of untrusted image payloads;
- browser-only decode / resize / compression / encoded-size guard;
- editor attach / replace / remove behavior and inline failure state;
- hide/show preservation of canonical image data;
- preview and print rendering;
- LocalStorage autosave/restore and quota-failure behavior;
- JSON export/import round-trip;
- calculation/tax isolation and scope-drift boundaries;
- unit and Playwright coverage.

Primary implementation files inspected:

- `src/domain/document/types.ts`
- `src/image/item-image.ts`
- `src/persistence/migration.ts`
- `src/persistence/validation.ts`
- `src/ui/editor/editor-state.ts`
- `src/ui/editor/sections/ItemsSection.tsx`
- `src/ui/preview/DocumentPreview.tsx`
- `tests/persistence/item-image-remediation.test.ts`
- `tests/e2e/phase4-item-images.spec.ts`
- `docs/PHASE4_IMPLEMENTATION_EVIDENCE.md`

## 3. Confirmed Contract Compliance

### 3.1 Canonical schema

- `CURRENT_SCHEMA_VERSION = 2`.
- `LineItem` contains optional canonical `image?: ItemImage`.
- Persisted image shape is limited to `dataUrl`, `mimeType`, `width`, and `height`.
- Persisted MIME is limited to JPEG/WebP.
- Image data does not participate in document calculations.
- Hiding the item-image block changes visibility only and does not delete canonical image data.

### 3.2 Migration

- Explicit v1 → v2 migration exists for both local persistence and JSON backup envelopes.
- Envelope/document schema mismatch fails closed.
- Future unsupported schema versions fail closed.
- Legacy v1 line items migrate without image data.
- A v1 payload attempting to inject v2 image data is rejected.
- Runtime restored/imported state is canonical v2.

### 3.3 Image processing and guard

The image pipeline owns centralized constants matching the remediation brief:

- max persisted data URL: `262,144` UTF-8 bytes;
- max long edge: `960 px`;
- initial quality: `0.82`;
- max attempts: `4`;
- retry scale: `0.85`;
- quality decrement: `0.12`.

Accepted input MIME types are JPEG, PNG, and WebP. Processing is browser-only. The pipeline decodes, orientation-normalizes through the browser image path, resizes while preserving aspect ratio, prefers WebP, falls back to JPEG, measures the **actual persisted data URL**, retries within the bounded attempt count, and fails safely when the guard cannot be met. JPEG fallback composites onto white before encoding.

### 3.4 Untrusted image validation

Persistence validation rejects:

- unsupported or extra image fields;
- MIME/data-URL mismatch;
- malformed base64;
- external URLs;
- `blob:` URLs;
- SVG and arbitrary data MIME types;
- non-positive/invalid dimensions;
- dimensions above 960 px;
- persisted data URLs above the exact byte guard.

### 3.5 Editor / persistence / backup / print

- File picker is limited to JPEG/PNG/WebP.
- Processing state is visible.
- Success updates only the targeted line item.
- Failure does not call the canonical state update path.
- Existing accepted image survives failed replacement.
- Remove clears only the targeted image.
- Errors are inline; no `alert()` dependency is used for image processing failures.
- Autosave/restore preserves accepted canonical image data.
- JSON export/import preserves accepted image data.
- Quota failure preserves in-memory state and leaves JSON export usable.
- Preview renders canonical image data only when the image block is visible.
- Print media includes the document image and hides editor controls.

## 4. Review Finding and Test Hardening

The initial independent read found one coverage gap in the remediation test matrix: unsupported MIME input was covered, but an explicit test for a **supported MIME file whose image bytes are undecodable/corrupt** was not present.

This was a test-coverage gap, not a discovered production-code defect. The production pipeline already fails closed with `DECODE_FAILED` before any successful state update.

A dedicated regression test was added at:

- `tests/persistence/item-image-corrupt-input.test.ts`

The test supplies a file labeled `image/jpeg`, forces image decoding to fail, and verifies `processItemImageFile()` rejects with `DECODE_FAILED` before an accepted image can be returned to the editor state update path.

## 5. Fresh Independent Cloud Verification

Because the user's local computer was unavailable, the reviewer created the temporary branch `review/gate4-2026-08-26` from `22283a0`, added the corrupt-input regression test, and ran a temporary GitHub Actions verification workflow on GitHub-hosted Ubuntu with Node 22 and pnpm 11.21.0.

Verification run:

- GitHub Actions run ID: `32916220299`
- Verified branch commit: `a1dfc3062fd601ba9ce56806fbacd413d168c0ad`

Results:

```text
pnpm install --frozen-lockfile
PASS

pnpm test
Test Files  10 passed (10)
Tests       118 passed (118)

pnpm typecheck
PASS

pnpm lint
PASS

pnpm build
Next.js 16.3.1 production build PASS
3/3 static pages generated

pnpm exec playwright install --with-deps chromium
PASS

pnpm test:e2e
Running 32 tests using 2 workers
32 passed (12.7s)
```

The tested source was the current Gate 4 implementation plus the new regression test. The temporary workflow file itself is review infrastructure only and is not required on `master`. After the green run, the regression test was copied to `master` as commit `42bd70d` without changing production code.

## 6. Scope-Drift Review

Comparison from remediation starting baseline `fc80742` through implementation/evidence HEAD `22283a0` shows changes limited to the remediation brief, persistence/image/editor/preview areas, fixtures, evidence, and associated tests.

No remediation change was introduced under Phase 1 calculation/tax modules. No Supabase, backend/API route, cloud image storage, billing, payment confirmation, or PDF-generation implementation was introduced.

The image pipeline remains browser-first and isolated from calculation behavior.

## 7. Acceptance Matrix

| Gate 4 requirement | Result |
| --- | --- |
| Canonical schema v2 + `LineItem.image` | PASS |
| Explicit v1 → v2 migration | PASS |
| Resize/compression before persistence | PASS |
| Exact encoded-size guard | PASS |
| Bounded reduction attempts | PASS |
| Strict untrusted image validation | PASS |
| Attach/replace/remove canonical state | PASS |
| Failure preserves existing image/state | PASS |
| Hide/show preserves image data | PASS |
| Autosave/restore image round-trip | PASS |
| JSON export/import image round-trip | PASS |
| Quota/storage failure preserves in-memory work | PASS |
| Preview/print image rendering | PASS |
| No backend/cloud/PDF/calculation scope drift | PASS |
| Unit/typecheck/lint/build | PASS |
| Playwright E2E | PASS — 32/32 |
| Corrupt supported-MIME decode regression | PASS |

## 8. Final Disposition

**Phase 4 is CLOSED. Gate 4 = PASS.**

Remaining sequencing state:

- **Gate 3:** REMEDIATE — manual Chrome/Edge native print acceptance still required.
- **Gate 4:** PASS — closed by this independent re-review.
- **Phase 5:** remains `PREPARED — NOT OPENED` until Gate 3 is also PASS.

## 9. Addendum — 2026-09-03 (owner-decision interpretation note)

This Gate 4 re-review was conducted (2026-08-26) with the JSON Export/Import controls reachable
from the standard UI. On 2026-09-03 the owner decided (option 2 KEEP, recorded as
`docs/PRODUCT_DECISIONS.md` D-2026-09-03) to keep the JSON backup UI controls hidden, repositioning
JSON Import/Export as a capability-held-but-not-exposed in V1. The historical Gate 4 **PASS verdict
is not changed**; it is now interpreted against the amended contract, where JSON export/import is
not a V1 customer-facing backup contract. The schema round-trip, migration and quota-failure
behavior reviewed by Gate 4 remain intact in the source and are still exercised by the persistence
test suite (E2E drives the hidden controls via `dispatchEvent`).
