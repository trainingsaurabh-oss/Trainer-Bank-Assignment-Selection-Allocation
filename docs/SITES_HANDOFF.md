# Codex Sites transfer handoff

## Goal

Host **Trainer Assignment Bridge** on Codex Sites with a native hosted URL, preserving the agreed application, real shared persistence, authentication, and server-enforced permissions. Do not steer to paid external hosting unless an actual Sites capability limitation is verified and explained first.

## Repository and baseline

- Repository: https://github.com/trainingsaurabh-oss/Trainer-Bank-Assignment-Selection-Allocation
- Branch: `feat/trainer-assignment-bridge`
- Tested application baseline: `1c5364290f8f4bd14d3abfd08ee3b8dc4e4f8cf9`.
- This handoff is a subsequent documentation-only update; runtime source remains unchanged.
- Main still contains the original license-only repository. Use this feature branch rather than main.
- PR API creation was blocked by `https://api.github.com/graphql: Forbidden`. Manual compare: https://github.com/trainingsaurabh-oss/Trainer-Bank-Assignment-Selection-Allocation/compare/main...feat/trainer-assignment-bridge?expand=1

Use the existing isolated checkout if available. Otherwise clone the repository and check out the feature branch. Do not create a worktree unless the user requests one.

## Read first

1. The available Sites skill and official runtime/publishing/storage/auth instructions.
2. `docs/PRODUCT_SPECIFICATION.md` and `docs/DEFAULT_RULES.md`.
3. `docs/IMPLEMENTATION_STATUS.md` for known application limits.
4. This handoff, `server.js`, `lib/store.js`, `lib/workflow.js`, and `lib/scoring.js`.

Check applicable AGENTS.md instructions in the destination. No AGENTS.md was present in this session's workspace.

## Preserved application

Node.js 24, built-in `node:sqlite`, no npm dependencies. Start with `npm start`; check with `npm run check` and `npm test`. Public assets are in `public/`. Relative same-origin `/api` requests connect the UI to the server. There is no frontend build step.

The server binds `0.0.0.0` on `PORT` (default 3000). `APP_URL` defines the external origin; the Render-specific fallback is optional, not a Sites integration. `DATABASE_PATH` locates SQLite. No Google OAuth credentials, database, sessions or private production records are committed.

Preserve trainer registration and versioned approval; scoped directories/ratings; leads and merged contribution attribution; online round-robin and pass escalation; matching and thresholds; initial/shortlist approvals; private client choice; booking conflicts; plans/reports; feedback; grading; backup/restore/cleanup; and mobile dashboards.

## Startup commands

From the repository checkout on `feat/trainer-assignment-bridge`:

```sh
node --version                 # Node 24 or newer
npm run check
npm test
```

No npm install is required: the package declares no third-party dependencies. `npm start` runs `node server.js`.

For isolated local evaluation with fictional accounts:

```sh
DEMO_MODE=1 \
DATABASE_PATH=/tmp/trainer-bridge-demo.sqlite \
PORT=3000 APP_URL=http://localhost:3000 \
npm start
```

For a compatible hosted backend after its persistent path and native URL are known:

```sh
# Supply these through the host's configuration, not a committed .env file.
# APP_URL=<actual-native-HTTPS-origin>
# DATABASE_PATH=<persistent-storage-path>/bridge.sqlite
# PORT=<host-assigned-port>
# DEMO_MODE must remain unset.
npm start
```

`GET /healthz` must return HTTP 200 and `{"status":"ok","database":true}`. Use a separate demo database; do not seed fictional accounts into a production database. An empty production database is initialised without demo users.

## Database and schema

`lib/store.js` uses synchronous `DatabaseSync` from `node:sqlite` with SQLite WAL mode. Physical schema:

```sql
PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS state (
  id INTEGER PRIMARY KEY CHECK(id=1),
  body TEXT NOT NULL
);
```

All application records are one JSON document in row `id=1`. Each mutation replaces that document with an atomic SQLite upsert. There are no separate relational tables or SQL foreign keys. Application state `version` is 1; there is no migration runner.

Top-level state:

- `users`: verified identity, name/email, role, reporting hierarchy, capacity and individually granted permissions.
- `trainers`: approved/pending profile, requested/revised versions, primary coordinator, tier, evidence status and delivery-score history.
- `leads`: assignment details, contributors, routing, invitations/responses, threshold/settings snapshots, initial/shortlist approvals, immutable client candidate snapshots, selection, reports, reviewers, deadlines and feedback.
- `settings`: suitability weights, pooling categories, feedback question templates and round-robin position.
- `audit`: action attribution and timestamps.
- `coordinatorEvents`: accept/pass/follow-through evidence.
- `backups`: IDs, timestamps, checksums and local backup file paths.
- `sessions`: legacy empty seed field; actual authentication sessions are **not** persisted here.

