# DocCraft — Business Model & Commercial Hypotheses

> **Status:** Commercial Hypothesis — Not Engineering Contract
> **Version:** 2.0 Reality-Aligned
> **Target Segments:** Freelancers, field contractors, custom workshops, micro-SMEs

## 1. Core Value Proposition

DocCraft ลด friction ในการออกเอกสารธุรกิจจากมือถือหรือคอม โดยเน้นความเร็ว ความยืดหยุ่นของบล็อก และ A4-ready output โดยไม่บังคับให้ผู้ใช้เข้าสู่ระบบบัญชีเต็มรูปแบบ

V1 value drivers ที่มีใน product scope จริง:
- สร้าง quotation/invoice/receipt/work order โดยไม่ login
- modular blocks และ calculation helpers
- mobile-friendly editor + A4 preview
- local autosave + JSON backup
- optional PromptPay QR instruction บนเอกสาร

ห้ามใช้ E-Sign, cloud sync, autocomplete หรือ Excel report เป็น V1 selling point จน capability นั้น implement และผ่าน gate แล้ว

## 2. Monetization Hypothesis

แนวทางหลัง MVP:
- Free: core local-first document creation
- Pro: cloud sync, reusable customers/catalog, cross-device access
- Later paid add-ons/capabilities อาจรวม lifecycle conversion, reporting หรือ E-Sign หาก validation รองรับ

ราคาเดิม `฿290/month`, `฿2,490/year`, `฿1,490 lifetime` ให้ถือเป็น **HYPOTHESIS** ไม่ใช่ราคาที่อนุมัติถาวร
## 3. Unit Economics Policy

ก่อนมี production usage ห้ามระบุตัวเลขต่อไปนี้เป็น fact:
- cost per user
- gross margin percentage
- support capacity ต่อคน
- conversion uplift
- time saved ต่อวัน

ต้องเก็บข้อมูลจริงอย่างน้อย:
- hosting/database/storage usage
- payment processing fee จริง
- active users / paid users
- storage per active account
- support tickets / active account
- churn / retention

จากนั้นค่อยสร้าง observed unit economics

## 4. Commercial Validation Questions

ก่อนเปิด Pro ต้องตอบจากผู้ใช้จริง:
1. เขาใช้ DocCraft ซ้ำหรือไม่
2. pain หลักคือออกเอกสารเร็ว, เก็บข้อมูลซ้ำ, sync หรือ workflow อื่น
3. feature ไหนที่ยอมจ่ายเงินจริง
4. willingness-to-pay อยู่ช่วงใด
5. cloud sync มีมูลค่าพอเป็น subscription หรือไม่

## 5. Pricing Guardrail

ราคาและแพ็กเกจต้อง configurable และเปลี่ยนได้โดยไม่แก้ core document domain
Lifetime deal ห้ามขายจนต้นทุนระยะยาวและ entitlement policy ถูกกำหนด
Pro claim ต้องอิง capability ที่ deployed จริงเท่านั้น