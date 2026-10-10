const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { spawn } = require("node:child_process");
const { mkdtempSync, rmSync } = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { once } = require("node:events");
const { initialState } = require("../lib/seed");
const { act, visibleLead } = require("../lib/workflow");
function fixture() {
  const s = initialState(true),
    l = s.leads[0];
  return { s, l, u: (id) => s.users.find((u) => u.id === id) };
}
function invoke(f, id, action, extra = {}) {
  return act(f.s, f.u(id), { action, leadId: f.l.id, ...extra });
}
function approvedShortlist(f) {
  f.l.detailsConfirmed = true;
  f.l.responseDeadline = "2099-01-01";
  invoke(f, "coord1", "initialApprove");
  invoke(f, "coord1", "invite", { trainerId: "trainer1" });
  invoke(f, "trainer1", "respond", { response: "interested" });
  invoke(f, "coord1", "propose", {
    candidateIds: ["trainer1"],
    category: "Direct fit",
    reason: "Reviewed",
  });
}
test("trainer lead responses omit internal feedback, other matches and submissions", () => {
  const f = fixture();
  Object.assign(f.l, {
    feedback: [{ comment: "Private", fingerprint: "secret" }],
    matchSnapshot: { candidates: [{ trainerId: "trainer2" }] },
    additionalInfo: ["Internal"],
    clientContact: "private@example.test",
    clientToken: "secret",
  });
  const view = visibleLead(f.s, f.u("trainer1"), f.l);
  for (const key of [
    "feedback",
    "matchSnapshot",
    "additionalInfo",
    "clientContact",
    "clientToken",
    "submissions",
    "reviewerSuggestions",
  ])
    assert.equal(view[key], undefined, key);
  assert.ok(view.candidates.every((c) => c.trainerId === "trainer1"));
});
test("cross-hierarchy review is rejected without changing completion or history", () => {
  const f = fixture();
  Object.assign(f.l, {
    status: "confirmed",
    selectedTrainerId: "trainer1",
    reports: { report: { content: "Delivered" } },
  });
  assert.throws(
    () =>
      invoke(f, "sub2", "review", { kind: "report", score: 10, outcomes: 10 }),
    /Not an assigned reviewer/,
  );
  assert.equal(f.l.status, "confirmed");
  assert.equal(f.s.trainers[0].history.length, 0);
});
test("review rejects invalid outcome values and unconfirmed delivery", () => {
  const f = fixture();
  Object.assign(f.l, {
    status: "confirmed",
    selectedTrainerId: "trainer1",
    reviewerId: "coord1",
    reports: { report: { content: "Delivered" } },
  });
  for (const outcomes of [-1, 11, "bad"])
    assert.throws(
      () =>
        invoke(f, "coord1", "review", { kind: "report", score: 9, outcomes }),
      /Outcome/,
    );
  f.l.status = "inviting";
  assert.throws(
    () =>
      invoke(f, "coord1", "review", { kind: "report", score: 9, outcomes: 8 }),
    /Confirmed delivery/,
  );
});
test("material detail change requires new initial approval before proposing or sharing", () => {
  const f = fixture();
  approvedShortlist(f);
  invoke(f, "admin", "approveShortlist");
  assert.ok(f.l.clientToken);
  invoke(f, "coord1", "detailLead", { details: { fee: "Revised fee" } });
  assert.equal(f.l.clientToken, null);
  assert.throws(
    () =>
      invoke(f, "coord1", "propose", {
        candidateIds: ["trainer1"],
        category: "Direct fit",
        reason: "Reviewed",
      }),
    /initial approval/,
  );
  assert.throws(
    () => invoke(f, "admin", "approveShortlist"),
    /initial approval/,
  );
});
test("changed certificate loses prior verification while approved profile stays active", () => {
  const f = fixture(),
    t = f.s.trainers[0];
  t.profile.certificates = "https://example.test/old";
  t.certificationVerified = true;
  invoke(f, "coord1", "reviseProfile", {
    trainerId: t.id,
    profile: { ...t.profile, certificates: "https://example.test/new" },
  });
  assert.equal(t.profile.certificates, "https://example.test/old");
  assert.equal(t.certificationVerified, true);
  invoke(f, "sub1", "approveRevision", { trainerId: t.id });
  assert.equal(t.certificationVerified, false);
});
test("overlapping request bodies cannot overwrite committed state", async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "bridge-concurrency-"));
  const port = 31000 + Math.floor(Math.random() * 20000),
    base = `http://127.0.0.1:${port}`;
  const proc = spawn(process.execPath, ["server.js"], {
    cwd: path.resolve(__dirname, ".."),
    env: {
      ...process.env,
      PORT: String(port),
      APP_URL: base,
      DATABASE_PATH: path.join(dir, "db.sqlite"),
      DEMO_MODE: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Server timeout")), 5000);
      proc.stdout.on("data", (b) => {
        if (String(b).includes("listening")) {
          clearTimeout(timer);
          resolve();
        }
      });
      proc.once("exit", () => {
        clearTimeout(timer);
        reject(new Error("Server exited"));
      });
    });
    const login = await fetch(base + "/api/demo-login", {
        method: "POST",
        body: JSON.stringify({ userId: "admin" }),
      }),
      cookie = login.headers.get("set-cookie").split(";")[0];
    const slowBody = JSON.stringify({
      action: "createLead",
      title: "Slow lead",
      client: "A",
      brief: "Slow request body",
      mode: "virtual",
    });
    let slowRequest;
    const slowResult = new Promise((resolve, reject) => {
      slowRequest = http.request(
        base + "/api/actions",
        {
          method: "POST",
          headers: {
            Cookie: cookie,
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(slowBody),
          },
        },
        (res) => {
          res.resume();
          res.on("end", () => resolve(res.statusCode));
        },
      );
      slowRequest.on("error", reject);
      slowRequest.write(slowBody.slice(0, 10));
    });
    await new Promise((resolve) => setTimeout(resolve, 50));
    const fast = await fetch(base + "/api/actions", {
      method: "POST",
      headers: { Cookie: cookie },
      body: JSON.stringify({
        action: "createLead",
        title: "Fast lead",
        client: "B",
        brief: "Fast request body",
        mode: "virtual",
      }),
    });
    assert.equal(fast.status, 200);
    slowRequest.end(slowBody.slice(10));
    assert.equal(await slowResult, 200);
    const data = await (
      await fetch(base + "/api/dashboard", { headers: { Cookie: cookie } })
    ).json();
    assert.ok(data.leads.some((l) => l.title === "Fast lead"));
    assert.ok(data.leads.some((l) => l.title === "Slow lead"));
  } finally {
    if (proc.exitCode === null) {
      proc.kill();
      await once(proc, "exit");
    }
    rmSync(dir, { recursive: true, force: true });
  }
});
