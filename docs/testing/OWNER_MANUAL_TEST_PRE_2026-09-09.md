# DC01 — Owner Manual Test PRE Baseline — 2026-09-09

> Status: **CLOSED / HISTORICAL BASELINE**
> Tester: Owner (คุณฟรี)
> Target: production state before Round 2 remediation
> Purpose: index prior Owner/manual evidence as the BEFORE side of PRE → POST comparison.

## Important

**Owner does not need to run PRE again.**

The product had already been manually exercised before the current remediation round. Those prior manual runs, together with the reproducible baseline test at commit `a52e5708449500305f15e91f107ba0882b17fa46`, are the PRE baseline.

This file exists only so later POST evidence has an explicit BEFORE reference. It is not a new test assignment.

## PRE Baseline Evidence

- Baseline source commit: `a52e5708449500305f15e91f107ba0882b17fa46`
- Automated baseline unit: PASS — 150/150
- Automated baseline Chromium + Edge E2E: PASS — 84/84
- Fresh baseline local clean-load pageerror: PASS — none
- Prior Owner/manual product testing: already performed before Round 2 remediation
- Security/Pilot readiness at PRE: HOLD; see `AGENT_TEST_PRE_2026-09-09.md`

## PRE Functional Reference

The PRE side covers the same core behaviors that POST must preserve:
- create/edit quotation
- totals and discount recalculation
- PromptPay invalid → valid behavior
- normal business logo and item image upload
- local draft persistence after refresh/reopen
- optional block hide/show persistence
- native A4 print and saved PDF output
- phone editing / Editor ↔ Preview usability

## Comparison Rule for POST

POST must be executed only after the reviewed remediation build is deployed to production.
Use the POST checklist in `OWNER_MANUAL_TEST_POST_2026-09-09.md` and compare against the prior known-good behavior/evidence.

If a specific PRE screenshot/PDF is needed for a disputed regression and no artifact can be found, record that evidence item as `PRE ARTIFACT NOT AVAILABLE`; do not make Owner rerun the old production build.

## PRE Verdict

**OWNER PRE BASELINE: CLOSED.**

No new Owner action is required on PRE. The next Owner action is POST only, after automated post-deploy gates pass.
