# DocCraft — Product Requirements Document (PRD)

> **Status:** Authoritative Product Contract — D0 Approved Baseline
> **Version:** 2.1 Reality-Aligned + V1 Business Logo Amendment
> **Product:** Browser-first modular business document studio for Thailand
> **Rule:** If another product document conflicts with this PRD on V1 scope or behavior, this PRD wins until the conflict is explicitly resolved.

## 1. Product Definition

DocCraft ช่วยฟรีแลนซ์ ช่าง ร้านงานสั่งทำ และธุรกิจขนาดเล็ก สร้างเอกสารธุรกิจจากมือถือหรือคอม โดยไม่ต้องใช้ระบบบัญชีเต็มรูปแบบ

Core loop:
`เลือกประเภทเอกสาร → กรอกข้อมูล → เปิด/ปิดบล็อก → ตรวจยอด → Preview A4 → Print (ผู้ใช้เลือก Save as PDF ได้ผ่าน browser print dialog เมื่อ browser/OS รองรับ)`

V1 ต้องใช้งานได้โดย **ไม่สมัครสมาชิก** และงานหลักต้องทำใน browser เพื่อให้เริ่มใช้เร็วและลด backend dependency

## 2. V1 Success Definition

V1 ถือว่าใช้ได้เมื่อผู้ใช้ใหม่สามารถสร้างเอกสารที่ถูกต้องตามข้อมูลที่กรอก ตรวจ preview และเปิด browser print dialog เพื่อพิมพ์เอกสารได้โดยไม่ต้อง login; หาก browser/OS รองรับ ผู้ใช้สามารถเลือก Save as PDF จาก print dialog ได้เอง และข้อมูล draft ต้องไม่หายจากการ refresh ปกติ

V1 **ไม่รับประกัน** ว่าเป็นระบบบัญชี ภาษี หรือ e-Tax Invoice ที่ทดแทนผู้ทำบัญชี/ระบบบัญชีได้

## 3. Supported Document Types

V1 รองรับ:
- Quotation — ใบเสนอราคา
- Invoice — ใบแจ้งหนี้
- Receipt — ใบเสร็จรับเงิน
- Work Order — ใบสั่งงาน/ใบงาน
- Tax Invoice — ใบกำกับภาษี (conditional type)

	ax_invoice คือ document type ที่ 5 ของ V1 แต่ต้องถูก lock ไว้จนกว่า business profile จะเป็น VAT registered และ required tax-invoice fields ผ่าน validation ครบ ไม่ใช่โหมดแฝงของ invoice

## 4. Business & Tax Profile Contract

ห้าม infer VAT จากประเภทนิติฐานะของผู้ใช้

```ts
type EntityType = 'individual' | 'juristic_person';
type VatStatus = 'not_registered' | 'registered';

interface BusinessProfile {
  entityType: EntityType;
  vatStatus: VatStatus;
  displayName: string;
  taxId?: string;
  address: string;
  branchType?: 'head_office' | 'branch';
  branchNumber?: string;
}

interface CanonicalBusinessLogo {
  dataUrl: string;
  mimeType: 'image/jpeg' | 'image/webp';
  width: number;
  height: number;
}

interface BusinessBranding {
  logo?: CanonicalBusinessLogo;
}
```

Rules:
- `entityType` และ `vatStatus` เป็นคนละ dimension
- บุคคลธรรมดาอาจเป็น VAT registered ได้
- นิติบุคคลไม่ได้หมายความว่า VAT registered โดยอัตโนมัติ
- UI ห้ามแสดง/คำนวณ VAT ในฐานะ VAT charge หาก profile เป็น `not_registered`
- การออก Tax Invoice ต้องผ่าน validation ของ VAT-registered profile และ required tax-invoice fields
- VAT rate ต้องเป็น configuration/domain constant ไม่ฝังซ้ำตาม component

## 5. Document Data Model

เอกสารต้องมี stable internal ID แยกจากเลขเอกสารที่ผู้ใช้มองเห็น และข้อมูลการคำนวณต้อง derive จาก input ไม่ให้ผู้ใช้แก้ calculated totals โดยตรง

```ts
interface DocCraftDocument {
  id: string;
  documentType: 'quotation' | 'invoice' | 'receipt' | 'work_order' | 'tax_invoice';
  documentNumber: string;
  issueDate: string;
  dueDate?: string;
  business: BusinessProfile;
  branding?: BusinessBranding;
  customer: CustomerProfile;
  items: LineItem[];
  adjustments: AdjustmentConfig;
  payment: PaymentConfig;
  blocks: BlockVisibility;
  terms?: string;
  notes?: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}
```

