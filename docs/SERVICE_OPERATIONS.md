# DocCraft — Service Operations Contract

> **Status:** Pre-Paid-Launch Operations Contract
> **Date:** 2026-08-22
> **Scope:** Operational responsibilities once customers depend on DocCraft

## 1. Service Ownership
Before Public Pilot/paid launch assign an owner for: production deploy, incidents, support triage, customer communication, billing reconciliation and privacy/data requests.

## 2. Support Channels & Coverage
Publish only support channels and hours that can actually be staffed. Do not promise 24/7 support or SLA unless resources exist.

Paid plans must state whether support differs by package.

## 3. Incident Severity
- **P0:** security/data corruption/widespread service unavailable
- **P1:** core workflow unavailable for meaningful cohort
- **P2:** degraded/non-blocking defect
- **P3:** question/feature request

Incident process: detect → assess impact → mitigate/rollback → communicate when needed → verify recovery → post-incident record.

## 4. Maintenance
Planned maintenance policy must state whether customer impact is expected and how users are informed. Emergency maintenance may bypass normal scheduling but not evidence/security requirements.

## 5. Cloud Backup & Recovery
When Phase 7 introduces cloud data, document actual backup method, restore procedure, retention, recovery test cadence and failure ownership before selling cloud durability as a benefit.
## 6. Data Export / Deletion / Account Closure
Cloud/paid version ต้องมี procedure สำหรับ export, deletion request, account closure และ retention ที่ตรงกับ public policy และ implementation จริง.

## 7. Billing Operations
ต้องมี reconciliation owner สำหรับ payment succeeded-but-entitlement-missing, duplicate event, refund/cancel mismatch และ provider/system disagreement.

ห้ามแก้ entitlement production โดยไม่มี audit record.

## 8. Security / Privacy Operations
Security/privacy incident ต้อง preserve evidence, limit access, assess affected data, mitigate และใช้ communication/legal process ที่เหมาะสมกับระบบจริง.

Secrets ห้ามถูกส่งผ่าน support ticket/chat โดยไม่จำเป็น.

## 9. Operational Metrics
เมื่อมี production usage ให้ติดตามอย่างน้อย: availability signal, blocking error rate, support volume/category, incident count, billing reconciliation cases และ backup/restore test results เมื่อ applicable.

ห้ามตีความ metric เป็น SLA/guarantee ถ้ายังไม่ได้ประกาศ contract ดังกล่าว.

## 10. Sell-Ready Gate
ก่อนรับเงินลูกค้าคนแรกต้องมี: staffed support path, release/rollback procedure, customer lifecycle policy, billing reconciliation, public terms/privacy, data export/closure path และ named operational owner.
