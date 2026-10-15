# Connect mithistudios.com

Deployment files are prepared; no hosting, DNS changes, or public deployment have been performed. You must control the domain and a suitable server. Check whether the domain already serves a website before changing its DNS. Use `finance.mithistudios.com` if the main website should stay where it is.

## Host requirements

A Linux VPS or Docker host with Docker Compose, at least 2 GB RAM (more for builds), a public IP, persistent disk and encrypted backup capability. Generic static/shared PHP hosting cannot run this Next.js/SQLite app. One app instance writes to a persistent Docker volume. Use a hosting-provider firewall or trusted edge service to rate limit requests, and restrict administrative access. Do not publish the container's port 3000 directly.

## Server setup

1. Upload the project to a private directory on the server. Do not upload local `data/`, `.env*`, `.git`, `node_modules`, or `.next`. The deployment creates a fresh database from the supplied sample data. Migrating real finance records requires a separate consistent, encrypted SQLite backup/restore.
2. Set `APP_DOMAIN=mithistudios.com` in a private `.env` alongside `compose.yaml` (or `finance.mithistudios.com` for a subdomain). Set `FAMILY_USER=family` or a username you choose. Generate a strong unique password using a password manager and store it as `FAMILY_PASSWORD` in that server file or the host's secure runtime environment. Never send its value in chat, commit the file, or put it into DNS. Restrict the file with `chmod 600 .env`.
3. In the domain's DNS settings, point the chosen hostname's A record to the server's actual public IPv4 address supplied by the host. Do not invent an address. Update an AAAA record only if the host supports and routes IPv6; remove stale records for this hostname. Preserve email MX/TXT records and unrelated website records.
4. Permit inbound TCP ports 80 and 443 in the host firewall. Caddy obtains and renews a valid HTTPS certificate after DNS resolves. If an existing reverse proxy already uses these ports, integrate the app into that proxy instead of replacing it. With an external CDN, use strict HTTPS to the origin and disable caching for all app pages and API responses.
5. On the server run `docker compose up -d --build`. Watch `docker compose logs --tail=100 https app` for build, database or certificate errors. Do not disable TLS verification to bypass certificate failures.
6. Verify the public hostname requests a username and password before financial data is visible. Log in on both phone and computer. Record a small test transaction, confirm it appears on the other device, then void it. Restart the app and confirm history remains. Confirm unauthenticated API requests return 401 and HTTPS is valid. Test encrypted backup and restore before relying on the app for real records.

## Operations

- `docker compose restart app` restarts the app while retaining finance data.
- `docker compose down` retains named volumes; **do not use `down -v`**, which deletes data.
- Stop writes and make a consistent encrypted backup before upgrades. A CSV export is not a complete database/audit backup.
- The deployment uses shared family Basic authentication. Keep the password in a password manager; HTTPS is mandatory. The browser may retain credentials until its session is closed. Configure host/edge rate limiting before making the site public.
- The cloud development server and your domain are separate machines. Changing the domain alone does not deploy the app.

The configuration has no domain-management credentials and cannot alter DNS on your behalf. Provider-specific steps depend on your domain registrar, current DNS host, and hosting account.

## Canva-managed domain

Canva website hosting cannot execute this Next.js server or store its SQLite database. Use a separate Node/Docker host with persistent storage. If the main domain already serves a Canva website, retain it and connect `finance.mithistudios.com` to the app host through the domain's DNS manager. Confirm whether Canva manages registration/DNS or only the website before making provider-specific changes. No DNS changes were made.

## Validation in this workspace

Docker Compose configuration and Caddy HTTPS configuration validation passed. The app already passed its native production build and authenticated HTTP/storage checks. The Docker image build could not complete here because build-container DNS resolution for the package registry failed (`EAI_AGAIN`). No TLS or package integrity verification was disabled. Validate the complete image on the selected host before public deployment.
