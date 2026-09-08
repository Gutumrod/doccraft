# BRIEF — DocCraft Public Pilot / PV Gate — 2026-09-08

> **Product:** DocCraft (DC01)
> **Mode:** Public Pilot execution / validation only
> **Gate 6:** PASS / CLOSED
> **Reviewed V1 implementation:** `01115cc908adcbc4224d3d7878f8680da287439e`
> **Gate 6 closure checkpoint:** `74be1d040ffe913ea87fa25c0487f2096e6419d3`
> **Production:** `https://dc01.wstera.com`
> **Status:** OPENED — evidence collection starts from zero real-user evidence

## 1. Objective

พิสูจน์จากผู้ใช้จริงว่า DocCraft V1 ถูกใช้ทำเอกสารจริงซ้ำ และระบุ pain ที่มีน้ำหนักพอจะ justify การลงทุนใน Phase 7 Cloud/Pro Foundation หรือไม่

Public Pilot นี้ไม่ใช่การเปิด Phase 7 และห้ามใช้ความเห็นเชิงสมมติแทน evidence จากการใช้งานจริง

## 2. Required Pilot Coverage

Pilot ต้องครอบผู้ใช้จริงจากอย่างน้อย 3 กลุ่มตาม `PRODUCT_VALIDATION_PLAN.md`:
- freelancer / contractor
- custom workshop / service shop
- micro-SME

Internal demo, Owner testing และ automated tests ใช้เป็น product-quality evidence ได้ แต่ **ไม่นับเป็น real-user PV evidence**

## 3. Core Funnel to Observe

`Visit → Create document → Preview → Print/Save via browser → Return and create again`

Record separately:
- activation: valid document reaches preview/print in first session
- core completion: reaches print action without blocking validation error
- repeat usage: participant returns in a later day/week and creates or edits again
- abandonment: where and why the user stops

Do not invent conversion or retention targets before an observed baseline exists.

## 4. Evidence Collection Mode

**No telemetry.** Do not add analytics SDK, tracking identifier, Supabase, Auth or backend for this Pilot.

Evidence sources:
- manual observation
- structured participant follow-up/interview
- support issues
- repeat-use confirmation
- recurring pain / feature-request log

Do not record customer document content, tax IDs, PromptPay identifiers, addresses, free-text notes, images or other unnecessary personal data in Pilot evidence.

Use pseudonymous participant IDs such as `PILOT-001`; identity/contact details, if needed operationally, must stay outside the repository.

## 5. Questions PV Must Answer

1. ผู้ใช้เข้าใจ core loop โดยแทบไม่ต้องมีคนสอนหรือไม่
2. document type ใดถูกใช้จริง
3. mobile/tablet มี friction ตรงไหน
4. local browser storage เพียงพอหรือทำให้เกิด pain ซ้ำ
5. cross-device sync / history / reusable customer or catalog data เป็น pain ซ้ำจริงหรือไม่
6. ผู้ใช้กลับมาใช้ DocCraft ซ้ำหรือไม่ และกลับมาเพราะอะไร
7. support issue อะไรเกิดซ้ำ
8. willingness-to-pay ผูกกับ capability ใด ไม่ใช่เพียงคำตอบว่า “น่าจะจ่าย”

## 6. Phase 7 Decision Rule

**PV PASS / authorize Phase 7 candidate review** เฉพาะเมื่อมี:
- real-user evidence มากกว่า demo/internal testing
- coverage จาก required pilot segments
- repeat-use evidence
- recurring cloud/history/reusable-data pain จากผู้ใช้จริงหลายราย
- funnel/usage summary
- recurring-pain summary
- top support issues
- explicit Owner decision หลังอ่าน evidence

หาก evidence ชี้ว่า pain หลักเป็น usability/quality ของ V1 ให้ iterate V1 โดย **ไม่เปิด Phase 7**

หาก cloud pain ยังเป็นเพียงสมมติฐาน ให้ PV ยังไม่ PASS

## 7. Gate 6 Non-Blocking Follow-up

Preserve during Pilot; these do not reopen Gate 6:
- M-1 — application-level no-telemetry wording does not cover Cloudflare provider-layer logging/reporting
- M-2 — production smoke does not directly assert security headers
- M-3 — raw Wrangler dry-run / rollback / deployments-list transcripts were not preserved in the Gate 6 evidence pack
- M-4 — Chrome may use printer-default paper size such as Letter even when print CSS declares A4

Any implementation/remediation for these findings requires its own bounded change and verification. Do not silently mix it into evidence collection.

## 8. Stop Boundary

During this stage do not add:
- Auth / account system
- Supabase / cloud database / cloud sync
- reusable cloud customer/catalog implementation
- billing/subscription/payment confirmation
- telemetry SDK
- Phase 8/9 capabilities

Phase 7 remains **FROZEN until PV Gate = PASS and Owner explicitly authorizes it**.

## 9. Canonical Pilot Artifacts

- `PUBLIC_PILOT_EVIDENCE_LOG.md` — append-only evidence register using pseudonymous IDs
- `PUBLIC_PILOT_INTERVIEW_GUIDE.md` — structured observation/interview guide
- `PV_GATE_DECISION_TEMPLATE.md` — decision shell; no PASS claim until real evidence exists
- `PUBLIC_PILOT_PARTICIPANT_BRIEF.md` — participant-facing instructions that avoid leading the Phase 7 hypothesis

## 10. Stage Start State — 2026-09-08

- Gate 6: PASS / CLOSED
- production availability check: HTTP 200
- external real-user participants recorded: 0
- segment coverage: 0 / 3
- PV Gate: OPEN / evidence collection
- Phase 7: FROZEN
