# BRIEF — Phase 6 MVP Integration, Hardening & Release Candidate — 2026-09-07

> **Product:** DocCraft (DC01)
> **Phase:** 6 — MVP Integration, Hardening & Release Candidate
> **Status:** OPENED by Owner — 2026-09-07
> **Baseline:** `master @ 2b4b9d18a76ab329e9228d41c94bbbf9f780fbee`
> **Goal:** ปิด V1 ให้เป็น Public Pilot release candidate ที่พิสูจน์ได้จาก code/test/production evidence จริง

## 1. Hard Boundary
- ทำเฉพาะสิ่งที่จำเป็นต่อ Gate 6 และ Public Pilot readiness
- ห้ามเปิด Phase 7, Supabase/Auth/Cloud sync, billing หรือ post-MVP capability
- ห้ามสร้าง PDF engine; ใช้ native browser print ตาม contract เดิม
- ห้ามเพิ่ม feature ใหม่เพื่อ “เผื่ออนาคต”
- ถ้าเจอ defect ให้แก้แบบ bounded remediation เท่านั้น

## 2. Phase 6 Workstreams
1. map PRD V1 acceptance gates → evidence จริง
2. run clean static/test/build/E2E verification from baseline
3. verify no-login/no-backend/no-secret/no-PDF-engine boundary
4. verify Chrome + Edge release-browser matrix and responsive core loop
5. harden only proven P0/P1/P2 release defects
6. prepare production deployment using a zero-fixed-cost path where practical
7. run production smoke and rollback check
8. create `PHASE6_MVP_IMPLEMENTATION_EVIDENCE.md`
9. independent reviewer decides `GATE 6 — PASS` or `REMEDIATE`

## 3. Gate 6 Acceptance
Gate 6 ผ่านได้เมื่อ:
- PRD V1 acceptance gates ครบและมี evidence mapping
- lint/typecheck/unit/build/E2E PASS จาก current tree
- reference browser matrix ผ่านโดยไม่มี release blocker
- no unresolved P0/P1
- no-login/no-backend smoke PASS
- production config ไม่มี secret ใน client bundle
- support contact, data notice, metrics collection mode และ onboarding พร้อม publish
- production deployment + production smoke + rollback point ถูกบันทึก
- independent review ของ diff/test/evidence = PASS

## 4. Public Pilot / PV Boundary
หลัง Gate 6 PASS ให้เปิด Public Pilot เท่านั้น ไม่เปิด Phase 7

PV Gate ต้องใช้ evidence จากผู้ใช้จริง:
- activation / funnel summary
- repeat use
- recurring pain
- top support issues
- feedback/interview evidence
- decision ว่า iterate V1 / justify Phase 7 / stop-reposition

ห้ามใช้ internal demo หรือ automated tests แทน real-user evidence ของ PV Gate

## 5. Stop Conditions
หยุดและรายงาน Owner หาก:
- ต้องเสีย fixed cost ทั้งที่มี free path ที่ใช้งานได้
- deployment ต้องเพิ่ม backend/auth/cloud architecture
- พบ P0/P1 ที่ต้องเปลี่ยน product contract
- production target/ownership/credential ไม่สามารถพิสูจน์ได้
- Gate 6 ต้องอาศัย evidence ที่ยังไม่มีจริง
