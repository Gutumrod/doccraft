# DocCraft Public Hostname Migration — 2026-09-25

> **Verdict:** `DC01_PUBLIC_HOSTNAME_MIGRATION_PASS` (เงื่อนไข: ดู §9 Known limitations — transport `301`/`308` เป็น finding แยกที่ยังเปิดอยู่)
> **Canonical:** `https://doccraft.wstera.com`
> **Legacy compatibility:** `https://dc01.wstera.com` (dual-serve, ไม่ redirect ข้าม host)
> **Policy authority:** `Gutumrod/saas-product-hub@8873bbc8e62fe578a5ba75d0083a9e44d800dfbb` — `docs/platform/PRODUCT_PUBLIC_NAMING_AND_HOSTNAME_POLICY.md`
> **Executor:** Claude (Commander), Windows machine, Wrangler `4.129.0`
> **Branch:** `migration/doccraft-public-host-20260925` แตกจาก `2a7d3c85119b07590058a293672bd94a4575e840`

## 1. Deploy base / provenance

- `origin/master` = `a52e5708449500305f15e91f107ba0882b17fa46`; branch `fix/branch-type-toggle-2026-09-24` = `2a7d3c8` (ahead 6 / behind 0 หลัง `git fetch --prune`), worktree สะอาด
- 6 commit ที่ไม่ได้อยู่บน master: `597d1e3` (security round 2), `8c29254`, `35efd34`, `7faf9c9`, `f5f4951` (branch toggle fix), `2a7d3c8` — `2a7d3c8` ต่างจาก `f5f4951` แค่ไฟล์ doc เดียว
- `origin/master` ยังมี `worker/security-gateway.mjs` + `run_worker_first` (ก่อน round 2) ถ้า deploy จาก master จะย้อน hardening ของ round 2 และทิ้ง branch toggle fix
- Cloudflare ก่อน migration: `wstera-dc01` = `e84767c8-955f-4562-a159-80fdee44722f` (2026-09-24T15:20:36Z), `wstera-dc01-http-redirect` = `8d271814-327b-48b7-9ba6-3b314f9b6aa0`
- **พิสูจน์ source:** build `2a7d3c8` ด้วย lockfile เดิม → chunk JS/CSS ที่มี content hash ทั้ง 8 ไฟล์ที่ live `index.html` อ้างถึง ตรงกับ build local แบบ byte-identical (sha256 ตรง 8/8) ส่วน `index.html` ต่างกันแค่วันที่ prerender (`2026-09-24` vs `2026-09-25`) และ Next build id
- ข้อสรุป: production ก่อน migration รัน source `f5f4951` (≡ `2a7d3c8`) จริง → ใช้เป็น integration base

## 2. Inventory (Phase A)

`dc01.wstera.com` ก่อนแก้: 47 บรรทัดใน 24 ไฟล์ จัดกลุ่มดังนี้

| กลุ่ม | ไฟล์ | การจัดการ |
|---|---|---|
| Active config/test ที่ต้องเปลี่ยนเป็น canonical | `wrangler.jsonc`, `wrangler.http-redirect.jsonc`, `worker/http-redirect.mjs`, `scripts/phase6-production-smoke.mjs`, `scripts/security-adversarial-round1.mjs`, `scripts/security-adversarial-browser-round1.mjs`, `scripts/security-csp-residual-probe.mjs`, `scripts/security-boundary-selftest.mjs` | เพิ่ม canonical และเก็บ legacy ไว้อย่างชัดเจนใน config/worker/selftest; script เปลี่ยน default เป็น canonical และรับ `DC01_URL` สำหรับทดสอบ legacy |
| Current-state docs | `docs/CURRENT_STATUS.md`, `docs/RELEASE_AND_OPERATIONS_RUNBOOK.md`, `docs/PUBLIC_PILOT_PARTICIPANT_BRIEF.md`, `docs/PUBLIC_PILOT_EVIDENCE_LOG.md` | เพิ่ม overlay/amendment ที่ลงวันที่ ไม่แก้เนื้อหาที่ลงวันที่เดิม |
| Historical evidence (คงไว้ตามเดิม) | `docs/ADVERSARIAL_SECURITY_ROUND1_2026-09-08.md`, `docs/BRIEF-public-pilot-*-2026-09-08.md`, `docs/GATE6_INDEPENDENT_REVIEW_2026-09-07.md`, `docs/HANDOFF-DC01-*`, `docs/PHASE6_MVP_IMPLEMENTATION_EVIDENCE.md`, `docs/PUBLIC_PILOT_SECURITY_READINESS_2026-09-08.md`, `docs/testing/*` | ไม่แตะ |

