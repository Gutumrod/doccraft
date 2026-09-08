# DocCraft — Product Validation Plan

> **Status:** Public Pilot / PV Gate OPENED 2026-09-08 — validation contract active
> **Date:** 2026-08-22
> **Purpose:** กำหนดว่าต้องเรียนรู้อะไรจาก Free MVP/Pilot ก่อนลงทุนใน Cloud/Pro

**Execution amendment — 2026-09-08:** Gate 6 is PASS/CLOSED and the Public Pilot / PV Gate is now open for real-user evidence collection. Execution details and privacy-safe evidence templates are in `BRIEF-public-pilot-pv-gate-2026-09-08.md`, `PUBLIC_PILOT_EVIDENCE_LOG.md`, `PUBLIC_PILOT_INTERVIEW_GUIDE.md`, and `PV_GATE_DECISION_TEMPLATE.md`. Phase 7 remains frozen until PV Gate = PASS and explicit Owner authorization.

## 1. Validation Objective
พิสูจน์ว่ากลุ่มเป้าหมายใช้ DocCraft ทำเอกสารจริงซ้ำ และระบุ pain ที่มีมูลค่าพอให้สร้าง paid capability ต่อ

## 2. Pilot Segments
ต้องมีผู้ใช้จากอย่างน้อย 3 กลุ่ม: freelancer/contractor, custom workshop/service shop, micro-SME.

ห้ามสรุป product-market fit จากผู้ใช้ประเภทเดียวหรือ demo usage อย่างเดียว

## 3. Core Funnel
`Visit → Create document → Preview → Print/Save via browser → Return and create again`

Activation = ผู้ใช้สร้างเอกสารที่ valid และไปถึง preview/print action ใน session แรก
Repeat use = ผู้ใช้กลับมาสร้างหรือแก้เอกสารอีกในวัน/สัปดาห์ถัดไป

## 4. Questions to Answer
- core loop เข้าใจง่ายหรือไม่
- document type ไหนถูกใช้จริง
- mobile usage มี pain จุดใด
- local-first/JSON backup เพียงพอหรือไม่
- cloud sync/history/catalog เป็น pain ซ้ำจริงหรือไม่
- willingness-to-pay อยู่ช่วงใดและจ่ายเพื่อ capability ไหน
## 5. Evidence to Collect
- anonymous/consented product events ตาม `MVP_METRICS_AND_ANALYTICS.md`
- structured interview notes โดยไม่เก็บข้อมูลลูกค้าเกินจำเป็น
- support issues และ recurring failure themes
- feature requests แยก frequency, severity, willingness-to-pay

## 6. Decision Gates
**Continue improving Free MVP:** activation ต่ำเพราะ usability/quality issue

**Open Phase 7 candidate review:** มี repeat usage และ recurring pain เรื่อง cross-device/history/reusable data จากผู้ใช้จริงหลายราย

**Do not open Phase 7:** cloud feature เป็นเพียงความเห็นเชิงสมมติ ไม่มี repeat usage หรือไม่มี evidence ว่าจะแก้ pain หลัก

**Open paid experiment:** capability ที่ผู้ใช้ต้องการซ้ำถูกระบุชัดและ willingness-to-pay มีหลักฐาน

## 7. Pilot Exit Criteria
ก่อนถือว่า Pilot Validation Gate ผ่าน ต้องมี:
- evidence จากผู้ใช้จริงมากกว่า demo/internal testing
- funnel/usage summary
- recurring pain summary
- top support issues
- explicit decision: iterate V1 / open Phase 7 / stop or reposition

ตัวเลขเป้าหมายขั้นต่ำเชิงธุรกิจให้กำหนดหลังเริ่ม pilot จาก observed baseline ห้ามสร้างตัวเลข conversion/retention แบบเดาเป็น acceptance fact
