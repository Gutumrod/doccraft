# DocCraft — Phase 4 Remediation Brief: Item Image Persistence Pipeline

> **Phase:** 4 Remediation — Local Persistence + Image Guard
> **Status:** READY FOR REMEDIATION IMPLEMENTATION
> **Date:** 2026-08-24
> **Repository:** `Gutumrod/doccraft`
> **Branch:** `master`
> **Reviewed code baseline:** `c9f8f0b`
> **Documentation/review HEAD:** `fc80742`
> **Remediation starting HEAD:** `fc80742`
> **Trigger:** `docs/GATE_REVIEW_PHASE3_PHASE4_2026-08-24.md`
> **Source of Truth:** `PRD.md` → `SYSTEM_ARCHITECTURE.md` → `ROADMAP.md` → `IMPLEMENTATION_PLAN.md`

## 1. Objective
Close the only identified Phase 4 scope defect by implementing the V1 item-image client-side pipeline end-to-end: canonical representation, schema migration, editor attach/remove flow, resize/compression, encoded-size guard, local persistence, JSON backup round-trip, preview, print, and failure handling.

This remediation must remain browser-first and must not introduce backend storage, cloud sync, PDF generation, or changes to Phase 1 calculation/tax behavior.

## 2. Confirmed Current-State Defect
The current `LineItem` schema has no image field. `BlockVisibility.itemImages` is only a visibility flag, and the editor currently renders an image placeholder rather than an actual upload flow.

Therefore this remediation requires an explicit canonical schema amendment. The schema change is authorized by this brief and must not be hidden in component-only UI state.

## 3. Canonical Schema Amendment
Bump `CURRENT_SCHEMA_VERSION` from `1` to `2` and add an optional image representation to each `LineItem`.

Required persisted shape:

```ts
interface ItemImage {
  dataUrl: string;
  mimeType: 'image/jpeg' | 'image/webp';
  width: number;
  height: number;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: DiscountConfig;
  image?: ItemImage;
}
```

Rules:
- `image` is optional and absence must remain valid.
- `dataUrl` is the canonical persisted encoded representation; no Blob/ObjectURL may be persisted.
- `mimeType`, dimensions, and `dataUrl` must agree structurally.
- imported image metadata is untrusted; validation must not rely on a claimed byte count from JSON.
- image data must not participate in calculation/domain totals.
- hiding `blocks.itemImages` changes presentation only and must not delete `LineItem.image`.

## 4. Schema Migration Contract
Implement an explicit schema `v1 → v2` migration for both persisted draft envelopes and exported backup envelopes.

Migration requirements:
- every valid v1 document must migrate to v2 without user-data loss;
- existing line items migrate with `image` absent;
- migration must preserve stable document/item IDs, timestamps, business/customer data, adjustments, payment, blocks, terms, and notes;
- v2 envelopes must validate after migration;
- unsupported future schema versions must continue to fail closed;
- corrupted or malformed v1/v2 payloads must never replace current in-memory state;
- migration logic must have direct unit coverage, including v1 backup import and v1 local draft restore.

Do not solve this by accepting both schema versions indefinitely in the canonical model. Runtime canonical state after restore/import must be v2.

## 5. Image Processing Contract
Accepted source types: JPEG, PNG, and WebP. Unsupported or undecodable input must be rejected before document state is mutated.

Processing must occur entirely client-side:
1. decode the selected source image;
2. normalize orientation as rendered by the browser;
3. resize while preserving aspect ratio;
4. initial maximum long edge: **960 px**;
5. encode to WebP when supported, otherwise JPEG;
6. inspect the actual persisted `dataUrl` encoded byte size;
7. if above the guard, retry with reduced quality/dimensions;
8. accept only when the persisted representation is within the guard.

