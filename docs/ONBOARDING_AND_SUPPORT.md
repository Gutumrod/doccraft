# DocCraft — Onboarding & Support Contract

> **Status:** Pre-Launch Operational Contract
> **Date:** 2026-08-22
> **Scope:** Free local-first V1; expand before Cloud/Pro launch

## 1. First-Use Onboarding
ผู้ใช้ต้องสามารถจบ flow โดยไม่ต้องมีเจ้าหน้าที่ช่วย:
`Choose type → Business/Customer → Items → Adjustments → Preview → Print → Backup`

Onboarding ต้องอธิบายชัด:
- V1 ไม่ต้อง login
- draft เก็บใน browser เป็นหลัก
- Save as PDF มาจาก browser/OS print dialog
- JSON Export คือ backup/portability contract
- Tax Invoice มี validation แต่ DocCraft ไม่รับรอง legal/tax compliance ทุกกรณี

## 2. In-Product Help Requirements
- field-level validation message ต้อง actionable
- storage failure ต้องบอกว่า current in-memory work ยังอยู่หรือไม่
- import failure ต้องไม่ replace document เดิม
- print help ต้องระบุ reference browsers ที่ผ่านการทดสอบ
- unsupported/deferred capability ต้องไม่แสดงเป็นของพร้อมใช้

## 3. Support Entry Points
ก่อน Public Pilot ต้องมี support contact ที่ประกาศจริงอย่างน้อยหนึ่งช่องทาง และระบุเวลาตอบโดยไม่สัญญา SLA เกินกำลัง

ทุกเคส support ควรบันทึก: category, browser/device, app version, reproduction steps, severity และ resolution โดยหลีกเลี่ยงการขอข้อมูลเอกสารลูกค้าเกินจำเป็น
## 4. Support Troubleshooting Matrix
- **Draft missing:** ตรวจ browser/profile, storage availability, JSON backup; ห้าม claim ว่ากู้ local data ได้เสมอ
- **Storage full/blocked:** รักษา in-memory state, ให้ Export JSON, ลด/ลบรูปตาม product flow
- **Import rejected:** แสดง schema/version/error โดยไม่ overwrite state
- **Print clipped/different:** ตรวจ reference Chrome/Edge, page size A4, scale/margins; browser อื่นเป็น compatibility target
- **Tax/VAT question:** อธิบาย app behavior เท่านั้น; เรื่องการตีความภาษีเฉพาะกรณีให้ผู้ใช้ปรึกษาผู้เชี่ยวชาญ
- **PromptPay QR issue:** ตรวจ identifier/amount; V1 ไม่ยืนยันการรับเงิน

## 5. Severity
- **P0:** data corruption/security issue หรือ core loop ใช้ไม่ได้วงกว้าง
- **P1:** core feature หลักเสียแต่มี workaround จำกัด
- **P2:** non-blocking defect/compatibility/usability issue
- **P3:** question/feature request

P0/P1 ต้องเข้าสู่ release/hotfix process ใน `RELEASE_AND_OPERATIONS_RUNBOOK.md`

## 6. Support Feedback Loop
ปัญหาซ้ำต้องถูกส่งเข้า `PRODUCT_VALIDATION_PLAN.md` และ release backlog; ห้ามแก้ด้วยการเพิ่ม feature นอก PRD โดยไม่ผ่าน scope review

ก่อนเก็บเงินจริง ต้องขยายเอกสารนี้ด้วย paid support channel/response target และเชื่อม `SERVICE_OPERATIONS.md`
