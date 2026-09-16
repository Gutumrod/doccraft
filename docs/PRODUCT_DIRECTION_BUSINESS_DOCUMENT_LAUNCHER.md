# DocCraft — Product Direction: Business Document Launcher

> **Status:** Approved Product Direction — post-V1 expansion target
> **Date:** 2026-09-16
> **Owner:** Product Owner (คุณฟรี)
> **Current V1 contract:** `docs/PRD.md` remains authoritative for shipped V1 scope until a later PRD amendment explicitly promotes this direction into implementation scope.

## 1. Decision

DocCraft will expand beyond the current transactional document set and evolve into a **Business Document Launcher / Structured Business Document Studio**.

The intended user experience is:

`Open DocCraft → choose the document you need → fill structured fields → preview → print / Save as PDF through the browser`

The product should let an office worker, freelancer, contractor, workshop, service business, or SME create common business documents without needing to design a page manually or start from a Word/Excel template.

## 2. What DocCraft should become

DocCraft should become a structured document system for common business work, not only a quotation/invoice generator.

The product should organize documents by business task, for example:

### Sales & Billing
- Quotation
- Invoice
- Receipt
- Tax Invoice

### Operations
- Work Order
- Delivery Note
- Service Report

### Purchasing
- Purchase Order
- Purchase Request
- Goods Receipt

### Office
- Memo
- Business Letter
- Meeting Agenda
- Meeting Minutes
- General structured form

### HR / Internal Administration
- Leave Request
- OT Request
- Employee Certificate
- Expense / reimbursement request
- Asset borrow / return form

These are direction-level categories, not an immediate promise that every document above must ship in the next phase. Each document family must enter scope through an explicit PRD extension and acceptance criteria before implementation.

## 3. Core product principle

DocCraft must **not become a Word clone** and must not introduce a blank-page free-form editor as the primary experience.

The core differentiator is structured generation:

- users choose a document purpose instead of designing a page;
- each document type has a schema and appropriate fields;
- reusable blocks are composed from shared primitives;
- calculations appear only where the document requires them;
- business/customer/vendor/employee fields are reusable where appropriate;
- output remains predictable and A4/print friendly;
- users should be able to create a usable document without learning layout tools.

## 4. Architecture direction

The current V1 domain is transaction-document-oriented. Post-V1 expansion should introduce a generalized document definition layer instead of adding unrelated hard-coded screens for every template.

Target conceptual structure:

```text
DocCraft Core
├── Document Definition / Schema
├── Shared Field Blocks
├── Shared Party Blocks
│   ├── Business
│   ├── Customer
│   ├── Vendor
│   └── Employee / Internal party
├── Table / Line-item Blocks
├── Calculation Blocks
├── Approval / Signature Blocks
├── Terms / Notes Blocks
├── Payment Blocks
├── A4 Preview / Print Engine
└── Locale / Country Packs
```

A document type should declare which blocks and fields it needs rather than duplicating the entire editor implementation.

Examples:

- `Quotation` uses customer + items + calculations + terms + payment.
- `Purchase Order` uses vendor + items + delivery terms + approval/signature.
- `Meeting Minutes` uses meeting metadata + attendees + agenda/results + notes/signatures, with no billing calculation.
- `Leave Request` uses employee + leave dates + reason + approval blocks.

## 5. International direction

The long-term structure should support a global document core with locale/country packs rather than separate products per country.

```text
DocCraft Core
├── TH locale / business rules
├── Generic EN locale
└── future country-specific packs
```

Country-specific tax, payment, terminology, legal fields, currencies, and document conventions must remain isolated from the generic document engine where possible.

## 6. Relationship to the existing V1

The current five V1 document types remain valid and should not be disrupted:

- Quotation
- Invoice
- Receipt
- Work Order
- Tax Invoice

The existing V1 strengths remain foundational:

- no-login browser-first flow;
- modular blocks;
- calculation engine;
- A4 preview and native browser print;
- local persistence;
- business branding/logo;
- item images;
- Thai tax/VAT/WHT handling;
- optional PromptPay instruction.

This direction is an expansion of the product surface, not a rejection or rewrite of the validated V1 core.

## 7. Product UX target

The home/start experience should eventually answer one question first:

> **What document do you need to create today?**

The user chooses a document family/type and DocCraft loads the correct structured editor automatically.

The target is for a normal office worker to create common business documents without having to know document formatting rules or manipulate Word/Excel templates.

## 8. Monetization implications

This broader product direction creates several monetizable layers while preserving a useful free entry point:

- Free local-first document creation for selected core templates.
- Pro subscription for cloud sync, reusable business/contact/catalog data, cross-device access, document history, lifecycle/workflow features, and premium template families.
- Team / Business subscription for shared organization data, roles, approvals, shared templates, audit history, and centralized document storage.
- Country / industry packs where there is real localization or domain value.
- Premium workflow capabilities such as quotation → invoice → receipt conversion, approval flows, e-sign/public links, reporting, and integrations after validation.

Pricing and packaging remain hypotheses until real usage and willingness-to-pay data support them. The existing `docs/BUSINESS_MODEL.md` pricing guardrails remain in force.

## 9. Explicit non-goals

This direction does **not** authorize:

- a generic Word processor;
- arbitrary free-form page design as the core UX;
- spreadsheet/accounting replacement;
- implementing every document type at once;
- bypassing the current PV / roadmap gates;
- promising legal compliance for a country without explicit locale validation;
- moving V1 scope boundaries silently.

## 10. Recommended execution sequence after V1/PV

When this direction is promoted into implementation scope, use a thin vertical slice:

1. Generalize the document-definition contract while preserving all five V1 types.
2. Add one non-financial document family to prove that the engine is no longer transaction-only.
3. Recommended proof document: **Purchase Order** or **Meeting Minutes**, chosen from user evidence.
4. Verify editor, persistence, preview, print, migration, and regression behavior end-to-end.
5. Only then expand the catalog by document family.

## 11. Acceptance principle for future phases

A new document type is not considered supported merely because a template exists. It must have:

- explicit schema and required/optional fields;
- validation rules;
- predictable preview/print behavior;
- persistence and migration coverage;
- representative automated/manual tests;
- appropriate locale/legal disclaimers where relevant;
- defined placement in Free / Pro / Team packaging.

---

**Owner direction recorded 2026-09-16:** Continue DocCraft toward a structured, ready-to-use business document platform for general office and SME document creation, while preserving the existing V1 and avoiding a Word-clone direction.