Default database path is `data/bridge.sqlite` relative to the application checkout. WAL/SHM companion files can be created beside it. Backups are JSON files in a sibling `backups/` directory derived from the database path. Production storage must support durable database and backup writes. `data/` and `.env` are Git-ignored and are not part of the transfer.

Mutations parse the request body before reading fresh state, then synchronously validate/write. The existing tests cover overlapping request bodies in one process. This does not establish distributed concurrency safety. Do not run independent replicas with separate state or assume a remote asynchronous adapter can preserve this guarantee without transactions/version checks.

Cleanup retains profiles, contribution attribution, scores and essential records, then performs checkpoint/VACUUM. JSON backup restore replaces the state after Admin confirmation. Backups reference external documents; they do not contain the linked document contents. Database snapshots of a live WAL database require a consistent backup mechanism, not copying the `.sqlite` file alone.

## Authentication and session design

- Google OAuth authorization-code flow with PKCE and `openid email profile` scopes.
- Browser redirects through `/auth/google`; callback is `/auth/google/callback`.
- OAuth state and PKCE verifier are stored in the server-memory `oauth` Map. A matching HttpOnly `bridge_oauth` cookie and a ten-minute age check bind the callback. Google token exchange and verified userinfo identify the account; transient Google tokens are not persisted.
- New users are identified by Google `sub`. The verified email matching `ADMIN_EMAIL` creates an Admin; other new accounts start as trainers and await profile approval. Staff roles are assigned through authenticated Admin actions.
- A random 32-byte session token is stored in the server-memory `sessions` Map with user ID and 24-hour expiry. The browser receives `bridge_session` with HttpOnly, SameSite=Lax, Path=/ and Max-Age=86400; Secure is added when `APP_URL` is HTTPS.
- Protected requests resolve the session and current role from server-side state. POST requests with a supplied foreign Origin are rejected. Roles and hierarchy checks are enforced in `lib/workflow.js`, not trusted from frontend controls.
- Restarting the process clears sessions and pending OAuth flows but retains persisted user/application records. Memory maps are not shared between instances. Expired sessions are rejected at lookup; entries are not periodically purged.
- Private client/feedback routes use bearer tokens rather than member sessions. Shortlist approval/expiry and feedback duplicate checks remain server-side. Forwarded client feedback is not independently verified client identity.
- Production demo login is disabled unless `DEMO_MODE=1` is explicitly set. Never set it on a public deployment.

## Environment-variable names

| Name | Current purpose | Requirement |
| --- | --- | --- |
| `PORT` | HTTP listening port; default 3000 | Host-provided or default |
| `APP_URL` | Exact external origin, no trailing slash | Set to the actual Sites HTTPS origin for hosted auth, cookies and Origin checks |
| `DATABASE_PATH` | Writable SQLite path | Must resolve to durable shared storage for the current implementation |
| `ADMIN_EMAIL` | Verified Google email that bootstraps Admin | Set before enabling Google sign-in |
| `GOOGLE_CLIENT_ID` | Google Web OAuth client | Required only if retaining the implemented Google flow |
| `GOOGLE_CLIENT_SECRET` | Google Web OAuth secret | Secure host secret entry only; never source/chat |
| `DEMO_MODE` | `1` enables fictional accounts and role-switch login | Local evaluation only; unset in production |
| `RENDER_EXTERNAL_URL` | Existing optional origin fallback after APP_URL | Render-specific; unnecessary for Sites |
| `NODE_ENV` | Existing Docker/optional host production convention | Current app does not use it to enable or disable demo/auth |
| `NODE_VERSION` | Existing optional Render build configuration | Not an application runtime variable |

`RENDER_API_KEY` was an optional deployment-tool secret declaration, not an application dependency, and is unnecessary for Sites. Its metadata can be removed in environment settings; no value was supplied or used.

## Runtime dependency boundaries

| Dependency | Current use | Receiving-session consideration |
| --- | --- | --- |
| Node.js 24+ | HTTP server, crypto, fetch, filesystem and built-in tests | Verify native Sites runtime compatibility before making changes |
| Built-in SQLite | Synchronous durable application state | Verify persistent SQLite support or migrate using documented Sites database APIs |
| Local writable disk | Database/WAL/SHM and verified backup JSON files | Ephemeral deployment storage is insufficient for shared production records |
| Server memory | Sessions, pending OAuth state, per-request JSON state | Restart logs users out; distributed instances require an appropriate auth/session and concurrency design |
| Google HTTPS endpoints | OAuth/token/userinfo | May be replaced by verified native Sites identity if supported |
| Browser | Relative same-origin API calls, SVG export and print-to-PDF | No React framework, build pipeline or browser-local shared database |

## Sites compatibility assessment

