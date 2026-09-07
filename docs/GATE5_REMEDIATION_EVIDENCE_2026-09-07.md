# Gate 5 Remediation Evidence — 2026-09-07

**Project:** DocCraft (DC01)
**Gate:** Phase 5 — PromptPay Document QR
**Initial independent verdict:** `GATE 5 — REMEDIATE`
**Source review:** `docs/GATE5_INDEPENDENT_REVIEW_2026-09-07.md`

## Finding Remediated
Independent review found one HIGH correctness defect: a fixed PromptPay amount at or above JavaScript's scientific-notation threshold could pass the previous length-only guard because `(1e21).toFixed(2)` becomes `1e+21`.
That string could then enter EMV tag 54 and appear printable even though it is not a valid decimal amount representation.

## Bounded Fix
- added one canonical PromptPay amount formatter/validator
- require finite positive amount
- require exact decimal representation matching `digits.digits{2}`
- require formatted value to remain positive after rounding
- enforce the existing maximum amount-field length
- payload builder now throws instead of emitting an invalid amount field if called directly with an invalid amount
- resolver uses the same canonical formatter and fails closed before payload creation

## Regression Coverage
Added tests for:
- `1e21` scientific-notation case -> rejected by resolver
- direct payload build with `1e21` -> `RangeError`
- positive amount that rounds to `0.00` -> rejected

No identifier scope, calculation logic, persistence schema, QR UI, backend, payment confirmation, billing, or print-layout scope was expanded.

## Fresh Verification After Remediation
- targeted PromptPay domain: 8/8 PASS
- `pnpm lint`: PASS
- `pnpm typecheck`: PASS
- `pnpm test`: 12 files / 147 tests PASS
- `pnpm build`: PASS
- `pnpm test:e2e`: 39/39 Chromium PASS
- `git diff --check`: PASS (Windows CRLF warnings only)

## Gate State
Remediation implementation is verified locally, but Gate 5 remains open until independent re-review confirms the HIGH finding is closed and no new blocking issue exists.
