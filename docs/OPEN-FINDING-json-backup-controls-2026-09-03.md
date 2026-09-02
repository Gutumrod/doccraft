# Open Finding - JSON backup controls hidden without a decision record

**Product:** DocCraft (DC01)
**Raised:** 2026-09-03 by Claude (Commander)
**Status:** OPEN - owner decision required
**Severity:** High. Shipped behaviour on `master` contradicts three approved documents.

## What shipped

Commit `ceeb2a1` (2026-09-02, on `origin/master`) contains, alongside the Gate 3 native-print
remediation, a pre-existing Codex change that hides the JSON backup controls:

- `src/ui/editor/DocCraftEditor.tsx` - `hidden` added to `btn-import-json`, `btn-export-json`
  and `btn-mobile-export`.
- Same file - header copy changed from
  "...พิมพ์ A4 และสำรองข้อมูล JSON" to "...พร้อมพิมพ์เอกสาร A4", removing the backup promise.
- `tests/e2e/phase4-persistence.spec.ts` - new test asserting the three controls are hidden,
  plus `.click()` -> `.dispatchEvent('click')` throughout so the existing backup tests can still
  drive the now-hidden buttons.
- `tests/e2e/phase4-item-images.spec.ts` - same `.dispatchEvent('click')` adaptation.

The handlers were not removed. The capability still exists; only its entry points are hidden.

## Why this is a finding and not a cosmetic change

The change contradicts documents that are approved and, in Gate 4's case, independently reviewed:

| Source | What it says | Conflict |
| --- | --- | --- |
| `PRD.md:162` | "Import/Export JSON เป็น V1 backup contract" | The V1 backup contract now has no UI entry point. |
| `PRD.md:166` | If local persistence fails, the user must still be able to continue the current document and Export a backup | The documented failure path is unreachable from the UI. |
| `ONBOARDING_AND_SUPPORT.md:9` | Documented user flow is `... → Preview → Print → Backup` | The final step of the documented flow is hidden. |
| `ONBOARDING_AND_SUPPORT.md:15` | "JSON Export คือ backup/portability contract" | Same. |
| `ONBOARDING_AND_SUPPORT.md:30-31` | Support runbook instructs staff to have the user Export JSON when storage is full or blocked | The support remediation path cannot be followed by a user. |
| `GATE4_INDEPENDENT_REVIEW_2026-08-26.md` | Gate 4 (Local Persistence + JSON Backup) = PASS | Gate 4 was reviewed with these controls reachable. |

No brief, decision record or owner instruction authorising the hide exists anywhere in `docs/`.
The only mention of it is the disclosure in `GATE3_NATIVE_PRINT_ACCEPTANCE_2026-09-01.md` §5,
which explicitly disclaims it from Gate 3's scope - it records that the change rode along, it does
not approve it.

## What the new E2E test actually locks in

`tests/e2e/phase4-persistence.spec.ts` now asserts the hidden state as correct behaviour. The
33/33 E2E green result therefore encodes the contract violation rather than catching it. A green
suite is not evidence that this is intended.

## Owner decision required

1. **Revert the hide** and restore the controls to the state PRD/onboarding/Gate 4 describe -
   including removing the new "controls stay hidden" assertion and reverting the header copy.
   This is the option the current documents support.
2. **Keep the hide** - then the PRD V1 backup contract, the onboarding flow, the support runbook
   and the Gate 4 record must be amended, and the reason (for example: repositioning backup as a
   paid capability) recorded as a decision. Gate 4 would need to be reassessed against the amended
   contract.

Doing neither leaves `master` shipping behaviour that its own product documents contradict.

## Not done here

No code was changed, reverted or re-committed by this finding. `ceeb2a1` was not rewritten; it is
published on `origin/master` and splitting it would require a force-push to a shared branch.