| Capability to verify | Existing requirement | Safe adaptation if necessary |
| --- | --- | --- |
| Backend execution | Node 24 HTTP service and `node:sqlite` | Use Sites' documented server/functions runtime; keep server-side workflow and access checks. |
| Durable shared data | SQLite on persistent storage, shared across users/restarts | Use Sites' native database/storage if required. Map profiles, leads, approvals, histories and audit records without data loss. |
| Concurrency | Body parsed before fresh state read; synchronous atomic SQLite write | An asynchronous/remote adapter needs transactions or versioned compare-and-swap; do not turn read/write into naive async operations. |
| Authentication | Google OAuth with PKCE, verified email, protected cookies | Use native Sites auth if supported; securely map verified identities to the existing roles. Never trust a browser-supplied role. |
| Sessions | Memory-only sessions; restart intentionally logs users out | Use Sites' documented session mechanism if instances are transient; preserve expiration and logout. |
| Secret configuration | OAuth secret securely injected | Use Sites' secret mechanism; never paste secrets into source or chat. |
| Routing and origin | `/`, `/client/:token`, `/feedback/:token`, `/api/*`, `/auth/google/*` | Preserve routes or update both client and server consistently; validate HTTPS cookies and origin checks. |
| Private client/feedback links | Unpredictable tokens, approval/expiry checks | Keep server-side checks; never export an unapproved shortlist. |
| Backups and cleanup | Downloadable backups, checksum verification, protected cleanup, SQLite compaction | Use durable Sites storage for backup files or a documented equivalent; retain ratings and attribution. |
| Deployment/health | Native URL and `/healthz` | Use Sites publication tools; verify the returned URL, health and restart persistence. |

If Sites offers static publishing only, the static UI by itself cannot implement this application's shared, authenticated workflows. That would be a verified limitation only after reading the actual Sites contract. Do not strip features, use localStorage as the shared database, or expose demo role switching to pretend deployment is complete.

## Authentication configuration

Keep `DEMO_MODE` unset in production. Local evaluation only: `DEMO_MODE=1 DATABASE_PATH=/tmp/bridge-demo.sqlite npm start`.

If Sites supports the existing Google flow, set `APP_URL` to the actual native HTTPS origin. The exact callback is `<actual-Sites-origin>/auth/google/callback`; no hostname has yet been assigned. Configure that full URI in Google's Web application OAuth client. Local callback: `http://localhost:3000/auth/google/callback`.

Configure `ADMIN_EMAIL` before enabling Google credentials. Enter `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` through Sites' secure settings, not chat. If Sites provides native authentication, assess whether it eliminates these external credentials and implement the mapping instead.

Deployment without OAuth is possible on a compatible backend: landing/health are public; protected APIs return 401 and demo login returns 404. Do not provide a temporary public admin bypass.

## Verification baseline and required deployed checks

The baseline has 31 passing Node tests: scoring, hierarchy/privacy, independent approvals, profile versioning, routing, concurrent requests, restart persistence, feedback duplication, backups and physical database compaction. Desktop/mobile browser walkthrough covered detailing, invitation/response, proposal/approval, client SVG/PDF, selection/confirmation, plan/report submissions, and both feedback forms with no browser errors or mobile overflow. Docker build/production health checks passed.

Real Google login, native Sites URL, Sites restart persistence and Sites runtime compatibility are not yet verified.

After adaptation:

1. Run existing tests and add tests for the new persistence/auth adapter.
2. Publish with the Sites tool and verify the actual native URL.
3. Use separate authenticated sessions to test role/hierarchy restrictions and shared updates.
4. Restart/redeploy and confirm records remain; never rely on an open dev process.
5. Exercise the full browser workflow and approval reset/expired client links.
6. Verify production demo endpoints stay disabled, protected APIs reject unsigned users, and secrets are absent from bundles/logs/exports.
7. Verify backup restore and cleanup retain ratings/profiles/contribution history.
8. Report exact runtime/storage limits, unresolved dependencies and real verification results.

## Continuation prompt

> Continue Trainer Assignment Bridge from `trainingsaurabh-oss/Trainer-Bank-Assignment-Selection-Allocation`, branch `feat/trainer-assignment-bridge`. Read `docs/SITES_HANDOFF.md`, the agreed specification and the available Codex Sites skill. The previous conversation had no Sites tools/skill; that was a session limitation, not proof Sites cannot host the app. Assess native runtime, persistent shared storage and authentication. Adapt and deploy through Sites while preserving all implemented workflows and permissions. Run existing tests, verify the native URL, real authentication and cross-session/restart persistence. Keep demo access disabled in production. Do not substitute browser-local data or steer to paid external hosting without verifying and explaining an actual Sites limitation. Ask only for blocking credentials/permissions through secure entry. Provide the deployed URL, final commit and verification evidence.