V1 branding amendment:
- `branding` เป็น optional document-level presentation/identity state แยกจาก `BusinessProfile` เพื่อไม่ให้ image payload ปนกับ tax-domain profile
- `branding.logo` รองรับ single optional logo; `blocks.businessLogo` เป็น presentation visibility flag และการซ่อนต้องไม่ลบ canonical asset ที่ persist ไว้
- new/migrated documents ให้ `blocks.businessLogo = true`; ถ้าไม่มี `branding.logo` layout ต้องยุบตามธรรมชาติและไม่แสดง placeholder
- source upload รองรับ PNG/JPEG/WebP แต่ canonical persisted representation ใช้ validated browser-safe JPEG/WebP data URL + dimensions ตาม image pipeline contract
- V1 ownership เป็นต่อ current document; reusable/shared business-brand profile เป็น Phase 7+ concern หลังมี cloud/profile foundation

## 6. Calculation Contract

Calculation engine ต้องเป็น pure domain logic แยกจาก UI และมี automated tests

Baseline:
- line base = quantity × unit price
- line total = line base − line discount
- subtotal = sum(line totals)
- document discount ใช้หลัง subtotal
- VAT คำนวณเฉพาะเมื่อ VAT enabled และ business VAT registered
- WHT ต้องคำนวณจากฐานที่ผู้ใช้กำหนดว่าเป็นรายการที่เข้าข่าย ไม่ใช่เหมารวมยอดเอกสารทั้งหมด
- document-level discount ต้องลด WHT basis ตามสัดส่วนของยอด line ที่ผู้ใช้เลือกเป็น WHT-eligible เทียบกับ subtotal; deterministic baseline คือ `WHT basis = eligible line totals × amount after document discount ÷ subtotal` แล้ว round ด้วย policy กลาง (ถ้า subtotal = 0 ให้ basis = 0)
- ถ้าส่วนลดเจาะจงเฉพาะรายการ ผู้ใช้ต้องใช้ line discount; document discount ถือเป็นส่วนลดที่กระจายตามสัดส่วนทั้งเอกสาร
- net payable = amount after discount + VAT − WHT
- deposit เป็น optional derived amount จาก percentage หรือ fixed amount ตาม mode ที่กำหนด

ระบบต้องกำหนด rounding policy ที่เดียว และทดสอบกรณีทศนิยม/ส่วนลด/VAT/WHT/มัดจำร่วมกัน

## 7. Modular Editor Contract

V1 blocks:
- Business/header
- Business logo (optional; fixed header placement, preserve aspect ratio, no free-drag/unrestricted resize)
- Customer
- Items
- Item image column (optional)
- Discount/tax/WHT/deposit summary
- Payment details + optional PromptPay QR
- Terms/notes
- Signature placeholders

Block visibility เปลี่ยน presentation แต่ต้องไม่ทำให้ persisted data ถูกลบโดยอัตโนมัติ

Desktop >= 1024px: editor + live preview
Compact layout < 1024px: ใช้ editor/preview switcher และ touch-friendly action bar ทั้งมือถือและแท็บเล็ต โดยช่วง 431–1023px ต้องไม่ถูกถือเป็น desktop mode

## 8. A4 / Print Contract

เป้าหมายคือ browser print ที่ predictable ไม่ใช่การอ้างว่า PDF output เหมือนกันทุก browser 100%

Requirements:
- A4 portrait baseline
- print-safe margins
- editor/navigation/action controls ไม่ติดไปใน print
- table rows และ summary/signature blocks พยายามหลีกเลี่ยงการถูกตัดกลาง block
- รองรับเอกสารหลายหน้า
- ต้องมี fixture ทดสอบ 1 หน้า, 2+ หน้า, รายการยาว, ข้อความไทยยาว และมี/ไม่มีรูป
- Chrome/Edge desktop เป็น reference print environment ของ MVP; browser อื่นเป็น compatibility target และต้องทดสอบก่อน claim support

## 9. Local Persistence Contract

V1 local-first แต่ **ห้ามออกแบบโดยสมมติว่า LocalStorage มี 5MB ที่แน่นอนทุก environment**

Requirements:
- autosave current draft locally
- schema versioning สำหรับ migration
- quota/storage errors ต้องจับและแจ้งผู้ใช้ ห้าม silent data loss
- Import/Export JSON เป็น V1 backup contract
- Import ต้อง validate schema ก่อน replace state
- รูปต้อง resize/compress ก่อน persist และมี per-image size guard
- business logo ต้องใช้ canonical client-side image pipeline เดียวกับหลักความปลอดภัยของ item image เท่าที่เหมาะสม แต่ logo-specific dimension/encoded-size limits ต้องกำหนดแยกและ review ก่อนใช้
- ถ้า local persistence ล้มเหลว ผู้ใช้ยังต้องสามารถทำเอกสารปัจจุบันต่อและ Export backup ได้

