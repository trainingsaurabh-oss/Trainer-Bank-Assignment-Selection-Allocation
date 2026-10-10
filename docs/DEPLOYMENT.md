# Recommended cloud deployment: Render

Use the supplied `render.yaml` on the `feat/trainer-assignment-bridge` branch. It provisions one Node.js service, a 1 GB persistent disk mounted at `/var/data`, the SQLite database, build validation and `/healthz`. It does not enable demo access.

**Cost:** Render Starter and persistent disk are paid. No service has been created and no charges approved. Check the current price displayed by Render before creating the service; live pricing documentation was blocked by this environment's proxy. Render's free web service without a persistent disk does not meet this application's shared-data durability requirement.

## Hosting access still missing

There is no connected Render account/service or `RENDER_API_KEY` available in this task. The repository is pushed to GitHub, but that does not grant Render account access. No public service URL has yet been assigned.

To deploy through the Render dashboard:

1. Sign in to Render and connect your GitHub account through Render's GitHub integration. Grant access to `trainingsaurabh-oss/Trainer-Bank-Assignment-Selection-Allocation`.
2. Choose **New → Blueprint**, select this repository and branch `feat/trainer-assignment-bridge`, and review `render.yaml`.
3. Review the Starter service and persistent-disk price. Proceed only if you approve the charge shown. This is a paid service, not a free-tier deployment.
4. Create the Blueprint. Render runs validation and starts the application. Google credentials are intentionally not required by the Blueprint; add them later through the service's Environment settings.
5. Copy the actual HTTPS service URL from Render. Check `/healthz`, the landing page, and that `/api/dashboard` rejects unauthenticated access. The server automatically uses Render's `RENDER_EXTERNAL_URL`; an explicit `APP_URL` can override it.
6. After configuring Google sign-in below, verify the main workflow with real accounts and redeploy/restart once to confirm shared data survives.

If you want the assistant to execute the Render deployment instead, provide `RENDER_API_KEY` through the Codex environment's secure secret settings, scoped to `api.render.com`, and explicitly approve the Starter/disk charges before service creation. Never paste an API key into chat or commit it. A Render API key grants account access; revoke it after use if temporary.

## Google sign-in setup

1. Open Google Cloud Console, create/select a project, and configure **Google Auth Platform** branding, audience and contact information. Choose External for trainers outside your Google organisation. During testing, add each test account; publish the consent configuration before broader use as required by Google.
2. Create an OAuth client of type **Web application** with only `openid`, `email`, and `profile` scopes.
3. Add the exact service origin as an **Authorized JavaScript origin**, for example `https://trainer-assignment-bridge.onrender.com` only if Render actually assigns that address.
4. Add the exact redirect URI using the actual origin: `https://<actual-render-service-host>/auth/google/callback`. If the assigned host is `trainer-assignment-bridge.onrender.com`, the exact URI is `https://trainer-assignment-bridge.onrender.com/auth/google/callback`. If Render adds a suffix, use that hostname instead. No production hostname is currently verified.
5. For local testing on the existing port, the exact origin is `http://localhost:3000` and callback is `http://localhost:3000/auth/google/callback`. Do not use these for production.
6. In **Render → service → Environment**, enter `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `ADMIN_EMAIL`. Enter the secret directly in Render's secure environment editor; do not send it through chat, files, Git, screenshots, or logs. Set `ADMIN_EMAIL` before enabling sign-in, to the verified Google email that should own the application.
7. Set `APP_URL` to the exact HTTPS origin without a trailing slash if using a custom domain. Otherwise the application uses Render's assigned external URL. Save/redeploy.
8. Sign in with the Admin email first. Verify an approved trainer's access, a coordinator's scope and a Sub-admin's hierarchy using separate sessions. Confirm cookies are Secure/HttpOnly on HTTPS.

## Can hosting start before Google is configured?

Yes. This path is implemented and tested: landing page and health check return 200; Google login reports configuration missing; protected APIs return 401; demo login returns 404 in production. There is no temporary public administrator login. Until Google credentials are configured, normal users cannot access profiles, assignments, backups or settings.

A real Google login has not been tested without credentials. A deployed public URL, Render restart persistence, external TLS, and uptime have not been verified until the service exists.

## Recovery

Download an Admin backup off-host before cleanup or restore. External documents are referenced, not copied. Roll back to the preceding Git commit/container while retaining the disk. Restart logs sessions out but retains application data. After rollback check `/healthz` and a representative workflow. Do not run multiple independently stored replicas. Structured application error logs and the Render health-check path are configured; no external monitoring service is enabled.
