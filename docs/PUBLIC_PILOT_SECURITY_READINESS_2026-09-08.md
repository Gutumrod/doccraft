# DocCraft Public Pilot — Security Readiness Checkpoint

> **Date:** 2026-09-08
> **Scope:** bounded pre-pilot hardening after Gate 6 closure; no Phase 7/Auth/Supabase/Billing work
> **Baseline before hardening:** `70054e7598aec475c5d6b73e62f9805ece0603e3`
> **Security implementation checkpoint:** `fb34f055180015124ac190c36f5728dd681d21f0`
> **Production:** `https://dc01.wstera.com`
> **Production Worker version:** `722b573b-8dbb-4a50-b1ea-d880f6a03a5b`

## Decision

**Baseline hardening: PASS.** The previously observed plaintext HTTP exposure is closed across application and static-asset paths, and the bounded security hardening changes passed local and production verification.

This document does **not** claim penetration-test completion. Owner-directed adversarial/destructive validation is the next security activity. `PILOT-001` remains on hold until that round is reviewed.

## Controls Added

- all HTTP requests to `dc01.wstera.com`, including `/_next/*`, return `308` to the same HTTPS path/query
- HSTS: `max-age=2592000` with no `includeSubDomains` and no preload
- edge gateway allows only `GET` and `HEAD`; other methods return `405`
- CSP adds `script-src-attr 'none'`, `frame-src 'none'`, `worker-src 'none'`, and `upgrade-insecure-requests`
- anti-framing: `frame-ancestors 'none'` and `X-Frame-Options: DENY`
- `nosniff`, `Referrer-Policy: no-referrer`, COOP/CORP and restrictive Permissions-Policy
- controlled Pilot discovery disabled by `X-Robots-Tag`, metadata robots and `robots.txt`
- Cloudflare-injected Insights script remains blocked by CSP; successful third-party telemetry responses are not observed

## Input / Local Resource Guards

- item image source file limit: 12 MiB before browser decode
- business logo source file limit: 8 MiB before browser decode
- imported JSON limit: 16 MiB before `FileReader` / parse path proceeds
- accepted image types remain JPEG/PNG/WebP; persisted image payloads remain bounded JPEG/WebP data URLs
- sensitive source/config probes (`/.env`, `/.git/config`, `/package.json`, `/wrangler.jsonc`, `/_headers`, worker source) return `404`

## Dependency / Supply-Chain Check

- Vitest upgraded from `3.0.5` to `3.2.6` to remove the known critical dev-server advisory
- `pnpm audit --prod`: no known vulnerabilities
- full `pnpm audit`: no known vulnerabilities
- no new runtime backend/Auth/database/PDF-engine dependency introduced

## Verification — 2026-09-08

- `pnpm lint` — PASS
- `pnpm typecheck` — PASS
- `pnpm test` — **150/150 PASS** across 12 files
- `pnpm test:security-gateway` — PASS
- `pnpm build` — PASS, static routes only
- Wrangler deployments list — current version receives 100% traffic
- Chromium E2E — **42/42 PASS**
- Microsoft Edge E2E — **42/42 PASS**
- `git diff --check` — PASS (line-ending warnings only)
- forbidden dependency/client-env/secret-pattern scans — no hits

## Production Verification

Final all-path security gateway deployment:
`722b573b-8dbb-4a50-b1ea-d880f6a03a5b`

Observed on production:
- `http://dc01.wstera.com/` → `308` → `https://dc01.wstera.com/`
- HTTP static JS path → `308` to the same HTTPS asset path
- HTTPS application and static assets return HSTS/CSP/noindex/security headers
- POST / PUT / PATCH / DELETE / TRACE / OPTIONS → `405`
- Chrome production smoke — PASS
- Edge production smoke — PASS
- PromptPay, persistence and print-media checks remain PASS
- successful third-party responses — none; Cloudflare Insights beacon is CSP-blocked

## Rollback Context

Immediate pre-final-gateway production version: `01c4d9d4-45ab-4050-9b87-f789ed386077`.
It is an availability rollback point, but it retains the previously found HTTP static-asset residual and therefore is **not** the preferred steady-state security posture. The older Gate 6 rollback evidence remains historical and unchanged.

## Residual / Next Validation

- CSP still requires `script-src 'unsafe-inline'` for current Next static bootstrap; inline event handlers are separately blocked by `script-src-attr 'none'`
- source-byte limits reduce upload resource abuse but are not a substitute for adversarial image-decoder testing
- provider-layer Cloudflare operational/security/network logging is outside the application-level no-telemetry claim
- HSTS is intentionally conservative and is not yet preload/includeSubDomains
- identity/document-authenticity abuse remains a product-abuse scenario because Public Pilot has no account/issuer verification

**Next:** run controlled adversarial/destructive testing against the deployed Public Pilot boundary, preserve evidence, remediate any material findings, and only then decide whether `PILOT-001` may proceed.