External dependency / callback:
- `src/` ไม่มี OAuth, Stripe, LINE, webhook หรือ callback; URL ภายนอกที่เจอมีแค่ลิงก์ GitHub Issues
- QR ที่สร้างเป็น PromptPay payload ไม่ใช่ URL ของ host
- `apps/hub-web` (repo `Gutumrod/hub-web`) ไม่มีลิงก์ไป `dc01.wstera.com` หรือ `doccraft.wstera.com`
- **Origin-scoped data:** draft อยู่ใน `localStorage` key `doccraft_current_draft_v1` ซึ่งแยกตาม origin — draft บน `dc01` จะไม่ปรากฏบน `doccraft`

## 3. Changes

- `wrangler.jsonc`: custom domain `doccraft.wstera.com` (canonical) + `dc01.wstera.com` (legacy) บน Worker `wstera-dc01` ตัวเดิม ไม่เปลี่ยนชื่อ Worker
- `wrangler.http-redirect.jsonc` + `worker/http-redirect.mjs`: เพิ่ม route `http://doccraft.wstera.com/*`; Worker รับเฉพาะ 2 host นี้ และ upgrade เป็น HTTPS บน host เดิม (`308` ตาม contract เดิม)
- `scripts/security-boundary-selftest.mjs`: ทดสอบทั้ง 2 host (path/query preserved, HTTPS → 404, host อื่น → 404)
- `scripts/phase6-production-smoke.mjs`: default เป็น canonical; เพิ่ม `DC01_SMOKE_SKIP_HTTP_TRANSPORT=1` เป็น opt-out ที่ประกาศชัด — ไม่ยอมรับ `301` แบบเงียบ และผลลัพธ์ไม่ใช่ `PRODUCTION_SMOKE_PASS`
- adversarial/CSP probes: default เป็น canonical, รับ `DC01_URL`
- docs: overlay/amendment ตาม §2

## 4. Pre-deploy gates (source = working tree ที่ deploy)

| Gate | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm audit` | PASS — No known vulnerabilities |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS 154/154 |
| `pnpm build` | PASS (`SECURITY_HEADERS_FINALIZED html=3 inline_hashes=3`) |
| `pnpm test:security-boundary` | PASS (`SECURITY_BOUNDARY_SELFTEST_PASS`) |
| `pnpm test:e2e` | PASS 86/86 (Chromium 43 + Microsoft Edge 43) |
| `git diff --check` | PASS (มีแค่ CRLF warning) |

## 5. Cloudflare state

| Item | Before | After |
|---|---|---|
| `wstera-dc01` version | `e84767c8-955f-4562-a159-80fdee44722f` | `2f204f27-2d9a-4b79-b9d8-02ed1c00e00a` (2026-09-25T01:16:12Z) |
| `wstera-dc01-http-redirect` version | `8d271814-327b-48b7-9ba6-3b314f9b6aa0` | `b899965e-d3d8-4cbb-801c-cbca9d6a777a` (2026-09-25T01:17:29Z) |
| Custom domains | `dc01.wstera.com → wstera-dc01` | `doccraft.wstera.com → wstera-dc01`, `dc01.wstera.com → wstera-dc01` |
| Worker routes | `http://dc01.wstera.com/* → wstera-dc01-http-redirect` | + `http://doccraft.wstera.com/* → wstera-dc01-http-redirect` |
| DNS `doccraft.wstera.com` | NXDOMAIN | สร้างโดย Workers custom domain |

อ่าน state ผ่าน Cloudflare API ด้วย Wrangler OAuth ของเครื่องนี้ ไม่ได้ commit credential ใดๆ token นี้ไม่มีสิทธิ์อ่าน DNS/zone settings จึงยืนยันจาก API ไม่ได้ว่า `301` มาจาก setting ไหน (ดู §8)

## 6. Canonical host proof

