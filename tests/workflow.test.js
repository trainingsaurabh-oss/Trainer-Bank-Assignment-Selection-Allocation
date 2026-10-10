const test = require("node:test");
const assert = require("node:assert/strict");
const { initialState } = require("../lib/seed");
const { act, dashboard } = require("../lib/workflow");
function fixture(crucial = false) {
  const s = initialState(true),
    u = (id) => s.users.find((x) => x.id === id),
    l = s.leads[0];
  l.crucial = crucial;
  l.detailsConfirmed = true;
  l.responseDeadline = "2099-01-01";
  return { s, u, l };
}
function invoke(f, user, action, extra = {}) {
  return act(f.s, f.u(user), { action, leadId: f.l.id, ...extra });
}
function proposed(f) {
  invoke(f, "coord1", "initialApprove");
  if (f.l.crucial) invoke(f, "sub1", "initialApprove");
  invoke(f, "coord1", "invite", { trainerId: "trainer1" });
  invoke(f, "trainer1", "respond", { response: "interested" });
  invoke(f, "coord1", "propose", {
    candidateIds: ["trainer1"],
    category: "Direct fit",
    reason: "Relevant expertise",
  });
}
test("crucial readiness requires coordinator plus independent senior reviewer", () => {
  const f = fixture(true);
  invoke(f, "admin", "initialApprove");
  assert.equal(f.l.status, "awaiting_initial_approval");
  assert.throws(() => invoke(f, "admin", "initialApprove"), /Already approved/);
  invoke(f, "coord1", "initialApprove");
  assert.equal(f.l.status, "inviting");
});
test("crucial shortlist requires two distinct approvals and proposer cannot approve", () => {
  const f = fixture(true);
  proposed(f);
  invoke(f, "sub1", "approveShortlist");
  assert.equal(f.l.clientToken, null);
  assert.throws(
    () => invoke(f, "sub1", "approveShortlist"),
    /Already approved/,
  );
  invoke(f, "admin", "approveShortlist");
  assert.ok(f.l.clientToken);
  f.l.proposerId = "admin";
  assert.throws(() => invoke(f, "admin", "approveShortlist"), /Proposer/);
});
test("revised shortlist resets approvals and client access", () => {
  const f = fixture();
  proposed(f);
  invoke(f, "admin", "approveShortlist");
  assert.ok(f.l.clientToken);
  invoke(f, "coord1", "propose", {
    candidateIds: ["trainer1"],
    category: "Direct fit",
    reason: "Reconsidered shortlist",
  });
  assert.equal(f.l.approvals.length, 0);
  assert.equal(f.l.clientToken, null);
});
test("threshold below seven requires Admin and recorded reason", () => {
  const f = fixture();
  assert.throws(
    () => invoke(f, "coord1", "initialApprove", { threshold: 6 }),
    /Only Admin/,
  );
  assert.throws(
    () => invoke(f, "admin", "initialApprove", { threshold: 6 }),
    /Only Admin/,
  );
  invoke(f, "admin", "initialApprove", {
    threshold: 6,
    reason: "Special case",
  });
  assert.equal(f.l.threshold, 6);
});
test("profile revision preserves active profile until approval", () => {
  const f = fixture(),
    t = f.s.trainers[0],
    original = t.profile.name;
  invoke(f, "coord1", "reviseProfile", {
    trainerId: t.id,
    profile: { ...t.profile, name: "Updated name" },
  });
  assert.equal(t.profile.name, original);
  invoke(f, "sub1", "approveRevision", { trainerId: t.id });
  assert.equal(t.profile.name, "Updated name");
  assert.equal(t.versions[0].profile.name, original);
});
test("coordinator cannot change weights, hierarchy, or trainer ownership", () => {
  const f = fixture();
  for (const p of [
    { action: "updateSettings", settings: { weights: f.s.settings.weights } },
    { action: "assignHierarchy", coordinatorId: "coord1", subadminId: "sub2" },
    {
      action: "selectCoordinator",
      trainerId: "trainer1",
      coordinatorId: "coord2",
    },
  ])
    assert.throws(
      () => act(f.s, f.u("coord1"), p),
      /Permission|permission|Admin-only/,
    );
});
test("passed online lead escalates without disrupting next round-robin turn", () => {
  const f = fixture();
  const a = act(f.s, f.u("trainer1"), {
      action: "createLead",
      title: "Excel",
      client: "A",
      brief: "Online requirement",
      mode: "virtual",
    }),
    first = f.s.leads.find((x) => x.id === a.leadId);
  assert.equal(first.ownerId, "coord1");
  act(f.s, f.u("coord1"), {
    action: "passLead",
    leadId: first.id,
    reason: "Occupied",
  });
  assert.equal(first.ownerId, null);
  assert.equal(first.status, "escalated");
  const b = act(f.s, f.u("trainer1"), {
    action: "createLead",
    title: "Excel",
    client: "B",
    brief: "Another requirement",
    mode: "virtual",
  });
  assert.equal(f.s.leads.find((x) => x.id === b.leadId).ownerId, "coord2");
  assert.throws(
    () =>
      act(f.s, f.u("coord1"), {
        action: "reassign",
        leadId: first.id,
        ownerId: "coord2",
      }),
    /Permission/,
  );
});
test("trainer directory never reveals other trainers rating and commercial details", () => {
  const f = fixture();
  const d = dashboard(f.s, f.u("trainer1")),
    other = d.trainers.find((t) => t.id === "trainer2");
  assert.equal(other.rating, undefined);
  assert.equal(other.profile.fee, undefined);
  assert.equal(other.profile.email, undefined);
});