**Excel export ไม่ใช่ V1 backup contract**; monthly/report Excel อยู่ post-MVP

## 10. PromptPay Contract

PromptPay QR บนเอกสารคือ **payment instruction ของผู้ใช้ DocCraft ให้ลูกค้าของเขา** ไม่ใช่ระบบ subscription ของ DocCraft

V1:
- generate QR client-side จาก PromptPay identifier ที่ผู้ใช้กำหนด
- optional amount = deposit หรือ net payable ตาม explicit selection
- validate identifier และ amount
- มี test vectors สำหรับ payload/CRC

V1 ไม่ตรวจว่าเงินถูกโอนสำเร็จ และไม่อัปเดตสถานะ paid อัตโนมัติ

## 11. Explicit V1 Non-Goals

- Login / account system
- Supabase cloud sync
- Subscription billing
- E-Sign / customer signing links
- payment confirmation / slip verification
- automatic quotation → invoice → receipt conversion
- Excel monthly sales reporting
- inventory / stock management
- double-entry accounting / general ledger
- e-Tax Invoice & e-Receipt integration
- AI document generation
- free-form template/page designer, arbitrary logo positioning, multiple logos/watermarks หรือ organization-wide brand kit

## 12. Post-MVP Capability Buckets

Cloud/Pro candidate capabilities:
- Auth
- Supabase sync
- customer/product reusable catalog
- cross-device access
- document history

Later candidates หลัง validation:
- document lifecycle conversion
- E-Sign/customer approval link
- monthly Excel reports
- advanced templates/themes (baseline single business logo เป็น V1 capability แล้ว; ข้อนี้หมายถึง customization ที่เกิน fixed logo block)
- subscription billing

Payment policy: PromptPay may be offered for one-time checkout where supported, but must not be described as an automatic recurring rail. Recurring subscription design requires a payment method/provider flow that explicitly supports recurring charges.

## 13. MVP Acceptance Gates

1. Tax/VAT state combinations behave independently and invalid tax-invoice states are blocked.
2. Calculation test suite covers discounts, VAT, WHT, deposits and rounding.
3. Compact-layout tests cover phone widths 375–430px และ representative tablet widths 431–1023px; core loop ต้องจบได้โดยไม่มี horizontal UI overflow.
4. Reference desktop browser prints representative one-page and multi-page fixtures to A4 without editor UI leaking into output.
5. Print action opens the native browser print dialog; manual acceptance on the reference environment confirms the user can choose the environment-provided Save as PDF destination when available. DocCraft does not generate PDF files itself.
6. Refresh restores current draft when storage is available.
7. Storage failure is surfaced and does not destroy in-memory document state.
8. Exported JSON can be imported into a clean session and reproduce the document.
9. PromptPay payload passes known test vectors and invalid identifiers are rejected.
10. V1 works end-to-end without login, Supabase or payment gateway credentials.
11. Optional business logo upload/hide/show/refresh/JSON round-trip และ A4 native print ผ่านโดยไม่ทำ accepted logo เดิมหายเมื่อ replacement ล้มเหลว และไม่ทำ header/table เกิด critical clipping หรือ horizontal overflow.

## 14. Product Claims Guardrail

Marketing documents may describe convenience benefits but must not claim guaranteed time savings, guaranteed conversion uplift, guaranteed support capacity, exact per-user infrastructure cost, legal/tax compliance certification, or identical PDF rendering across browsers unless independently verified.

## 15. Source-of-Truth Order

1. PRD.md — product behavior and scope
2. SYSTEM_ARCHITECTURE.md — implementation boundaries
3. ROADMAP.md — product phase sequencing and gates
4. IMPLEMENTATION_PLAN.md — implementation execution detail mapped to ROADMAP phases
5. PRODUCT_VALIDATION_PLAN.md / MVP_METRICS_AND_ANALYTICS.md / ONBOARDING_AND_SUPPORT.md / RELEASE_AND_OPERATIONS_RUNBOOK.md / TERMS_PRIVACY_AND_DATA_NOTICE.md — validation and launch-operations contracts
6. BUSINESS_MODEL.md / MONETIZATION_AND_PAYMENT_FLOW.md / COMMERCIAL_PACKAGING.md / CUSTOMER_LIFECYCLE_AND_BILLING_POLICY.md / SERVICE_OPERATIONS.md — commercial and paid-operations contracts
7. PRODUCT_ONE_PAGER.md / SALES_PLAYBOOK.md — marketing language

`DOCUMENTATION_READINESS_INDEX.md` is the coordination/index document for D0 and does not override the authority order above. Historical evidence such as remediation plans, repo intake, briefs and implementation evidence does not override current authoritative contracts.

Lower-order documents cannot silently expand product scope, implementation boundaries or claims.