- `https://doccraft.wstera.com/` → `200`
- TLS: `CN=wstera.com`, SAN `wstera.com, *.wstera.com`, issuer Google Trust Services WE1, valid 2026-09-09 → 2026-12-08, `ssl_verify_result=0`
- Headers: HSTS `max-age=2592000`, CSP (`script-src` hash-only, `script-src-attr 'none'`, `connect-src 'self'`, `frame-ancestors 'none'`, `form-action 'self'`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-Robots-Tag: noindex, nofollow, noarchive`, `Referrer-Policy: no-referrer`, COOP/CORP `same-origin`, Permissions-Policy
- Production smoke (`DC01_SMOKE_SKIP_HTTP_TRANSPORT=1`): Chrome PASS + Edge PASS — status 200, title DocCraft, PromptPay ok, persistence หลัง reload ok, print-media ok, third-party responses none (Cloudflare Insights beacon โดน CSP block)
- Strict smoke (ไม่ skip): FAIL ที่ `transport: expected HTTP 308, got 301` — เป็น finding แยก
- `security-adversarial-browser-round1.mjs`: `ROUND1_BROWSER_PASS` (framing โดน `frame-ancestors` block, ไม่มี evil response)
- `security-csp-residual-probe.mjs`: inline script injection, `fetch` ไป evil.example, form post ไป evil.example ถูก CSP block ทั้งหมด
- `security-adversarial-round1.mjs`: method bypass / CORS / cache poisoning / open redirect ไม่พบ; findings มีเฉพาะ `transport redirect failure` 4 รายการ เพราะได้ `301` แทน `308`
- `index.html` บนทั้ง 2 host = sha256 `e1ac7055490ec66b…` ตรงกับ build local; chunk 8/8 ตรง

## 7. Legacy host compatibility

- `https://dc01.wstera.com/` → `200` ด้วย app/header ชุดเดียวกัน; smoke Chrome + Edge PASS (transport skipped explicitly)
- เลือก **dual-serve** (brief risk order ข้อ 1) และไม่ทำ cross-host redirect เพราะ:
  1. draft อยู่ใน `localStorage` แยกตาม origin — redirect จะทำให้ผู้ใช้เดิมไม่เห็นงานร่างของตัวเอง
  2. การ redirect HTTPS จาก `dc01` ต้องให้ Worker ทำงานบน HTTPS path (round 2 F-01 เอาออกไปแล้ว) หรือใช้ zone Redirect Rule ซึ่งอยู่นอก scope
- Legacy HTTP: `http://dc01.wstera.com/a/b?x=1&y=2` → `301` → `https://dc01.wstera.com/a/b?x=1&y=2` (1 hop)

## 8. Transport — finding แยกเรื่อง `301`/`308`

- ทั้ง 2 host: HTTP ตอบ `301 Moved Permanently` ไปยัง HTTPS บน host เดิม และคง path/query ไว้
- `X-Forwarded-Host: evil.example` ไม่มีผลกับ `Location`
- ไม่มี redirect loop (`curl -L` จบใน 1 hop ทั้ง HTTP และ HTTPS)
- `301` มาจาก zone edge ก่อนถึง Worker route (น่าจะเป็น Always Use HTTPS — ยืนยันผ่าน API ไม่ได้เพราะ token ขาดสิทธิ์) redirect worker ที่ deploy แล้วจึงเป็น fallback เท่านั้น
- migration นี้ไม่ได้แตะ zone setting และไม่ได้ปรับ assertion เพื่อให้ผ่าน — ยังเป็น open finding ตาม `docs/testing/DEFECT_BRANCH_SELECTION_TOGGLE_2026-09-24.md`

## 9. Known limitations / open decisions

1. `301` vs `308`: Owner ต้องตัดสินใจเอง (แก้ zone หรือปรับ contract) — ไม่ได้แก้ในงานนี้
2. Legacy disposition: `dc01` ยัง dual-serve อยู่ ถ้าจะ redirect/sunset ต้องมีแผนย้าย draft (JSON export/import) + ประกาศผู้ใช้ Pilot ก่อน
3. ยังไม่มีการเปลี่ยน catalog/Hub ภายนอกให้ลิงก์ไป canonical (ตอนนี้ hub-web ไม่มีลิงก์ไปทั้ง 2 hostname)
4. Parent registry `runtime_project`/description ยังเขียนว่า "canonical target pending migration" — ต้องอัปเดตใน parent repo แยกต่างหาก
5. Integration: branch นี้ยังไม่ได้ merge เข้า `master`; `master` ของ DocCraft ตามหลัง production อยู่ 6 commit (ก่อน migration)

## 10. Rollback

- main: `pnpm dlx wrangler@4.129.0 rollback e84767c8-955f-4562-a159-80fdee44722f --name wstera-dc01` (asset/security ชุดเดียวกับ production ก่อน migration) — custom domain ไม่ได้ผูกกับ version ถ้าจะถอด `doccraft.wstera.com` ต้อง deploy config ที่ไม่มี route นั้น
- redirect: `pnpm dlx wrangler@4.129.0 rollback 8d271814-327b-48b7-9ba6-3b314f9b6aa0 --name wstera-dc01-http-redirect` + ถอด route `http://doccraft.wstera.com/*`

## 11. Source ↔ runtime equivalence

- code/config ที่ deploy (`wrangler*.jsonc`, `worker/`, `scripts/`, `src/`) แก้ครั้งสุดท้ายก่อน deploy (≤ 2026-09-25T01:13:08Z เทียบกับ deploy 01:16:12Z / 01:17:29Z) และไม่ได้แตะอีกหลังจากนั้น — หลัง deploy เพิ่มแค่ docs
- rebuild จาก commit `8c0ffd6`: chunk JS/CSS 8/8 ตรงกับ live ทั้ง 2 host แบบ byte-identical, `index.html` ตรงกันเมื่อ normalize Next build id แล้ว (`0d6c5fc5931ba686…` ทั้ง live และ rebuild)
- Next build id สุ่มใหม่ทุกครั้งที่ build และถูกฝังอยู่ใน inline script จึงทำให้ CSP inline hash 2 ใน 3 ตัวต่างกันระหว่าง build — ไม่ใช่ source drift แต่หมายความว่า rebuild ไม่ bit-identical กับ artifact ที่ deploy ไปแล้ว (เป็นคุณสมบัติเดิม ไม่ได้เกิดจาก migration นี้)
