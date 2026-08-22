# DocCraft — Monetization & Payment Flow

> **Status:** Commercial Strategy Hypothesis
> **Version:** 2.0 Reality-Aligned

## 1. Payment Contexts

DocCraft มี payment context แยกกันสองแบบและต้องออกแบบคนละระบบ

### Document Payment Instruction
PromptPay QR ที่อยู่บนเอกสารเป็นข้อมูลสำหรับลูกค้าของผู้ใช้ DocCraft

V1 รองรับ:
- client-side QR generation
- เลือกยอด deposit, net payable หรือไม่กำหนดยอด
- ไม่มีการยืนยันการรับเงินอัตโนมัติ
- ไม่มีการเปลี่ยนสถานะ paid อัตโนมัติ

### DocCraft Commercial Billing
ระบบเก็บค่าบริการ DocCraft อยู่ใน Phase 8 และไม่ใช่ส่วนหนึ่งของ V1
## 2. Subscription Design Requirements

ก่อนเปิด paid plan ต้องกำหนด:
- entitlement lifecycle
- supported payment method/provider
- renewal policy
- cancellation/expiry behavior
- webhook verification and idempotency
- reconciliation path เมื่อสถานะ provider กับระบบไม่ตรงกัน

PromptPay ห้ามถูกอธิบายว่าเป็น recurring rail โดยอัตโนมัติ หาก provider flow ที่เลือกไม่รองรับ recurring charge

## 3. Pricing Status

ตัวเลขต่อไปนี้เป็น hypothesis เท่านั้น:
- ฿290/month
- ฿2,490/year
- ฿1,490 lifetime early-bird

ยังไม่ควร lock pricing จนมีข้อมูล:
- repeat usage
- willingness-to-pay
- actual infrastructure cost
- payment fees
- retention/churn
- support burden

## 4. Commercial Rollout Order

1. ปล่อย Free MVP และวัดการใช้งานจริง
2. หา recurring use case และ feature ที่ผู้ใช้ขอซ้ำ
3. ผ่าน PV Pilot Validation Gate แล้วจึงเปิด Phase 7 cloud foundation เมื่อมี repeat usage/recurring pain รองรับ
4. ทดสอบ pricing ก่อนสร้าง billing automation เต็มรูปแบบ
5. เปิด Phase 8 billing หลัง entitlement/payment contract ผ่าน review