Guard constants for this remediation:
- maximum persisted `dataUrl` size per image: **256 KiB (262,144 UTF-8 bytes)**;
- maximum long edge after processing: **960 px**;
- initial lossy quality: **0.82**;
- maximum encode/reduction attempts: **4 total attempts**;
- on retry, reduce quality by approximately `0.12` and scale dimensions to approximately `85%` of the previous attempt;
- if JPEG fallback is used for an image with transparency, composite onto a white background before encoding.

These are implementation constants owned by the image pipeline module, not duplicated across components. A future change to these limits requires tests and review but does not require a business-domain calculation change.

Encoded-size measurement must be derived from the actual `dataUrl` that will be stored/exported. Source `File.size`, canvas dimensions, or an estimated base64 ratio alone are not sufficient acceptance checks.

## 6. Structural Validation Contract
Persistence/import validation must validate image fields as untrusted input before state replacement:
- `image` is absent or an object with exactly the supported representation;
- `mimeType` is `image/jpeg` or `image/webp`;
- `dataUrl` uses the matching `data:image/...;base64,` form;
- decoded payload is valid base64 and the full persisted `dataUrl` does not exceed 262,144 UTF-8 bytes;
- `width` and `height` are finite positive integers and neither dimension exceeds 960 px;
- SVG, external URLs, `blob:` URLs, arbitrary HTML/data MIME types, and unsupported image MIME types are rejected;
- image validation is structural/persistence safety validation and must not reintroduce business-rule rejection of type-correct in-progress drafts.

## 7. Editor Behavior
Replace the current item-image placeholder with a real attach/remove flow when `blocks.itemImages` is visible.

Required behavior:
- file picker accepts JPEG/PNG/WebP only;
- processing state must be visible while decode/resize/encode is running;
- accepted image updates only the targeted line item;
- rejected/failed processing must leave the entire current document, including any existing image on that item, unchanged;
- user can explicitly remove an accepted image;
- hide/show of the item-image block preserves attached image data;
- processing/validation failures surface an actionable inline error without `alert()` dependency;
- image processing errors must not be misreported as storage errors.

## 8. Preview and Print Contract
`DocumentPreview` must render `LineItem.image` from canonical document state when `blocks.itemImages` is enabled.

Requirements:
- no placeholder is rendered as if it were a real image;
- absent images leave a clean layout;
- image dimensions are constrained for document presentation without changing aspect ratio;
- print output contains the accepted image but no file input/remove/editor controls;
- representative image fixtures must not create critical row overlap, horizontal overflow, or unreadable print content;
- existing Phase 3 A4/multi-page rules remain authoritative.

## 9. Persistence / Backup Behavior
Accepted image data is part of the canonical v2 document and therefore must naturally flow through the existing autosave, restore, JSON export, and JSON import envelopes.

Storage requirements:
- autosave persists only the already-processed/guarded canonical image representation;
- refresh/restore reproduces accepted images;
- export/import reproduces accepted images exactly enough to render the same processed image;
- local storage quota/security failure after an image is accepted keeps the current in-memory document and image intact;
- JSON export must remain available after local persistence failure;
- do not assume a fixed total LocalStorage quota.

## 10. Expected Implementation Touchpoints
The implementer must inspect and modify only what is necessary, expected to include:
- `src/domain/document/types.ts` — schema v2 + `ItemImage` / `LineItem.image`;
- document creation/fixtures that construct canonical line items;
- `src/persistence/validation.ts` — structural image validation;
- `src/persistence/migration.ts` — explicit v1→v2 migration;
- persistence/import-export tests and fixtures;
- `src/ui/editor/sections/ItemsSection.tsx` and owning editor state wiring;
- a dedicated client-side image processing module with centralized constants/errors;
- `DocumentPreview` and print/image presentation styles;
- Phase 4 unit/E2E coverage and Phase 4 evidence.

Before editing, inspect actual current signatures, state flow, tests, and preview structure. Do not infer paths or APIs from this list if repository code differs.

