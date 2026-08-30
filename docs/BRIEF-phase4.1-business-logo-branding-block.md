# DocCraft — Phase 4.1 Business Logo / Branding Block

> **Status:** REVIEWED — READY AFTER GATE 3; NOT OPENED FOR IMPLEMENTATION
> **Date:** 2026-08-28
> **Repository:** `Gutumrod/doccraft`
> **Local baseline observed:** `master @ 2a8652e`
> **Authority:** `PRD.md → SYSTEM_ARCHITECTURE.md → ROADMAP.md → IMPLEMENTATION_PLAN.md`

## 1. Objective

เพิ่ม optional single business logo ให้เอกสาร V1 เพื่อให้ quotation/invoice/receipt/work order/tax invoice มี baseline business identity โดยไม่ขยายเป็น template designer และไม่เพิ่ม backend dependency

Phase 4.1 เป็น approved V1 insertion หลัง Phase 4 และก่อน Phase 5. เอกสารนี้เตรียม execution scope เท่านั้น; production code ยังห้ามแก้จนมีคำสั่งเปิด Phase 4.1

## 2. Mandatory Intake Before Coding

ก่อนแก้ production code ต้องตรวจใหม่ทุกครั้ง:
- branch, `git status`, HEAD และ remote divergence
- unrelated dirty/untracked files ต้อง preserve; ห้าม clean/reset ทิ้ง
- package manager, dependencies, scripts และ baseline tests
- current schema/migration path และ persistence validators; if implementation baseline remains version 2, bump to version 3 and migrate old documents with `blocks.businessLogo = true`
- current item-image processor และ tests ก่อนตัดสิน shared abstraction

Review note (2026-08-29): scope/architecture review passed against the authoritative chain after local fast-forward to `2a8652e`. Gate 4 is independently PASS. Phase 4.1 remains unopened only because Gate 3 still requires the separate manual multi-page native-print acceptance.

Observed implementation facts at brief preparation:
- `CURRENT_SCHEMA_VERSION = 2`
- `BusinessProfile` อยู่ที่ `src/domain/tax/types.ts`
- `ItemImage` persisted shape = `dataUrl`, `mimeType`, `width`, `height`
- current persisted item-image MIME = JPEG/WebP
- current item-image source formats = PNG/JPEG/WebP
## 3. Approved Scope

- optional logo: maximum 1 accepted logo per current document-level `branding` state
- explicit `blocks.businessLogo` show/hide state; default true for new/migrated documents; hiding must not delete persisted logo
- upload source: PNG, JPEG/JPG, WebP
- decode and validate source client-side before acceptance
- canonical persisted asset must be JPEG/WebP data URL + positive width/height
- preserve aspect ratio
- fixed document-header placement; default upper-left within business/header composition
- logo-specific max dimensions, quality/retry policy and encoded-size guard
- failed replacement preserves the previously accepted logo
- autosave/restore and storage-failure behavior follow Phase 4 contracts
- JSON export/import round-trips accepted logo and visibility state
- A4 preview and native print use the same canonical logo asset
- no-logo documents must preserve current layout behavior

## 4. Explicit Non-Scope

- backend, Supabase, auth, cloud storage or asset library
- multiple logos, watermark or sponsor marks
- drag/drop, free positioning or arbitrary resize controls
- template marketplace or page designer
- brand color extraction, brand kit or organization-wide branding
- AI logo generation
- changes to calculation, VAT, WHT, deposit, rounding or tax-invoice eligibility
- Phase 5 PromptPay behavior

## 5. Implementation Boundaries

Inspect first; do not assume final file set. Current likely touchpoints include:
- `src/domain/document/types.ts` for document-level branding/schema ownership; do not place image payload in `src/domain/tax/types.ts` / `BusinessProfile`
- `src/image/item-image.ts` only for reusable primitives; do not silently reuse item-image constants
- `src/persistence/validation.ts` and schema migration code
- `src/ui/editor/sections/BusinessSection.tsx`
- `src/ui/preview/DocumentPreview.tsx` and print CSS/layout
## 6. Required Failure Semantics

1. Unsupported/malformed/decode failure → reject new source; keep current accepted logo.
2. Encode/resize/size-guard failure → reject candidate; keep current accepted logo.
3. Storage/quota failure → keep current in-memory document usable and surface actionable error.
4. Corrupted imported logo → reject import before replacing current document state.
5. Hide/show operation → only changes visibility; never clears logo data.

## 7. Required Verification

- unit tests for logo structural validation and size limits
- migration test from schema version 2 document without logo
- persistence restore + JSON export/import round-trip
- replacement-preservation negative tests
- editor E2E: upload, replace failure, hide/show and refresh
- preview/print E2E: logo/no-logo, transparent-source case, long business name/address
- verify no editor/upload/remove controls leak into print
- verify no critical header/table overlap or horizontal overflow
- existing calculation/tax tests unchanged
- full lint, typecheck, unit tests, E2E and production build

## 8. Gate 4.1 Evidence

Evidence document must record files changed, schema migration decision, limits chosen and rationale, commands/tests run, results, reference print evidence, known limitations, git diff summary and independent reviewer verdict.

**PASS condition:** all automated gates green, reference print evidence acceptable, no unrelated scope drift, no backend dependency, and reviewer confirms failure preservation + persistence round-trip + no-logo regression.

## 9. Stop Conditions

STOP and return to documentation/review if implementation requires backend/cloud storage, a new layout engine, cross-phase PromptPay changes, incompatible schema reset, or cannot preserve existing schema-2 documents safely.