# DocCraft — Product One-Pager

> **Status:** Pre-Launch Product Summary
> **Version:** 2.0 — Derived from PRD V2

## Product

DocCraft คือ browser-first document studio สำหรับฟรีแลนซ์ ช่าง ร้านงานสั่งทำ และธุรกิจขนาดเล็ก ที่ต้องการทำใบเสนอราคา ใบแจ้งหนี้ ใบเสร็จ และใบงานจากมือถือหรือคอม โดยไม่ต้องใช้ระบบบัญชีเต็มรูปแบบ

Core loop:
`เลือกเอกสาร → กรอกข้อมูล → เปิด/ปิดบล็อก → ตรวจยอด → Preview A4 → Print ผ่าน browser`

## Target V1 Capabilities
รายการต่อไปนี้เป็น target ของ V1; ก่อน Phase 6 gate ห้ามนำเสนอเป็น capability ที่ release แล้ว
- ใช้งานโดยไม่ต้อง login
- Quotation / Invoice / Receipt / Work Order
- แยกสถานะบุคคล/นิติบุคคลออกจาก VAT registration
- modular blocks: ข้อมูลธุรกิจ ลูกค้า รายการ รูป ภาษี/WHT/มัดจำ เงื่อนไข ลายเซ็น placeholder
- calculation engine สำหรับส่วนลด VAT WHT และ deposit ตามข้อมูลที่กำหนด
- optional PromptPay QR สำหรับยอดเอกสาร
- desktop editor + live preview
- mobile editor/preview switcher
- พิมพ์ผ่าน browser print dialog แบบ A4; หาก browser/OS รองรับ ผู้ใช้เลือก Save as PDF จาก dialog ได้เอง (DocCraft ไม่ได้ generate PDF โดยตรง)
- local autosave + JSON Import/Export backup

## Positioning

DocCraft ไม่ใช่โปรแกรมบัญชีเต็มรูปแบบ และ V1 ไม่ใช่ e-Tax Invoice/e-Receipt platform
จุดขายคือการทำเอกสารให้เร็วและยืดหยุ่น โดยยังควบคุมรูปแบบ A4 และข้อมูลในเอกสารได้อย่างเป็นระบบ
## Data & Privacy Model

Free V1 เก็บ draft ใน browser ของผู้ใช้เป็นหลัก และมี JSON backup
Local persistence ไม่ใช่ durable cloud backup; ถ้าพื้นที่ browser เต็มหรือถูกล้าง ระบบต้องแจ้งเตือนและให้ผู้ใช้ export ข้อมูลได้

## Post-MVP Candidates
หลัง MVP ผ่าน validation จึงพิจารณา:
- account/cloud sync
- reusable customer/product catalog
- cross-device history
- lifecycle conversion
- reports/Excel
- templates/themes
- E-Sign/public customer links

## Pricing
ยังไม่ประกาศราคา Pro เป็น contract ในเอกสารนี้ ราคาเดิมทั้งหมดอยู่ในสถานะ commercial hypothesis จนกว่าจะ validate กับผู้ใช้จริง

## Claim Guardrail
ห้ามเคลมว่า:
- เอกสารถูกกฎหมาย/ภาษี 100% ทุกกรณี
- PDF เหมือนกันทุก browser
- ประหยัดเวลาเป็นจำนวนตายตัว
- เพิ่ม conversion หรือ cashflow แบบรับประกัน
- cloud, E-Sign, Excel หรือ billing มีแล้ว หากยังไม่ผ่าน roadmap gate