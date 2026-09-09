# DC01 DocCraft — Adversarial Security Test Round 1

> **Date:** 2026-09-08
> **Target:** `https://dc01.wstera.com`
> **Production Worker:** `722b573b-8dbb-4a50-b1ea-d880f6a03a5b`
> **Source baseline before adversarial harness:** `a52e5708449500305f15e91f107ba0882b17fa46`
> **Mode:** controlled owner-authorized adversarial validation; no volumetric DDoS
> **Disposition:** **REVIEW REQUIRED / PILOT-001 HOLD**

## Test Strategy

Round 1 covered:
- HTTP/HTTPS and proxy/header bypass attempts
- methods, encoded traversal and sensitive-file probes
- redirect/header/cache poisoning
- CORS and framing
- reflected/stored XSS and CSP egress controls
- malformed LocalStorage and prototype-pollution payloads
- oversized JSON/logo/item-image guards
- source/deployment artifact exposure
- bounded request burst and request-metadata abuse
- legacy TLS negotiation
- compressed-image decode/resource abuse
- deployment credential and source-control blast radius

No Phase 7/Auth/Supabase/Billing capability was introduced or tested.
## Passing Controls / Negative Findings

- HTTP root, path/query and static assets preserve the canonical host and redirect `308` to HTTPS.
- `X-Forwarded-Host`, `X-Forwarded-Proto`, `X-Original-URL` and related poisoning attempts did not alter redirect/body output.
- TRACE / POST / PUT / PATCH / DELETE / OPTIONS return `405`; HEAD/GET remain allowed.
- encoded traversal and sensitive paths did not expose `.env`, `.git`, package/config, Worker source or server files.
- no open redirect was found in tested slash/backslash/encoded path variants.
- evil Origin received no permissive CORS header.
- repeated clean/poison/clean cache probes returned identical response-body hashes.
- CRLF payloads remained percent-encoded in `Location`; no response splitting was observed.
- reflected and persisted XSS payloads remained inert text; no script/event handler executed.
- external script/image/fetch/form egress to `evil.example` was blocked by CSP; no successful external response occurred.
- framing was blocked by `frame-ancestors 'none'`; Chromium frame resolved to `chrome-error://chromewebdata/`.
- malformed LocalStorage did not crash the app shell; prototype-pollution probes did not mutate `Object.prototype`.
- 16 MiB JSON, 8 MiB logo and 12 MiB item-image source byte guards rejected oversized source payloads.
- no production source maps, suspicious source/config artifacts or tested secret patterns were found in `out/`.
- public Git history across 25 commits had zero hits for the tested high-risk secret patterns.
- controlled 50-request concurrent burst returned 50/50 HTTP 200 with no 5xx.
## Findings

### F-01 — HIGH — Worker quota exhaustion / availability boundary

Current deployment uses `assets.run_worker_first: true`, so every matching request, including static assets, invokes the Worker security gateway.

Cloudflare documents that Workers Free has a 100,000-request/day limit and that static assets are free/unlimited only when they do not invoke Worker code. With `run_worker_first`, matching static requests consume Worker requests and can return 429 after the Free limit is exceeded.

A controlled 50-request burst completed 50/50 successfully in 380 ms; there is no application-level throttle. No attempt was made to exhaust the quota.

**Impact:** for the intended zero-fixed-cost pilot, a cheap request flood could consume the daily Worker allowance and deny service to legitimate users.

**Disposition:** blocking availability finding for `PILOT-001` until the HTTPS/security boundary can avoid unconditional Worker invocation or equivalent quota protection is proven.

### F-02 — MEDIUM — Legacy TLS 1.0 / TLS 1.1 accepted

Fresh `curl` probes constrained to TLS 1.0 and TLS 1.1 both completed HTTPS requests with HTTP 200. TLS 1.2 and 1.3 also pass.

Cloudflare supports a zone-level Minimum TLS Version setting on Free plans. Per-hostname configuration requires Advanced Certificate Manager, so any free remediation must assess the effect of a zone-wide TLS 1.2 minimum on other `wstera.com` services.
### F-03 — MEDIUM — Compressed image decode resource exhaustion

A valid 6,000 × 6,000 grayscale PNG was generated at only **48,289 bytes**. It is far below the 12 MiB source-byte limit.

Uploading it through the production item-image control produced no preview/error within 15 seconds; the isolated test process took about 47 seconds to complete/close. No page error was emitted.

**Impact:** a tiny highly-compressed image can bypass byte-size guards and consume significant browser decode/canvas resources. This is client-side denial of service, not server compromise.

**Required remediation direction:** parse supported image headers before browser decode and reject unreasonable source dimensions / total pixel count before `createImageBitmap()` or `Image` decode.

### F-04 — LOW/MEDIUM — CSP permits inline script elements

A direct DOM probe demonstrated `INLINE_SCRIPT_CSP_PROBE=7`, confirming current `script-src 'unsafe-inline'` permits inline script elements. This is expected from the current Next static bootstrap requirement.

Current application fields did **not** provide an HTML/XSS sink: reflected and stored payload tests stayed inert. `script-src-attr 'none'`, `connect-src 'self'`, `form-action 'self'`, and external-script restrictions worked as intended.

**Disposition:** defense-in-depth residual, not an observed exploit path in current V1.

### F-05 — MEDIUM — Broad local Cloudflare deployment credential

Wrangler is authenticated with a user OAuth token stored on the Windows workstation. Reported scopes include write access across Workers, KV, Routes, Scripts, D1, Pages, SSL certificates, AI, queues, pipelines, secrets store, email and additional account capabilities.

**Impact:** compromise of the deployment workstation/token has a much larger account blast radius than DC01 requires.
### F-06 — MEDIUM — `master` has no GitHub protection/ruleset

GitHub reports `master` as **Branch not protected** and repository rulesets as `[]`. The repo also has no `.github` workflow directory.

**Impact:** an authorized/compromised GitHub credential can directly rewrite or force-push source history without a repository-side guard. Production is not auto-deployed from GitHub today, so this does not directly alter the current Worker, but it weakens source-of-truth integrity.

**Remediation direction:** add minimum branch/ruleset protection without unnecessarily blocking Owner workflow; at minimum prevent force-push/deletion and add CI/status protection when CI exists.

## Informational Observations

- Next static RSC metadata files such as `/__next._tree.txt` and `/__next.__PAGE__.txt` are publicly reachable and disclose framework/build/chunk metadata only in inspected samples; no secret was found.
- `.well-known/security.txt` is absent. This is a disclosure/operations improvement opportunity, not a security control failure.
- no application cookies or `X-Powered-By` header were observed; edge identifies itself as Cloudflare.
- HSTS remains intentionally conservative (`max-age=2592000`, no preload/includeSubDomains).
- document issuer identity is not verified in the no-account Public Pilot; fraud/document-spoofing remains a product-abuse scenario rather than a technical compromise.

## Round 1 Decision

**Do not onboard `PILOT-001` yet.** F-01 is an availability blocker for the zero-fixed-cost Public Pilot posture. F-03 should be remediated before inviting arbitrary real users to upload images. F-02, F-05 and F-06 should be resolved or explicitly dispositioned with House impact considered.

Do not run volumetric quota-exhaustion or larger image-bomb escalation merely to prove impact; Round 1 already established the relevant failure modes without consuming the Cloudflare quota or risking workstation stability.
