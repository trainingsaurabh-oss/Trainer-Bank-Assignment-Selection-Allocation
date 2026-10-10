const test = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const { mkdtempSync, rmSync } = require("node:fs");
const os = require("node:os"),
  path = require("node:path");
const { once } = require("node:events");
async function start(dir, demo = true) {
  const port = 31000 + Math.floor(Math.random() * 20000),
    base = `http://127.0.0.1:${port}`;
  const proc = spawn(process.execPath, ["server.js"], {
    cwd: path.resolve(__dirname, ".."),
    env: {
      ...process.env,
      PORT: String(port),
      APP_URL: base,
      DATABASE_PATH: path.join(dir, "db.sqlite"),
      DEMO_MODE: demo ? "1" : "0",
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  proc.stderr.on("data", (b) => (output += b));
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(output || "Server startup timeout")),
      5000,
    );
    proc.stdout.on("data", (b) => {
      if (String(b).includes("listening")) {
        clearTimeout(timeout);
        resolve();
      }
    });
    proc.once("exit", () => {
      clearTimeout(timeout);
      reject(new Error(output || "Server exited"));
    });
  });
  return {
    base,
    proc,
    async stop() {
      proc.kill("SIGTERM");
      await once(proc, "exit");
    },
  };
}
async function login(server, user = "admin") {
  const r = await fetch(server.base + "/api/demo-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: user }),
  });
  assert.equal(r.status, 200);
  return r.headers.get("set-cookie").split(";")[0];
}
async function request(server, route, cookie, body) {
  return fetch(server.base + route, {
    method: body ? "POST" : "GET",
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
test("production refuses demo access and unauthenticated API access", async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "bridge-production-")),
    s = await start(dir, false);
  try {
    assert.equal((await request(s, "/api/demo-users")).status, 404);
    assert.equal(
      (await request(s, "/api/demo-login", null, { userId: "admin" })).status,
      404,
    );
    assert.equal((await request(s, "/api/dashboard")).status, 401);
    assert.equal((await request(s, "/auth/google")).status, 503);
  } finally {
    await s.stop();
    rmSync(dir, { recursive: true, force: true });
  }
});
test("real SQLite persistence survives process restart", async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "bridge-persistence-"));
  let s = await start(dir);
  try {
    const cookie = await login(s);
    const r = await request(s, "/api/actions", cookie, {
      action: "createLead",
      title: "Persisted requirement",
      client: "Example",
      brief: "This must survive restart",
      mode: "virtual",
    });
    assert.equal(r.status, 200);
    const { leadId } = await r.json();
    await s.stop();
    s = await start(dir);
    const again = await login(s);
    const d = await (await request(s, "/api/dashboard", again)).json();
    assert.ok(d.leads.some((l) => l.id === leadId));
  } finally {
    await s.stop();
    rmSync(dir, { recursive: true, force: true });
  }
});
test("client selection, feedback deduplication, backup and cleanup preserve ratings", async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "bridge-lifecycle-")),
    s = await start(dir);
  try {
    const admin = await login(s),
      coord = await login(s, "coord1"),
      trainer = await login(s, "trainer1");
    const action = async (cookie, p) => {
      const r = await request(s, "/api/actions", cookie, {
        leadId: "lead-welcome",
        ...p,
      });
      assert.equal(r.status, 200, await r.clone().text());
      return r.json();
    };
    await action(coord, {
      action: "detailLead",
      details: {
        detailsConfirmed: true,
        audience: "Supervisors",
        responseDeadline: "2099-01-01",
        date: "2020-01-01",
      },
    });
    await action(coord, { action: "initialApprove" });
    await action(coord, { action: "invite", trainerId: "trainer1" });
    await action(trainer, { action: "respond", response: "interested" });
    await action(coord, {
      action: "propose",
      candidateIds: ["trainer1"],
      category: "Relevant fit",
      reason: "Reviewed expertise",
    });
    await action(admin, { action: "approveShortlist" });
    let d = await (await request(s, "/api/dashboard", admin)).json(),
      lead = d.leads[0];
    let r = await request(s, "/api/client/" + lead.clientToken, null, {
      trainerId: "trainer1",
    });
    assert.equal(r.status, 200);
    await action(trainer, { action: "confirmBooking" });
    d = await (await request(s, "/api/dashboard", admin)).json();
    lead = d.leads[0];
    for (const kind of ["client", "audience"]) {
      const url = "/api/feedback/" + lead.feedbackLinks[kind];
      assert.equal(
        (
          await request(s, url, null, {
            answers: [5, 4, 4, 5, 4],
            comment: "Useful",
          })
        ).status,
        200,
      );
      assert.equal(
        (await request(s, url, null, { answers: [5, 4, 4, 5, 4] })).status,
        409,
      );
    }
    await action(trainer, {
      action: "submitReport",
      kind: "report",
      content: "Delivered all objectives",
    });
    await action(admin, { action: "assignReviewer", reviewerId: "coord1" });
    await action(coord, {
      action: "review",
      kind: "report",
      score: 9,
      outcomes: 8,
    });
    assert.equal(
      (
        await request(s, "/api/cleanup", admin, {
          confirm: "DELETE",
          before: "2099-01-01",
        })
      ).status,
      400,
    );
    assert.equal((await request(s, "/api/backup", trainer)).status, 403);
    r = await request(s, "/api/backup", admin);
    assert.equal(r.status, 200);
    const backupId = r.headers.get("x-backup-id"),
      backup = await r.json();
    assert.equal(backup.format, "bridge-backup-v1");
    r = await request(s, "/api/cleanup", admin, {
      confirm: "DELETE",
      backupId,
      before: "2099-01-01",
    });
    assert.equal(r.status, 200);
    d = await (await request(s, "/api/dashboard", admin)).json();
    const t = d.trainers.find((t) => t.id === "trainer1");
    assert.equal(t.profile.name, "Ananya Sharma");
    assert.equal(t.history.length, 1);
    assert.equal(d.leads[0].brief, "");
    assert.equal(d.leads[0].reports.report, undefined);
    assert.equal(d.leads[0].feedback[0].score, 8.8);
    await action(admin, {
      action: "createLead",
      title: "Active lead",
      client: "Example",
      brief: "Do not remove",
      mode: "virtual",
    });
    const newer = await (await request(s, "/api/dashboard", admin)).json();
    assert.ok(newer.leads.some((l) => l.brief === "Do not remove"));
  } finally {
    await s.stop();
    rmSync(dir, { recursive: true, force: true });
  }
});
