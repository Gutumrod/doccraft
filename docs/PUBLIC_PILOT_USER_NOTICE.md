# DocCraft Public Pilot — User Notice

> **Effective:** 2026-09-07
> **Scope:** Free local-first Public Pilot
> **In-product surface:** `src/ui/editor/PilotNotice.tsx`

## ก่อนใช้งาน
DocCraft Public Pilot เป็นเครื่องมือช่วยสร้างเอกสารธุรกิจในเบราว์เซอร์ โดยยังไม่มีระบบบัญชีผู้ใช้หรือ Cloud Backup

- เอกสารและรูปที่เพิ่มจะเก็บใน Browser Storage ของอุปกรณ์ที่ใช้งาน
- หากล้างข้อมูลเว็บไซต์ เปลี่ยนเบราว์เซอร์/โปรไฟล์ หรืออุปกรณ์เสีย ข้อมูลอาจสูญหายได้
- รอบ Public Pilot นี้ไม่ส่ง analytics หรือ telemetry ออกจากเบราว์เซอร์โดยอัตโนมัติ
- ระบบไม่ได้อัปโหลดเอกสารลูกค้าไปยัง backend ของ DocCraft ใน V1 นี้

## การพิมพ์และ PromptPay
- เอกสารพิมพ์ผ่าน native browser print dialog; ผลลัพธ์อาจต่างเล็กน้อยตาม browser, OS และเครื่องพิมพ์
- PromptPay QR เป็น payment instruction เท่านั้น ไม่ได้ยืนยันว่าเงินถูกโอนหรือรับสำเร็จ
- ผู้ใช้งานต้องตรวจเลขบัญชี/identifier, จำนวนเงิน และเนื้อหาเอกสารก่อนส่งให้ลูกค้า

## ภาษีและความถูกต้องของเอกสาร
DocCraft ไม่ใช่ระบบบัญชีหรือบริการให้คำปรึกษาด้านภาษี แม้ระบบมี validation สำหรับข้อมูลบางประเภท ผู้ใช้งานยังต้องรับผิดชอบการตรวจความถูกต้องและความเหมาะสมของเอกสารในกรณีใช้งานจริง

## Support
Controlled Public Pilot ใช้ช่องทาง:
`https://github.com/Gutumrod/doccraft/issues`

- best-effort support
- ไม่มี SLA ในรอบ Pilot
- โปรดไม่แนบเอกสารจริง ข้อมูลลูกค้า เลขภาษี เบอร์ PromptPay หรือข้อมูลส่วนบุคคล หากไม่จำเป็นต่อการรายงานปัญหา

## สิ่งที่ยังไม่มีใน Public Pilot
- login/account
- cloud sync / cloud backup
- payment confirmation
- subscription/billing
- guaranteed uptime
