# DocCraft — Business Logo / Branding Block Proposal

> **Status:** DECISION RECORDED — APPROVED FOR V1 PHASE 4.1; IMPLEMENTATION NOT OPENED
> **Date:** 2026-08-28
> **Product:** DocCraft
> **Authority:** Must not override `PRD.md → SYSTEM_ARCHITECTURE.md → ROADMAP.md → IMPLEMENTATION_PLAN.md`

## 1. Product Rationale

ผู้ใช้ DocCraft ที่เป็นร้าน ฟรีแลนซ์ หรือธุรกิจซึ่งมีแบรนด์ของตนเองควรสามารถแสดงโลโก้บนเอกสารเพื่อเพิ่มความเป็นทางการ ความน่าเชื่อถือ และการจดจำแบรนด์ โดยไม่ทำให้ DocCraft กลายเป็น template designer เต็มรูปแบบ

เอกสารนี้เริ่มต้นเป็น proposal เพราะ authoritative V1 contract เดิมมี `Business/header` และ optional `Item image column` แต่ยังไม่มี business logo. วันที่ 2026-08-28 product owner อนุมัติ constrained single-logo capability ให้เข้า V1 ผ่าน Phase 4.1 แล้ว โดย authority ที่ใช้ implement ต้องอ้าง `PRD.md → SYSTEM_ARCHITECTURE.md → ROADMAP.md → IMPLEMENTATION_PLAN.md` ที่แก้ตาม decision นี้ ไม่ใช่อ้าง proposal นี้เพียงฉบับเดียว

## 2. Proposed Capability

เพิ่ม **Optional Business Logo Block** ในส่วนหัวของเอกสาร

Behavior baseline:
- ผู้ใช้อัปโหลดโลโก้ได้ 1 รูปต่อ current document-level `branding` state; reusable/shared Business Profile branding เป็น Phase 7+ concern
- เปิด/ปิดการแสดงโลโก้ได้โดยไม่ลบข้อมูลที่ persist ไว้
- Preview และ native print แสดง canonical image เดียวกัน
- ไม่มีผลต่อ calculation, VAT, WHT, deposit, rounding หรือ tax-invoice eligibility
- V1-style browser-first implementation; ห้ามเพิ่ม backend เพียงเพื่อรองรับโลโก้

## 3. Recommended Layout Contract

- Default placement: มุมซ้ายบนของ document header
- Preserve aspect ratio เสมอ
- Suggested display bounds: max width 120–160 px, max height 60–80 px
- ห้าม free-drag, arbitrary positioning หรือ unrestricted resize ใน capability แรก
- หากไม่มีโลโก้ layout ต้องยุบพื้นที่อย่างเป็นธรรมชาติและไม่เหลือ placeholder
## 4. Image Contract

Initial accepted source formats:
- PNG
- JPEG/JPG
- WebP

Canonical persisted form should reuse the proven client-side image safety principles already established by Phase 4 where practical:
- validate source MIME
- decode client-side
- resize before persistence
- preserve aspect ratio
- enforce encoded-size guard
- reject malformed/unsupported content safely

Logo-specific limits must be defined separately from item-image limits if visual quality or storage characteristics differ. Do not silently reuse constants without review.

## 5. Print Requirements

- Chrome/Edge desktop remain reference environments
- logo must render in A4 preview and native print input without clipping
- no editor/upload/remove controls may leak into print
- transparent PNG/WebP must remain visually acceptable on white paper
- grayscale/monochrome printing should remain legible as a compatibility target, not a guaranteed logo-quality claim
- logo must not cause header, document title, business details, table, or pagination to overflow critically

## 6. Persistence / Failure Behavior

- hiding the logo block must not delete the stored logo
- failed replacement must preserve the previously accepted logo
- quota/storage failure must preserve current in-memory document state
- JSON export/import must round-trip the canonical logo if the feature is part of the approved schema
- schema migration must be explicit if `DocCraftDocument` changes
## 7. Explicit Non-Scope

Capability แรกนี้ไม่รวม:
- template marketplace
- drag-and-drop page designer
- arbitrary logo positioning
- multiple logos/watermarks
- brand color extraction
- AI logo generation
- cloud asset library
- organization-wide brand kit

## 8. Acceptance Criteria Proposal

1. Upload PNG/JPEG/WebP ที่ valid แล้ว preview แสดงโลโก้ตาม layout contract
2. Invalid/oversized image ถูก reject โดยไม่ทำ accepted logo เดิมหาย
3. Hide/show block ไม่ทำ persisted logo หาย
4. Refresh restore และ JSON export/import round-trip ผ่านเมื่อ feature อยู่ใน approved schema
5. Native print แสดงโลโก้โดยไม่มี editor controls, critical clipping หรือ horizontal overflow
6. Documents without logo ยังคง layout เดิมโดยไม่มี regression
7. Calculation/tax regression suite ให้ผลเท่าเดิมทุกกรณี
8. Unit + E2E + reference print evidence ต้องผ่านก่อน gate review

## 9. Approved Roadmap Placement

**Approved placement:** **Phase 4.1 — Business Logo / Branding Block**, inserted after Phase 4 and before Phase 5.

เหตุผล:
- single business logo เป็น baseline document identity มากกว่า advanced template/theme customization
- Phase 4 มี client-side image safety/persistence primitives ที่เหมาะจะ reuse โดยยังต้องแยก logo-specific limits
- การทำก่อน Phase 5/6 ทำให้ schema migration, persistence, JSON backup และ print regression ถูก harden ใน MVP เดียวกัน
- advanced templates/themes, arbitrary layout, multiple logos/watermarks และ brand kit ยังคง Phase 9/post-MVP

Authority update required and completed at documentation level:
- `PRD.md` — V1 logo data/behavior/acceptance
- `SYSTEM_ARCHITECTURE.md` — canonical image/persistence boundary
- `ROADMAP.md` — Phase 4.1 placement/gate
- `IMPLEMENTATION_PLAN.md` — execution scope/tests/evidence

Production implementation ยังต้องใช้ execution brief และ gate protocol; proposal นี้ไม่ใช่สิทธิ์ให้ข้าม brief/review

## 10. Recorded Decision

**APPROVED — SHIP IN V1 AS A CONSTRAINED SINGLE BUSINESS LOGO BLOCK.**

ขอบเขตที่อนุมัติคือ fixed header placement, one logo, show/hide, local persistence, JSON round-trip และ native print เท่านั้น ไม่ใช่ template designer หรือ brand kit