## 11. Architecture Constraints
- Browser-first only; no Supabase, API route, cloud storage, auth, or server image processing.
- No PDF-generation dependency.
- Do not alter Phase 1 calculation formulas, VAT/WHT/deposit rules, or tax eligibility behavior.
- Keep image processing isolated from calculation/domain business logic.
- Do not persist Blob/ObjectURL references.
- Do not silently broaden supported image MIME types.
- Do not hard-code a total browser LocalStorage quota assumption.
- Never hard-code credentials or external service keys.

## 12. Required Automated Tests
At minimum add tests proving:
- valid JPEG/PNG/WebP input is decoded, resized as required, and encoded before state update;
- accepted persisted `dataUrl` is ≤262,144 UTF-8 bytes and dimensions are ≤960 px;
- a normal image is accepted without unnecessary repeated degradation;
- an oversized encoded image is reduced within the bounded attempts or rejected safely after attempt 4;
- unsupported/corrupted input is rejected without document-state loss;
- an existing item image survives a failed replacement attempt;
- explicit remove clears only the targeted item's image;
- hiding/showing the item-image block preserves image data;
- schema v1 local draft migrates to canonical v2 with no image and no unrelated data loss;
- schema v1 exported backup imports and migrates to canonical v2;
- schema v2 image structure rejects invalid MIME/data URL/base64/dimensions/oversize content;
- autosave → refresh restores an accepted image;
- JSON export → clear/import preserves an accepted image;
- quota/storage failure with image data preserves current editor state and export path;
- preview and print mode render accepted image without editor controls or critical layout overflow;
- all pre-existing Phase 1–4 unit/E2E regression remains green.

Do not hard-code the historical `92` test count as an acceptance target; the final evidence must record the actual post-remediation test count.

## 13. Verification Commands
Run the repository's actual scripts after confirming them from `package.json`. Expected gate set:
- `pnpm test`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- `pnpm test:e2e`

Playwright must run in an environment with the required browser runtime installed. An environment-blocked E2E run is not a Gate 4 PASS.

## 14. Gate 4 Remediation Acceptance
Gate 4 may return to independent review only when:
- canonical schema v2 and explicit v1→v2 migration are implemented and tested;
- image attach/remove UI uses canonical line-item state rather than component-only storage;
- resize/compression/encoded-size guard is enforced against the exact persisted representation;
- autosave/restore and JSON export/import round-trip accepted images;
- storage failure still preserves in-memory work and backup export capability;
- preview/print renders accepted images without editor leakage or critical layout failure;
- no backend/cloud/PDF/calculation scope drift is introduced;
- unit, typecheck, lint, build, and Playwright E2E pass;
- `docs/PHASE4_IMPLEMENTATION_EVIDENCE.md` receives a remediation addendum with exact files changed, migration behavior, constants, commands/results, test counts, limitations, and diff summary.

## 15. Explicit Non-Scope
- image hosting/CDN or cloud storage
- reusable product image library
- image cropping/editor UI beyond required resize/compression
- OCR or AI image processing
- multiple images per line item
- document template/theme expansion
- PromptPay QR implementation
- billing/payment confirmation

## 16. Stop Conditions
Stop remediation and return to documentation/review if implementation would require:
- a schema change beyond the authorized v2 `LineItem.image` amendment;
- loss of compatibility with valid v1 local drafts/backups;
- a fixed total browser storage quota assumption;
- backend/cloud storage to satisfy V1;
- modification of Phase 1 calculation/tax contracts;
- weakening import validation or accepting untrusted external image URLs.

## 17. Handoff
After implementation and evidence are complete:
1. rerun independent Gate 4 review against the actual remediation commit;
2. separately close Gate 3 with the required manual Chrome/Edge native print acceptance;
3. keep Phase 5 implementation blocked until both Gate 3 and Gate 4 are PASS.

Phase 5 documentation may remain prepared, but no Phase 5 production code is authorized by this remediation brief.