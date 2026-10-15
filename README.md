# Our Family Finance

A mobile-first Next.js / TypeScript / Tailwind family finance app for the Philippines. SQLite data stays on the server; no bank connections or third-party finance services.

## Run locally

Requires Node.js 24 (uses built-in `node:sqlite`).

```sh
npm ci --cache /tmp/family-npm-cache
npm run dev
```

Open the local development server on port 3000 in your own browser. Development without a password is for a trusted local machine only. To protect development too, set `FAMILY_PASSWORD` and optionally `FAMILY_USER` (default `family`) in `.env.local`. Never commit secrets.

```sh
npm test
npm run typecheck
npm run build
python3 tests/http_smoke.py # authenticated HTTP and restart checks, isolated temporary database
# Set a strong FAMILY_PASSWORD through your host's secure environment settings first.
npm start
```

Production refuses to serve any financial pages or API data if `FAMILY_PASSWORD` is absent. Shared family HTTP Basic authentication uses a hashed constant-time comparison; always deploy behind HTTPS, rate limiting and an access-controlled reverse proxy. Browsers retain Basic credentials: close the browser session to sign out. This MVP has a single shared household identity, not individual user accounts or password recovery. Use an identity provider with MFA and audited user sessions before opening to a wider audience. Do not expose the unauthenticated development server online.

## Deployment

For `mithistudios.com`, see [domain deployment instructions](docs/DOMAIN-DEPLOYMENT.md). `Dockerfile`, `compose.yaml`, and `deploy/Caddyfile` prepare a single-server installation with HTTPS and persistent SQLite storage. This does not provision a host or change DNS.

Use a Node 24 host/container with a persistent writable volume, not ephemeral serverless SQLite. Set `DATABASE_PATH` to the persistent SQLite filename; its parent directory must exist. Set a strong `FAMILY_PASSWORD` as a raw runtime secret in the hosting platform (not a network-proxy credential placeholder). Terminate HTTPS, preserve Host/Origin for write protection, restrict access, enable encrypted backups, and use one application instance with SQLite. Install with `npm ci`, build, then `npm start`. Production requires the password for all routes. No deployment has been performed by this project.

Back up using SQLite's backup API or stop the app and copy the database plus WAL/SHM files consistently. CSV is a report, not a complete audit/database backup. `data/finance.sqlite` is ignored. Seeds run once; real data persists across restarts. Never delete it to upgrade an existing household. Schema evolution needs explicit migrations.

## Accounting

See `docs/PLAN.md` for schema and implementation plan. Values are integer centavos. Cash starts at the user-provided ₱72,000 snapshot on 15 October 2026; earlier salary is already included. Transactions dated before this opening snapshot do not change its cash balance. It is not a verified bank balance. No fabricated expense history is seeded. Scheduled bills start unpaid because payment confirmation was not supplied. Expected income is never cash until received. Calendar dates are Philippine dates; the operating date uses Asia/Manila.

Card purchases count as expenses without reducing cash; later debt payments reduce cash without repeating expense. Transfers move between your own accounts and do not change consolidated totals; individual account balances and credit limits are not fabricated. Do not record a manual payment and also settle the same scheduled bill; use its Mark paid button, whose settlement ID is unique. Manual entries use an idempotency ID to protect retried requests, but identical amounts on distinct IDs are not automatically deduplicated because legitimate repeat purchases exist.

Savings amounts reserve existing cash, not separate bank accounts. Zero savings is an explicit planning assumption. Emergency milestones are ₱60k/₱180k/₱360k; the initial lot target and contribution are editable assumptions. Forecasts are scenarios, not guarantees: full remaining household budget is reserved for October because earlier October spending is unknown. Rent bills replace the monthly rent allocation; other scheduled obligations are additional. Undated November credit card payment remains undated. Atome amounts stay unverified and excluded. Estimated Panasonic installments are labeled. Full loan principal and purchase-level opening card history are unknown.

Records can be corrected or transactions voided; prior values remain in the append-only audit table. A future PostgreSQL adapter should preserve transactions, unique settlement IDs, centavos and audit revisions; replace SQLite JSON storage with JSONB or normalized entities and row locking. Current history UI shows the latest 200 audit events; the database retains all of them.

Browser visual tests were not run in the onboarding environment because the browser-download CDN was blocked by its network policy. Production build, calculation/storage tests, and authenticated HTTP/restart checks were exercised.
