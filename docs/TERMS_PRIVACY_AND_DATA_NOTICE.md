# DocCraft — Terms, Privacy & Data Notice Framework

> **Status:** Product/Operations Framework — Legal Review Required Before Public Launch
> **Date:** 2026-08-22
> **Rule:** เอกสารนี้ไม่ใช่คำรับรองทางกฎหมายหรือภาษี และต้องทบทวนอีกครั้งเมื่อมี Cloud/Account/Payment

## 1. V1 Data Model Notice
Free V1 เป็น local-first: document draft และข้อมูลที่ผู้ใช้กรอกถูกออกแบบให้เก็บใน browser ของผู้ใช้เป็นหลัก เว้นแต่ capability อื่นถูกเพิ่มและประกาศภายหลัง

DocCraft ต้องไม่ทำให้ผู้ใช้เข้าใจว่า local browser storage เป็น durable cloud backup.

JSON Export คือกลไก backup/data portability ของ V1 และผู้ใช้ควรเก็บไฟล์สำรองในที่ที่ตนควบคุม

## 2. User Responsibilities
ผู้ใช้รับผิดชอบความถูกต้องของข้อมูลธุรกิจ ลูกค้า รายการ ภาษี และรายละเอียดการชำระเงินที่กรอก รวมถึงการตรวจเอกสารก่อนส่งหรือพิมพ์

DocCraft เป็นเครื่องมือสร้างเอกสาร ไม่ใช่ผู้ทำบัญชี ที่ปรึกษาภาษี หรือระบบ e-Tax submission ใน V1.

## 3. Product Limitations to Disclose
- browser data อาจถูกลบ/จำกัดโดย browser, OS, private mode, policy หรือผู้ใช้
- print rendering อาจต่างกันระหว่าง environment
- Save as PDF เป็น browser/OS capability
- PromptPay QR เป็น payment instruction; V1 ไม่ยืนยันการรับเงิน
- Tax Invoice validation เป็น product rule ไม่ใช่ certification ว่าเอกสารถูกต้องตามกฎหมายทุกกรณี
## 4. Telemetry / Analytics
ถ้ามี anonymous or consented analytics ต้องระบุ event categories, purpose, retention และข้อมูลที่ไม่เก็บ ตาม `MVP_METRICS_AND_ANALYTICS.md`.

ห้ามส่ง document contents, customer names, tax IDs, addresses, PromptPay identifiers หรือ free-text notes ไป analytics โดย default.

ถ้า V1 ไม่มี telemetry จริง ต้องไม่แสดงข้อความว่าเก็บ analytics.

## 5. Support Data
เมื่อผู้ใช้ติดต่อ support ให้เก็บเฉพาะข้อมูลที่จำเป็นต่อการวิเคราะห์ปัญหา และหลีกเลี่ยงการขอไฟล์เอกสารจริง/ข้อมูลส่วนบุคคลเมื่อ reproduction ด้วยข้อมูลตัวอย่างเพียงพอ.

## 6. Cloud/Account Expansion Trigger
ก่อน Phase 7 public launch ต้องทำ privacy review ใหม่ครอบคลุม account identifiers, cloud documents, storage, retention, export/deletion, access control, subprocessors และ incident handling.

## 7. Paid/Billing Expansion Trigger
ก่อนรับเงินต้องเพิ่ม commercial terms: ราคา รอบบิล renewal cancellation refund/credit policy, tax document ของค่าบริการ DocCraft และ payment-provider disclosure ตาม flow ที่ใช้จริง.

## 8. Publication Gate
ก่อน Public Pilot ต้องแปลง framework นี้เป็นข้อความที่ผู้ใช้เข้าถึงได้จริง และให้ reviewer ตรวจว่าตรงกับ deployed behavior.

ก่อน Paid Launch ต้องมี legal/privacy review ที่เหมาะสมกับประเทศและบริการจริง; ห้ามถือ framework ภายในนี้เป็น legal sign-off.
