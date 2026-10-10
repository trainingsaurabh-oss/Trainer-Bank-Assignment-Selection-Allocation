const http = require("node:http"),
  fs = require("node:fs"),
  path = require("node:path"),
  crypto = require("node:crypto");
const { openStore } = require("./lib/store"),
  { initialState } = require("./lib/seed"),
  {
    act,
    dashboard,
    candidates,
    manages,
    visibleLead,
    fail,
    syncHistory,
  } = require("./lib/workflow");
const demo = process.env.DEMO_MODE === "1",
  port = Number(process.env.PORT || 3000),
  base = (
    process.env.APP_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    `http://localhost:${port}`
  ).replace(/\/$/, "");
const store = openStore(
  process.env.DATABASE_PATH || path.join(__dirname, "data", "bridge.sqlite"),
);
if (!store.read()) store.write(initialState(demo));
const oauth = new Map(),
  sessions = new Map();
function json(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}
async function body(req) {
  let text = "";
  for await (const chunk of req) {
    text += chunk;
    if (text.length > 1048576) fail("Request too large", 413);
  }
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    fail("Invalid JSON");
  }
}
function cookie(req) {
  return (req.headers.cookie || "")
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("bridge_session="))
    ?.split("=")[1];
}
function setSession(res, userId) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { userId, expires: Date.now() + 86400000 });
  res.setHeader(
    "Set-Cookie",
    `bridge_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400${base.startsWith("https:") ? "; Secure" : ""}`,
  );
}
function tokenLead(s, token, type) {
  const lead = s.leads.find((l) =>
    type === "client"
      ? l.clientToken === token
      : l.feedbackLinks?.[type] === token,
  );
  if (!lead) fail("Link not found", 404);
  return lead;
}
const server = http.createServer(async (req, res) => {
  const started = Date.now();
  try {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'",
    );
    const parsedBody = req.method === "POST" ? await body(req) : null;
    const url = new URL(req.url, base);
    let s = store.read();
    const session = sessions.get(cookie(req)),
      u =
        session && session.expires > Date.now()
          ? s.users.find((x) => x.id === session.userId)
          : null;
    if (
      req.method === "POST" &&
      req.headers.origin &&
      req.headers.origin !== new URL(base).origin
    )
      fail("Cross-origin request rejected", 403);
    if (url.pathname === "/healthz")
      return json(res, 200, { status: "ok", database: !!s });
    if (url.pathname === "/api/session")
      return json(res, 200, {
        user: u || null,
        demo,
        googleConfigured: !!(
          process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ),
      });
    if (url.pathname === "/api/demo-users") {
      if (!demo) fail("Demo disabled", 404);
      return json(
        res,
        200,
        s.users.map(({ id, name, role }) => ({ id, name, role })),
      );
    }
    if (url.pathname === "/api/demo-login" && req.method === "POST") {
      if (!demo) fail("Demo disabled", 404);
      const p = parsedBody;
      if (!s.users.some((x) => x.id === p.userId)) fail("Unknown demo user");
      setSession(res, p.userId);
      return json(res, 200, { ok: true });
    }
    if (url.pathname === "/api/logout" && req.method === "POST") {
      sessions.delete(cookie(req));
      res.setHeader(
        "Set-Cookie",
        "bridge_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
      );
      return json(res, 200, { ok: true });
    }
    if (url.pathname === "/auth/google") {
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)
        fail(
          "Google sign-in requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET",
          503,
        );
      const state = crypto.randomBytes(32).toString("hex"),
        verifier = crypto.randomBytes(32).toString("base64url");
      oauth.set(state, { verifier, at: Date.now() });
      const q = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        redirect_uri: base + "/auth/google/callback",
        response_type: "code",
        scope: "openid email profile",
        state,
        code_challenge: crypto
          .createHash("sha256")
          .update(verifier)
          .digest("base64url"),
        code_challenge_method: "S256",
      });
      res.setHeader(
        "Set-Cookie",
        `bridge_oauth=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=600${base.startsWith("https:") ? "; Secure" : ""}`,
      );
      res.writeHead(302, {
        Location: "https://accounts.google.com/o/oauth2/v2/auth?" + q,
      });
      return res.end();
    }
    if (url.pathname === "/auth/google/callback") {
      const state = url.searchParams.get("state"),
        entry = oauth.get(state),
        bound = (req.headers.cookie || "").includes("bridge_oauth=" + state);
      oauth.delete(state);
      if (!entry || !bound || Date.now() - entry.at > 600000)
        fail("Invalid or expired sign-in state", 403);
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: url.searchParams.get("code") || "",
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: base + "/auth/google/callback",
          grant_type: "authorization_code",
          code_verifier: entry.verifier,
        }),
      });
      if (!response.ok) fail("Google token exchange failed", 502);
      const token = await response.json(),
        identityResponse = await fetch(
          "https://openidconnect.googleapis.com/v1/userinfo",
          { headers: { Authorization: "Bearer " + token.access_token } },
        );
      if (!identityResponse.ok) fail("Google identity check failed", 502);
      const identity = await identityResponse.json();
      if (!identity.sub || !identity.email || !identity.email_verified)
        fail("Verified email required", 403);
      s = store.read();
      let account = s.users.find((x) => x.googleSub === identity.sub);
      if (!account) {
        account = {
          id: crypto.randomUUID(),
          googleSub: identity.sub,
          name: identity.name,
          email: identity.email,
          role:
            identity.email.toLowerCase() ===
            (process.env.ADMIN_EMAIL || "").toLowerCase()
              ? "admin"
              : "trainer",
        };
        s.users.push(account);
        store.write(s);
      }
      setSession(res, account.id);
      res.writeHead(302, { Location: "/" });
      return res.end();
    }
    if (url.pathname.startsWith("/api/client/")) {
      const l = tokenLead(s, url.pathname.split("/").pop(), "client");
      if (l.status !== "client_selection" || Date.now() > l.clientExpires)
        fail("Shortlist is no longer available", 410);
      if (req.method === "POST") {
        const p = parsedBody;
        if (!l.shortlist.includes(p.trainerId))
          fail("Candidate not in approved shortlist");
        l.selectedTrainerId = p.trainerId;
        l.status = "awaiting_confirmation";
        l.clientSelectedAt = new Date().toISOString();
        store.write(s);
        return json(res, 200, { ok: true });
      }
      return json(res, 200, {
        lead: {
          id: l.id,
          title: l.title,
          date: l.date,
          mode: l.mode,
          location: l.location,
          recommendation: l.clientRecommendation,
          version: l.approvals.length,
        },
        candidates:
          l.clientCandidates ||
          l.shortlist.map((tid) => {
            const t = s.trainers.find((t) => t.id === tid);
            return {
              trainerId: tid,
              name: t.profile.name,
              profile: {
                name: t.profile.name,
                city: t.profile.city,
                linkedin: t.profile.linkedin,
                cv: t.profile.cv,
                introduction: t.profile.introduction,
                topics: t.profile.topics,
                industries: t.profile.industries,
                experience: t.profile.experience,
              },
            };
          }),
      });
    }
    if (url.pathname.startsWith("/api/feedback/")) {
      const token = url.pathname.split("/").pop(),
        l = s.leads.find((l) =>
          Object.values(l.feedbackLinks || {}).includes(token),
        );
      if (!l) fail("Feedback link not found", 404);
      if (l.compactedAt) fail("Feedback is closed for archived sessions", 410);
      if (
        (l.sessionEnd || l.date) &&
        Date.now() < Date.parse(l.sessionEnd || l.date)
      )
        fail("Feedback opens at the session date", 403);
      const kind = l.feedbackLinks.client === token ? "client" : "audience";
      if (req.method === "POST") {
        const p = parsedBody;
        if (
          !Array.isArray(p.answers) ||
          p.answers.length !== 5 ||
          p.answers.some((a) => !Number.isInteger(a) || a < 0 || a > 5)
        )
          fail("Five answers from 0–5 required");
        const fingerprint = crypto
          .createHash("sha256")
          .update(
            token +
              "|" +
              (req.headers.cookie || "") +
              "|" +
              req.socket.remoteAddress +
              "|" +
              req.headers["user-agent"],
          )
          .digest("hex");
        l.feedback = l.feedback || [];
        if (
          l.feedback.some(
            (f) =>
              f.kind === kind &&
              (kind === "client" || f.fingerprint === fingerprint),
          )
        )
          fail("Feedback already submitted", 409);
        const scored = p.answers.filter((a) => a > 0);
        l.feedback.push({
          kind,
          answers: p.answers,
          comment: String(p.comment || "").slice(0, 3000),
          score: scored.length
            ? (scored.reduce((a, b) => a + b, 0) / scored.length) * 2
            : null,
          fingerprint,
          at: new Date().toISOString(),
        });
        syncHistory(s, l);
        store.write(s);
        return json(res, 200, { ok: true });
      }
      return json(res, 200, {
        kind,
        questions: l.feedbackQuestions[kind],
        title: l.title,
      });
    }
    if (url.pathname.startsWith("/api/")) {
      if (!u) fail("Sign in required", 401);
      if (url.pathname === "/api/duplicates") {
        if (
          u.role === "trainer" &&
          !s.trainers.some((t) => t.userId === u.id && t.status === "approved")
        )
          fail("Profile approval required", 403);
        const title = (url.searchParams.get("title") || "")
            .toLowerCase()
            .trim(),
          client = (url.searchParams.get("client") || "").toLowerCase().trim();
        if (title.length < 3) return json(res, 200, []);
        return json(
          res,
          200,
          s.leads
            .filter(
              (l) =>
                !["closed", "completed"].includes(l.status) &&
                (l.title.toLowerCase().includes(title) ||
                  title.includes(l.title.toLowerCase())) &&
                (!client ||
                  client === "not disclosed yet" ||
                  l.client.toLowerCase() === client),
            )
            .map((l) => ({
              id: l.id,
              title: l.title,
              submissionCount: l.submissions.length,
            })),
        );
      }
      if (url.pathname === "/api/dashboard")
        return json(res, 200, dashboard(s, u));
      if (url.pathname === "/api/actions" && req.method === "POST") {
        const result = act(s, u, parsedBody);
        store.write(s);
        return json(res, 200, result);
      }
      if (url.pathname.startsWith("/api/leads/")) {
        const l = s.leads.find((l) => l.id === url.pathname.split("/").pop());
        if (!l) fail("Not found", 404);
        if (
          !manages(s, u, l) &&
          l.createdBy !== u.id &&
          !l.invitations.some((i) => i.trainerId === u.id) &&
          l.reviewerId !== u.id
        )
          fail("Permission denied", 403);
        return json(res, 200, visibleLead(s, u, l));
      }
      if (url.pathname === "/api/backup") {
        if (u.role !== "admin") fail("Admin only", 403);
        const backupId = crypto.randomUUID(),
          snapshot = JSON.parse(JSON.stringify(s));
        delete snapshot.sessions;
        const bytes = JSON.stringify(
          {
            format: "bridge-backup-v1",
            backupId,
            createdAt: new Date().toISOString(),
            state: snapshot,
          },
          null,
          2,
        );
        fs.mkdirSync(
          path.join(
            path.dirname(
              process.env.DATABASE_PATH ||
                path.join(__dirname, "data", "bridge.sqlite"),
            ),
            "backups",
          ),
          { recursive: true },
        );
        const filename = path.join(
          path.dirname(
            process.env.DATABASE_PATH ||
              path.join(__dirname, "data", "bridge.sqlite"),
          ),
          "backups",
          backupId + ".json",
        );
        fs.writeFileSync(filename, bytes, { mode: 0o600 });
        s.backups.push({
          id: backupId,
          at: new Date().toISOString(),
          sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
          filename,
        });
        store.write(s);
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="bridge-backup-${backupId}.json"`,
          "X-Backup-Id": backupId,
        });
        return res.end(bytes);
      }
      if (url.pathname === "/api/backup-preview") {
        if (u.role !== "admin") fail("Admin only", 403);
        const before = url.searchParams.get("before");
        if (!Number.isFinite(Date.parse(before)))
          fail("Valid cutoff date required");
        return json(res, 200, {
          eligible: s.leads
            .filter(
              (l) =>
                ["completed", "closed"].includes(l.status) &&
                Date.parse(l.completedAt || l.createdAt) < Date.parse(before),
            )
            .map((l) => ({ id: l.id, title: l.title, status: l.status })),
          backups: s.backups.map(({ id, at }) => ({ id, at })),
        });
      }
      if (url.pathname === "/api/cleanup" && req.method === "POST") {
        if (u.role !== "admin") fail("Admin only", 403);
        const p = parsedBody,
          backup = s.backups.find((b) => b.id === p.backupId);
        if (
          p.confirm !== "DELETE" ||
          !backup ||
          !Number.isFinite(Date.parse(p.before))
        )
          fail(
            "Verified backup, cutoff date, and DELETE confirmation required",
          );
        const bytes = fs.readFileSync(backup.filename, "utf8");
        if (
          crypto.createHash("sha256").update(bytes).digest("hex") !==
          backup.sha256
        )
          fail("Backup verification failed");
        if (Date.now() - Date.parse(backup.at) > 3600000)
          fail("Create a fresh backup before cleanup");
        const backedState = JSON.parse(bytes).state;
        let count = 0;
        for (const l of s.leads) {
          if (
            ["completed", "closed"].includes(l.status) &&
            Date.parse(l.completedAt || l.createdAt) < Date.parse(p.before)
          ) {
            if (
              JSON.stringify(backedState.leads.find((x) => x.id === l.id)) !==
              JSON.stringify(l)
            )
              fail("Records changed after backup; create a fresh backup");
            if (
              Date.parse(l.completedAt || l.createdAt) > Date.parse(backup.at)
            )
              fail("Backup does not cover selected records");
            l.brief = "";
            l.additionalInfo = [];
            l.submissions = l.submissions.map(
              ({ id, userId, at, verified }) => ({ id, userId, at, verified }),
            );
            l.reports = {};
            l.feedback = (l.feedback || []).map(({ kind, score, at }) => ({
              kind,
              score,
              at,
            }));
            l.compactedAt = new Date().toISOString();
            count++;
          }
        }
        store.write(s);
        store.compact();
        return json(res, 200, { ok: true, compacted: count });
      }
      if (url.pathname === "/api/remove-backup" && req.method === "POST") {
        if (u.role !== "admin") fail("Admin only", 403);
        const p = parsedBody,
          backup = s.backups.find((b) => b.id === p.backupId);
        if (!backup || p.confirm !== "REMOVE BACKUP")
          fail("Backup ID and REMOVE BACKUP confirmation required");
        fs.unlinkSync(backup.filename);
        s.backups = s.backups.filter((b) => b.id !== backup.id);
        store.write(s);
        return json(res, 200, { ok: true });
      }
      if (url.pathname === "/api/restore" && req.method === "POST") {
        if (u.role !== "admin") fail("Admin only", 403);
        const p = parsedBody;
        if (
          p.confirm !== "RESTORE" ||
          p.backup?.format !== "bridge-backup-v1" ||
          !p.backup.state?.users?.some(
            (x) => x.id === u.id && x.role === "admin",
          )
        )
          fail("Valid backup and RESTORE confirmation required");
        const restored = p.backup.state;
        if (
          !Array.isArray(restored.trainers) ||
          !Array.isArray(restored.leads) ||
          !restored.settings
        )
          fail("Invalid backup structure");
        store.write(restored);
        return json(res, 200, { ok: true });
      }
      fail("Endpoint not found", 404);
    }
    const requested =
      url.pathname === "/" || /^\/(client|feedback)\//.test(url.pathname)
        ? "index.html"
        : url.pathname.slice(1);
    const filename = path.resolve(__dirname, "public", requested);
    if (!filename.startsWith(path.join(__dirname, "public") + path.sep))
      fail("Not found", 404);
    if (!fs.existsSync(filename) || !fs.statSync(filename).isFile())
      fail("Not found", 404);
    const ext = path.extname(filename);
    res.writeHead(200, {
      "Content-Type":
        {
          ".html": "text/html; charset=utf-8",
          ".js": "text/javascript",
          ".css": "text/css",
          ".svg": "image/svg+xml",
        }[ext] || "application/octet-stream",
    });
    fs.createReadStream(filename).pipe(res);
  } catch (e) {
    console.error(
      JSON.stringify({
        at: new Date().toISOString(),
        method: req.method,
        path: req.url
          ?.split("?")[0]
          .replace(/(client|feedback)\/[^/]+/g, "$1/[private-link]"),
        status: e.status || 500,
        message: e.message,
        duration: Date.now() - started,
      }),
    );
    if (!res.headersSent)
      json(res, e.status || 500, {
        error: e.status ? e.message : "Unexpected server error",
      });
    else res.end();
  }
});
if (require.main === module)
  server.listen(port, "0.0.0.0", () =>
    console.log(`Trainer Assignment Bridge listening on ${port}; demo=${demo}`),
  );
module.exports = { server, store };
