# DC01 — Owner Manual Test POST — 2026-09-09

> Tester: Owner (คุณฟรี)
> Target: `https://dc01.wstera.com` **after Round 2 deploy only**
> Purpose: confirm the fixed production build still feels and works correctly in real use.

## Do Not Start Until Agent Says GO

Before Owner starts, these must all be recorded:
- deployed commit: `________________`
- Cloudflare deployment/version: `________________`
- dependency audit: `0 vulnerabilities`
- production smoke: `PASS`
- bounded security retest: `PASS`
- clean-load browser pageerror: `PASS / none`

If any gate is FAIL, Owner POST is **BLOCKED**. Owner does not need to rerun PRE.

## Comparison Rule

PRE means the manual behavior already tested before Round 2. POST checks that the new production build is not worse and that the same core workflow still works.

Use test/fake data only. Suggested POST data:
- business: `KMO TEST OWNER`
- customer: `OWNER POST TEST`
- document: Quotation
- item 1: `Rack Bar Test`, qty `2`, price `1500`
- item 2: `Install Test`, qty `1`, price `500`

## Desktop Test

| ID | Action | Expected | Result |
|---|---|---|---|
| POST-O-01 | Type `http://dc01.wstera.com/` | Redirects once to HTTPS; no loop/error | ☐ PASS ☐ FAIL |
| POST-O-02 | Open HTTPS in fresh tab | Page loads normally; no broken layout | ☐ PASS ☐ FAIL |
| POST-O-03 | Create quotation with both items | Preview updates and totals are correct | ☐ PASS ☐ FAIL |
| POST-O-04 | Enter invalid PromptPay, then correct it | Invalid blocks print; valid restores QR/print | ☐ PASS ☐ FAIL |
| POST-O-05 | Upload one normal logo + one item image | No freeze/error; preview remains usable | ☐ PASS ☐ FAIL |
| POST-O-06 | Refresh, then reopen browser | Draft restores correctly | ☐ PASS ☐ FAIL |
| POST-O-07 | Hide/show optional blocks | Values survive; layout stays clean | ☐ PASS ☐ FAIL |
| POST-O-08 | Open native Print on A4 | Controls/Pilot notice hidden; no clipping | ☐ PASS ☐ FAIL |
| POST-O-09 | Save PDF | PDF opens and matches preview closely | ☐ PASS ☐ FAIL |
| POST-O-10 | Return and edit one value | App remains usable after print/reopen | ☐ PASS ☐ FAIL |

## Phone Test

| ID | Action | Expected | Result |
|---|---|---|---|
| POST-M-01 | Open production | No blocking horizontal overflow | ☐ PASS ☐ FAIL |
| POST-M-02 | Edit business/customer/items | Keyboard + controls usable | ☐ PASS ☐ FAIL |
| POST-M-03 | Switch Editor ↔ Preview | Both views readable/reachable | ☐ PASS ☐ FAIL |
| POST-M-04 | Upload one normal image + refresh | No freeze; draft restores | ☐ PASS ☐ FAIL |
| POST-M-05 | Print/share if supported | Output remains complete | ☐ PASS ☐ FAIL ☐ N/A |

## Owner Evidence

- Desktop browser/version: `________________`
- Phone/browser: `________________`
- POST PDF filename: `________________`
- Screenshot filenames: `________________`
- New regression/defect IDs: `________________`
- Better/worse than PRE: `________________`

## Owner Verdict

Choose one:
- ☐ `OWNER POST PASS` — core workflow preserved; no blocking regression
- ☐ `OWNER POST REMEDIATE` — usable, but defect/regression needs fixing
- ☐ `OWNER POST BLOCKED` — core create/preview/persist/print flow failed

Owner POST is product-quality evidence. Final pilot/security decision still requires closure/disposition of remaining security items.
