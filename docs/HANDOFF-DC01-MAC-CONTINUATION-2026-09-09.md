# HANDOFF — DC01 Mac Continuation — 2026-09-09

## Purpose
Move active DocCraft work from Windows to Mac without losing the tested/deployed state.
The transfer source of truth is GitHub, not a folder copy from Windows.

## Locked Windows State Before Handoff
- Repo: `https://github.com/Gutumrod/doccraft.git`
- Branch: `security/public-pilot-adversarial-2026-09-08`
- Latest evidence commit before this handoff: `35efd3427d98f3353331e600dd2657ed63e51d28`
- Local vs tracked remote before handoff: `0/0`
- Working tree before handoff: clean
- Submodules: none
- Tracked `.env` files: none

## Production State Already Proven
- Production URL: `https://dc01.wstera.com`
- Deployed source commit: `8c29254`
- HTTP redirect Worker version: `8d271814-327b-48b7-9ba6-3b314f9b6aa0`
- Main DocCraft production version: `10063532-44e1-4f57-951e-69c171e4ad03`
- Production smoke: PASS on Chrome + Edge
- Edge adversarial: PASS
- Browser adversarial: PASS
- Browser `PAGE_ERRORS=[]`; previous React `#418` no longer reproduces
- Dependency audit at tested candidate: `0 vulnerabilities`

## Current Gate
- Automated production POST: PASS
- Owner manual POST: READY / pending Owner execution
- `PILOT-001`: HOLD until Owner evidence plus remaining governance/security disposition
- F-02 legacy TLS disposition remains House-owned
- F-05 dedicated least-privilege deploy identity remains governance work
- F-06 repository protection/status-check disposition remains open
- Phase 7 remains frozen

## Mac Bootstrap
Recommended workspace target: `~/AI-Workspace/projects/saas-product-hub/products/DocCraft`

```bash
mkdir -p ~/AI-Workspace/projects/saas-product-hub/products
cd ~/AI-Workspace/projects/saas-product-hub/products
git clone https://github.com/Gutumrod/doccraft.git DocCraft
cd DocCraft
git fetch --all --prune
git switch security/public-pilot-adversarial-2026-09-08
git status -sb
git rev-list --left-right --count HEAD...origin/security/public-pilot-adversarial-2026-09-08
```

Expected after final handoff push:
- correct branch: `security/public-pilot-adversarial-2026-09-08`
- divergence: `0 0`
- working tree: clean

## Mac Runtime Gate
- Node requirement from installed Next.js: `>=20.9.0`
- Project package manager: `pnpm@11.21.0`

```bash
node -v
corepack enable
corepack prepare pnpm@11.21.0 --activate
pnpm -v
pnpm install --frozen-lockfile
pnpm audit
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:security-boundary
```

For browser tests, install Chromium first:
```bash
pnpm exec playwright install chromium
pnpm exec playwright test --project=chromium
```
The full repo E2E matrix also has an `msedge` project. Run full `pnpm test:e2e` only after Microsoft Edge is available on the Mac.

## Owner Continuation Point
Do not rerun PRE. The next product action is Owner POST against production using:
`docs/testing/OWNER_MANUAL_TEST_POST_2026-09-09.md`

## Do Not Transfer From Windows
Do **not** copy the Windows Wrangler OAuth profile or any machine-local credential to Mac.
Windows currently stores Wrangler credentials under a user-local config path; treat that as Windows-only state.
If Mac later needs an approved production operation, authenticate there separately and prefer the future least-privilege deploy identity when available.

Do not copy:
- `node_modules`
- `.next`
- `out`
- Playwright browser cache
- Wrangler OAuth/config state
- any untracked secret file

Recreate generated/runtime artifacts on Mac from the clean Git branch.

## Continuity Documents
Read these before changing scope:
1. `docs/testing/TEST_SUMMARY_AND_IMPROVEMENTS_2026-09-09.md`
2. `docs/testing/AGENT_TEST_POST_2026-09-09.md`
3. `docs/testing/OWNER_MANUAL_TEST_POST_2026-09-09.md`
4. `docs/HANDOFF-DC01-ADVERSARIAL-SECURITY-ROUND1-2026-09-08.md`

No new Phase 7 work, Auth, Supabase, Billing, or shared-zone TLS change is authorized by this handoff.
