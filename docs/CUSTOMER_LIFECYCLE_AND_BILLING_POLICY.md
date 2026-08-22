# DocCraft — Customer Lifecycle & Billing Policy

> **Status:** Pre-Billing Operational Contract
> **Date:** 2026-08-22
> **Applies:** Before Phase 8 paid launch

## 1. Lifecycle States
Paid account lifecycle must define at minimum:
`Free/Trial → Active Paid → Payment Failed → Grace (if offered) → Expired/Cancelled → Reactivated`

Each transition must have one authoritative entitlement result.

## 2. Subscribe / Upgrade
Before charging, user must see package, price, billing period, renewal behavior and cancellation path. Entitlement activates only after the selected provider flow reaches the system's accepted paid state.

## 3. Renewal
Recurring renewal may be used only with a payment method/provider that explicitly supports recurring charges. PromptPay transfer/QR must not be described as automatic recurring unless the actual provider flow supports it.

## 4. Payment Failure
Policy must define retry behavior, notification, grace period (if any), entitlement during grace, and final expiry behavior. These values must be configurable rather than hidden in UI code.

## 5. Cancellation
Cancellation must define effective date: immediate or end-of-paid-period. The UI, entitlement service and customer communication must agree.
## 6. Downgrade / Expiry Data Contract
ก่อนเปิด paid plan ต้องกำหนดว่าหลัง downgrade/expiry ผู้ใช้:
- ยังอ่าน/Export ข้อมูลเดิมได้หรือไม่
- แก้/สร้างข้อมูลใหม่ได้ระดับใด
- cloud data retained นานเท่าใด
- deletion request ทำอย่างไร

ห้ามลบข้อมูลทันทีโดยไม่แจ้ง policy ล่วงหน้า.

## 7. Refund / Credit
Refund, prorating หรือ service credit ไม่ควรถูกเดาจาก payment provider default; ต้องมี business policy ที่เผยแพร่จริงก่อนรับเงิน.

## 8. Billing Reliability
Phase 8 implementation ต้องมี webhook verification, idempotency, reconciliation และ audit trail สำหรับ entitlement-changing events.

Provider state กับ DocCraft state ไม่ตรงกันต้องมี manual reconciliation path.

## 9. Customer Billing Documents
เอกสารค่าบริการ DocCraft เองเป็นคนละ context กับ quotation/invoice ที่ผู้ใช้สร้างให้ลูกค้า และต้องออกแบบตาม business/legal setup จริงก่อน paid launch.

## 10. Paid Launch Gate
ห้ามรับเงินจริงจน pricing/package, lifecycle transitions, payment rail, cancellation/refund policy, entitlement tests และ customer-facing terms ตรงกันครบ.
