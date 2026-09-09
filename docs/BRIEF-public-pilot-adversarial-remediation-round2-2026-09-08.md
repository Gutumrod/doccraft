# BRIEF — DC01 Public Pilot Security Remediation Round 2 — 2026-09-08

> **Product:** DocCraft (DC01)
> **Mode:** controlled defensive remediation on Owner-controlled production
> **Round 1 baseline:** `a52e5708449500305f15e91f107ba0882b17fa46`
> **Round 1 evidence:** `ADVERSARIAL_SECURITY_ROUND1_2026-09-08.md`
> **Production:** `https://dc01.wstera.com`
> **Pilot state:** `PILOT-001` HOLD

## Objective

Close or sharply bound the material Round 1 findings without opening Phase 7, adding fixed cost, or weakening the existing HTTPS/CSP/local-first boundary.

## Authorized Remediation Scope

1. F-01 — remove unconditional Worker execution from HTTPS static delivery while preserving HTTP→HTTPS redirect for `dc01.wstera.com` only.
2. F-03 — reject compressed image bombs by validating JPEG/PNG/WebP source dimensions before browser decode/canvas work.
3. F-04 — attempt to remove `script-src 'unsafe-inline'` only if Next static bootstrap remains fully functional under deterministic CSP hashes.
4. F-05 — reduce Wrangler credential blast radius using a dedicated minimum-scope profile/keyring if Cloudflare OAuth permits it.
5. F-06 — add minimum GitHub `master` protection that prevents force-push/deletion without blocking normal Owner pushes.
6. F-02 — verify/assess legacy TLS with explicit protocol maximums; do not change zone-wide minimum TLS until impact on other WSTERA hosts is assessed.
## Acceptance Criteria

- HTTPS application/static asset delivery no longer depends on the main all-path Worker script.
- HTTP root/path/static asset still redirects to the canonical HTTPS URL and preserves path/query.
- HTTPS application/static assets retain HSTS/CSP/anti-framing/noindex headers and no successful third-party telemetry response.
- valid normal JPEG/PNG/WebP uploads still work; unreasonable source dimensions/pixel count fail before browser decode.
- Round 1 XSS/storage/CORS/traversal/method controls remain green.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, build, Chromium E2E, Edge E2E, dependency audit and production smoke are green after changes.
- no backend/Auth/Supabase/Billing/analytics dependency is introduced.

## Evidence Rule

Do not declare the adversarial round closed from implementation intent. Re-run the bounded Round 1 probes and record exact production evidence after deployment.

## Stop Boundary

- no volumetric quota exhaustion
- no production data destruction
- no credential rotation that could break unrelated WSTERA products
- no zone-wide TLS/security change without cross-product impact assessment
- no Phase 7 implementation
- `PILOT-001` stays HOLD until findings are reviewed and the final defensive verdict is recorded
