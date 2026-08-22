# DocCraft — MVP Metrics & Analytics Contract

> **Status:** Pre-Pilot Measurement Contract
> **Date:** 2026-08-22
> **Principle:** วัดพฤติกรรมที่จำเป็นต่อ product validation โดยลดการเก็บข้อมูลส่วนบุคคลให้มากที่สุด

## 1. MVP Questions
ต้องตอบให้ได้ว่า:
- ผู้ใช้ไปถึง core outcome หรือไม่
- ผู้ใช้กลับมาใช้ซ้ำหรือไม่
- จุดใดของ flow ทำให้ล้มเหลว
- capability ไหนถูกใช้จริง
- support pain ใดเกิดซ้ำ

## 2. Core Event Vocabulary
Candidate events เมื่อ analytics ถูกเปิดจริง:
- `app_opened`
- `document_started` พร้อม document type เท่านั้น
- `preview_opened`
- `print_clicked`
- `json_exported`
- `json_import_succeeded` / `json_import_failed`
- `storage_error`
- `promptpay_qr_rendered`

Event schema ต้อง versioned และ documented ก่อน production use.

## 3. Prohibited Analytics Payloads
ห้ามส่ง document/customer contents, names, addresses, tax IDs, phone/email, PromptPay identifiers, item descriptions, notes, JSON backup payload หรือรูปเอกสารไป telemetry โดย default.
## 4. KPI Definitions
- Activation = first valid document reaches preview/print path
- Core completion = representative document reaches print action without blocking validation error
- Repeat usage = same anonymous/consented client returns and creates/edits document in later period, only if measurement method is privacy-approved
- Error rate = blocking product errors per relevant attempt
- Support burden = categorized support cases per active usage cohort when data exists

ห้ามตั้ง retention/conversion target เป็น fact ก่อนมี observed baseline.

## 5. Collection Modes
ก่อน telemetry implementation หรือ Public Pilot ต้องเลือกและบันทึกหนึ่งแบบ:
1. **No telemetry:** validation จาก pilot interviews/support/manual observation
2. **Anonymous minimal telemetry:** random non-PII client/session identifier + allowed events
3. **Consented analytics:** ใช้เมื่อ product/legal review ต้องการ consent

ห้ามเพิ่ม third-party analytics SDK โดย silent dependency drift; ต้องผ่าน architecture/privacy review.

## 6. Reporting
Pilot summary ต้องรวม funnel, repeat usage signal, top errors, top support issues และ qualitative feedback โดยไม่เปิดเผยข้อมูลเอกสารลูกค้า.

Metrics ใช้ตัดสิน `PRODUCT_VALIDATION_PLAN.md`; ไม่ใช้ vanity metrics เช่น page views เพียงอย่างเดียวเป็นเหตุเปิด Phase 7.
