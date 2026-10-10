# Trainer Assignment Bridge

_Connecting trainers, opportunities, and facilitation._

A lightweight Node.js 24 application with shared SQLite persistence, Google sign-in, role dashboards, explainable trainer matching, approval workflows, client shortlists, reviews, and feedback. No npm dependencies are required.

## Run locally

```sh
npm run dev
```

Open the application on port 3000. The explicitly labelled demo environment includes fictional accounts. Demo accounts must never be enabled on a public production deployment. The initial demo seed is only created for an empty database; use a separate DATABASE_PATH for evaluation.

```sh
npm test
npm run check
```

## Production configuration

Use Node.js 24 and run `npm start`. Set:

| Variable               | Purpose                                                      |
| ---------------------- | ------------------------------------------------------------ |
| `APP_URL`              | Exact HTTPS public origin, without trailing slash            |
| `DATABASE_PATH`        | SQLite path on a persistent writable disk                    |
| `ADMIN_EMAIL`          | Verified Google email that bootstraps the Admin account      |
| `GOOGLE_CLIENT_ID`     | Google OAuth web client ID                                   |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret; supply securely in host settings |
| `PORT`                 | Host-provided listening port, default 3000                   |

Create a Google OAuth web client with redirect URI `APP_URL/auth/google/callback`. Set the application's public origin in authorized JavaScript origins. Google verifies email before account creation. Other accounts start as trainers and require profile approval. Keep `DEMO_MODE` unset in production.

Sessions use HttpOnly cookies and expire after 24 hours. Restarting the server logs users out; application data remains in SQLite. Run one instance against its persistent disk. Do not scale horizontally with independent database copies.

## Deployment

No deployment account was present at initial implementation. Two supported deployment artifacts are provided:

- `Dockerfile`: run on an existing cloud server with a persistent `/app/data` volume, TLS reverse proxy, and the variables above.
- `render.yaml`: a Render blueprint using a persistent disk. **This selects Render's paid Starter plan because its free web tier does not provide the required persistent disk. Do not create it without reviewing and approving current costs.** No service has been provisioned by this repository.

On an existing Docker-capable cloud host:

```sh
docker build -t trainer-assignment-bridge .
docker run -d --name trainer-bridge --restart unless-stopped \
  --env-file /secure/path/bridge.env \
  -p 127.0.0.1:3000:3000 \
  -v bridge-data:/app/data trainer-assignment-bridge
```

Place it behind the host's HTTPS proxy. Verify `/healthz` returns `{"status":"ok","database":true}`. Verify a Google login, registration approval, two different user sessions, invitation flow, and persistence after container restart before using real trainer data. Container health checks and structured error logs are included; external uptime monitoring is not configured.

## Recovery and storage

Admin backup exports the application records and external document links. Cleanup requires a recent, checksum-verified backup and a previewed cutoff, and only compacts closed/completed leads. Profiles, rating inputs/summaries, contribution identities, approvals, and audit records remain. Document contents remain with their external provider and are not copied into backups.

Download backups off the application host and store them securely. Server backup files also consume disk; do not assume downloading frees that space. Restore through the Admin API/UI with explicit confirmation; take a fresh backup before restoring. For database-level recovery, stop the process and restore a consistent SQLite backup including WAL state or use SQLite's online backup facility. Never copy only a live `.sqlite` file while WAL writes are active.

Rollback application code to the previous Git commit/container image while keeping the persistent volume. Validate `/healthz` and affected user flows. Schema/state version is currently 1; future migrations require a pre-migration backup.

## Implemented workflows

- Trainer registration, coordinator-prepared revisions and Sub-admin approval, limited public member directory.
- Quick lead creation, confirmed duplicate contribution merging, round-robin online routing, coordinator pass escalation.
- Explainable suitability out of 10, configurable pooling and Admin weight controls, minimum threshold and Admin exceptions.
- Independent Standard/Crucial approvals, interested-candidate shortlists, private client selection and booking-conflict checks.
- Text plans/reports, expert-reviewer assignment, deadlines/extensions, reviewed completion, audience/client forms.
- Hierarchy-scoped dashboards, ratings, coordinator preference evidence, individual delegated permissions.
- Admin backup, restore, and protected cleanup; health checks and CI.

## Current limits

See `docs/IMPLEMENTATION_STATUS.md` for verified features and limitations. Public deployment and actual Google sign-in need external configuration. This repository is not evidence of a deployed site.
