const crypto = require("node:crypto");
const {
  matchTrainer,
  rating,
  coordinatorRating,
  tierRecommendation,
} = require("./scoring");
const id = () => crypto.randomUUID(),
  now = () => new Date().toISOString();
function fail(message, status = 400) {
  const e = new Error(message);
  e.status = status;
  throw e;
}
function requireRole(user, roles) {
  if (!user || !roles.includes(user.role)) fail("Permission denied", 403);
}
function canSee(s, u, trainer) {
  return (
    u.role === "admin" ||
    trainer.userId === u.id ||
    (u.role === "coordinator" && trainer.coordinatorId === u.id) ||
    (u.role === "subadmin" &&
      ((!trainer.coordinatorId && trainer.status === "pending") ||
        s.users.find((c) => c.id === trainer.coordinatorId)?.subadminId ===
          u.id))
  );
}
function manages(s, u, l) {
  return (
    u.role === "admin" ||
    (u.role === "subadmin" &&
      (!l.ownerId ||
        s.users.find((x) => x.id === l.ownerId)?.subadminId === u.id ||
        l.ownerId === u.id)) ||
    (u.role === "coordinator" && l.ownerId === u.id)
  );
}
function staff(s, u, l) {
  requireRole(u, ["admin", "subadmin", "coordinator"]);
  if (l && !manages(s, u, l))
    fail("This assignment is outside your responsibility", 403);
}
function audit(s, u, action, target, detail = "") {
  s.audit.push({ id: id(), at: now(), userId: u.id, action, target, detail });
}
function profileValid(p) {
  if (!p || !p.name || !p.city || !Array.isArray(p.topics) || !p.topics.length)
    fail("Name, city and at least one topic are required");
  if (
    p.topics.length > 5 ||
    (p.styles || []).length > 3 ||
    (p.industries || []).length > 3
  )
    fail("Maximum five topics, three styles and three industries");
  for (const k of ["cv", "linkedin", "certificates"])
    if (p[k] && !/^https:\/\//i.test(p[k]))
      fail("Document and LinkedIn links must use HTTPS");
}
function candidates(s, l) {
  return s.trainers
    .filter((t) => t.status === "approved")
    .map((t) => ({
      trainerId: t.id,
      name: t.profile.name,
      profile: {
        name: t.profile.name,
        city: t.profile.city,
        introduction: t.profile.introduction,
        topics: t.profile.topics,
        industries: t.profile.industries,
        experience: t.profile.experience,
      },
      ...matchTrainer(
        t.profile,
        l,
        {
          ...s.settings,
          pooling: l.pooling || s.settings.pooling,
          weights: l.weights || s.settings.weights,
        },
        [
          ...(t.history || []),
          ...s.leads
            .filter(
              (x) => x.selectedTrainerId === t.id && x.status === "confirmed",
            )
            .map((x) => ({ date: x.date, status: x.status, leadId: x.id })),
        ],
      ),
    }))
    .sort((a, b) => b.score - a.score);
}
function visibleLead(s, u, l) {
  if (u.role === "trainer") {
    const keys = [
      "id",
      "title",
      "client",
      "status",
      "mode",
      "location",
      "date",
      "threshold",
      "crucial",
      "topic",
      "audience",
      "industry",
      "style",
      "focus",
      "development",
      "language",
      "fee",
      "expectedOutcome",
      "responseDeadline",
      "selectedTrainerId",
      "detailsConfirmed",
    ];
    const copy = Object.fromEntries(
      keys.filter((k) => k in l).map((k) => [k, l[k]]),
    );
    copy.invitations = l.invitations.filter((i) => i.trainerId === u.id);
    copy.candidates = candidates(s, l).filter((c) => c.trainerId === u.id);
    if (l.selectedTrainerId === u.id) {
      copy.reports = l.reports;
      copy.deadlines = l.deadlines;
      copy.feedbackLinks = l.feedbackLinks;
      copy.reviewerId = l.reviewerId;
    }
    return copy;
  }
  const copy = JSON.parse(JSON.stringify(l));
  copy.reviewerSuggestions = s.users
    .filter((c) => c.role === "coordinator")
    .map((c) => {
      const profile = s.trainers.find((t) => t.userId === c.id)?.profile;
      const workload = s.leads.filter(
        (x) => x.reviewerId === c.id && x.status !== "completed",
      ).length;
      const expertise = profile
        ? matchTrainer(profile, l, { weights: s.settings.weights, pooling: [] })
            .score
        : 0;
      return {
        id: c.id,
        name: c.name,
        expertise,
        workload,
        reason: profile
          ? "Relevant profile match and active review workload"
          : "Expertise needs confirmation; reviewer availability requires checking",
      };
    })
    .sort((a, b) => b.expertise - a.expertise || a.workload - b.workload)
    .slice(0, 3);
  copy.candidates = candidates(s, l);
  return copy;
}
function ready(l) {
  return (
    l.detailsConfirmed &&
    l.initialApprovals.length > 0 &&
    (!l.crucial ||
      (l.initialApprovals.some((a) => a.role === "coordinator") &&
        l.initialApprovals.some((a) => ["admin", "subadmin"].includes(a.role))))
  );
}
function dashboard(s, u) {
  const trainers = s.trainers
    .filter(
      (t) =>
        canSee(s, u, t) ||
        (t.status === "approved" &&
          (u.role !== "trainer" ||
            s.trainers.some(
              (x) => x.userId === u.id && x.status === "approved",
            ))),
    )
    .map((t) =>
      canSee(s, u, t)
        ? {
            ...t,
            tierRecommendation: tierRecommendation(
              t.profile,
              t.history || [],
              t.certificationVerified ? [{ status: "verified" }] : [],
            ),
            rating: rating(
              t.history || [],
              s.trainers
                .filter((x) => x.id !== t.id)
                .flatMap((x) =>
                  (x.history || []).filter((h) =>
                    (t.history || []).some(
                      (own) =>
                        own.topic === h.topic &&
                        own.audienceLevel === h.audienceLevel &&
                        own.mode === h.mode,
                    ),
                  ),
                ),
            ),
            coordinatorSuggestions: s.users
              .filter((c) => c.role === "coordinator")
              .sort(
                (a, b) =>
                  s.trainers.filter((x) => x.coordinatorId === a.id).length /
                    (a.capacity || 25) -
                  s.trainers.filter((x) => x.coordinatorId === b.id).length /
                    (b.capacity || 25),
              )
              .slice(0, 2)
              .map(({ id, name, capacity }) => ({ id, name, capacity })),
          }
        : {
            id: t.id,
            status: t.status,
            profile: {
              name: t.profile.name,
              city: t.profile.city,
              topics: t.profile.topics,
              introduction: t.profile.introduction,
            },
          },
    );
  const leads = s.leads
    .filter(
      (l) =>
        u.role === "admin" ||
        manages(s, u, l) ||
        l.createdBy === u.id ||
        l.invitations.some((i) => i.trainerId === u.id) ||
        l.reviewerId === u.id,
    )
    .map((l) => visibleLead(s, u, l));
  const users = s.users
    .filter(
      (x) =>
        u.role === "admin" ||
        x.id === u.id ||
        (u.role === "subadmin" &&
          (x.subadminId === u.id ||
            trainers.some((t) => t.userId === x.id && canSee(s, u, t)))) ||
        (u.role === "coordinator" &&
          s.trainers.some(
            (t) => t.userId === x.id && t.coordinatorId === u.id,
          )),
    )
    .map(({ googleSub, ...x }) => x);
  return {
    user: u,
    users,
    trainers,
    leads,
    settings:
      u.role === "admin" || u.role === "subadmin"
        ? s.settings
        : { pooling: s.settings.pooling },
    audit: u.role === "admin" ? s.audit.slice(-100) : [],
    contributions: s.leads.flatMap((l) =>
      l.submissions
        .filter(
          (x) =>
            x.userId === u.id ||
            u.role === "admin" ||
            s.trainers.some((t) => t.userId === x.userId && canSee(s, u, t)),
        )
        .map((x) => ({
          leadId: l.id,
          title: l.title,
          userId: x.userId,
          at: x.at,
          verified: !!x.verified,
        })),
    ),
    succession:
      u.role === "admin"
        ? s.users
            .filter((x) => x.role === "coordinator")
            .map((x) => ({
              id: x.id,
              name: x.name,
              ...coordinatorRating(
                s.coordinatorEvents.filter((e) => e.userId === x.id),
              ),
            }))
            .sort((a, b) => (b.score || 0) - (a.score || 0))
        : [],
    coordinatorRating: coordinatorRating(
      s.coordinatorEvents.filter((e) => e.userId === u.id),
    ),
  };
}
function act(s, u, p) {
  const l = p.leadId ? s.leads.find((x) => x.id === p.leadId) : null;
  if (p.leadId && !l) fail("Assignment not found", 404);
  const t = p.trainerId ? s.trainers.find((x) => x.id === p.trainerId) : null;
  switch (p.action) {
    case "createLead": {
      if (
        u.role === "trainer" &&
        !s.trainers.some((t) => t.userId === u.id && t.status === "approved")
      )
        fail("Profile approval required", 403);
      if (!p.title || !p.client || !p.brief)
        fail("Topic, client and brief are required");
      let lead;
      if (p.mergeId) {
        lead = s.leads.find((x) => x.id === p.mergeId);
        if (!lead) fail("Duplicate lead not found");
        lead.submissions.push({
          id: id(),
          userId: u.id,
          title: p.title,
          client: p.client,
          mode: p.mode || "",
          location: p.location || "",
          date: p.date || "",
          brief: p.brief,
          at: now(),
        });
        lead.additionalInfo = (lead.additionalInfo || []).concat(p.brief);
        lead.conflicts = (lead.conflicts || []).concat(
          ["client", "mode", "location", "date"]
            .filter((k) => p[k] && lead[k] && p[k] !== lead[k])
            .map((k) => ({
              field: k,
              existing: lead[k],
              submitted: p[k],
              by: u.id,
            })),
        );
      } else {
        const coords = s.users.filter((x) => x.role === "coordinator");
        let owner = null;
        if (p.mode === "virtual" && coords.length) {
          owner = coords[s.settings.rotation % coords.length].id;
          s.settings.rotation++;
        } else {
          owner = coords.find(
            (c) =>
              c.city &&
              c.city.toLowerCase() === (p.location || "").toLowerCase(),
          )?.id;
        }
        lead = {
          id: id(),
          title: p.title,
          topic: p.title,
          client: p.client,
          brief: p.brief,
          mode: p.mode || "virtual",
          location: p.location || "",
          date: p.date || "",
          createdBy: u.id,
          createdAt: now(),
          ownerId: owner,
          status: owner ? "detailing" : "escalated",
          threshold: 7,
          crucial: false,
          detailsConfirmed: false,
          submissions: [
            {
              id: id(),
              userId: u.id,
              title: p.title,
              client: p.client,
              mode: p.mode || "",
              location: p.location || "",
              date: p.date || "",
              brief: p.brief,
              at: now(),
            },
          ],
          invitations: [],
          shortlist: [],
          approvals: [],
          initialApprovals: [],
          reports: {},
          reviews: [],
          deadlines: {},
        };
        s.leads.push(lead);
      }
      audit(s, u, p.action, lead.id);
      return { leadId: lead.id };
    }
    case "saveProfile": {
      profileValid(p.profile);
      delete p.profile.verifiedTopics;
      let own = s.trainers.find((t) => t.userId === u.id);
      if (own) {
        if (own.status === "approved") own.changeRequest = p.profile;
        else own.profile = p.profile;
      } else {
        s.trainers.push({
          id: u.id,
          userId: u.id,
          status: "pending",
          profile: p.profile,
          history: [],
          tier: "Associate",
        });
      }
      break;
    }
    case "approveProfile":
      requireRole(u, ["admin", "subadmin"]);
      if (!t) fail("Trainer not found");
      if (!canSee(s, u, t)) fail("Trainer outside hierarchy", 403);
      t.status = "approved";
      break;
    case "reviseProfile":
      if (!t || !canSee(s, u, t)) fail("Permission denied", 403);
      requireRole(u, ["admin", "subadmin", "coordinator"]);
      profileValid(p.profile);
      delete p.profile.verifiedTopics;
      t.revision = p.profile;
      break;
    case "approveRevision":
      requireRole(u, ["admin", "subadmin"]);
      if (!t || !canSee(s, u, t) || !t.revision) fail("No accessible revision");
      t.versions = (t.versions || []).concat({ profile: t.profile, at: now() });
      if (t.profile.certificates !== t.revision.certificates)
        t.certificationVerified = false;
      t.revision.verifiedTopics = (t.profile.verifiedTopics || []).filter(
        (topic) => (t.revision.topics || []).includes(topic),
      );
      t.profile = t.revision;
      t.revision = null;
      t.changeRequest = null;
      break;
    case "detailLead":
      staff(s, u, l);
      if (["confirmed", "completed"].includes(l.status))
        fail("Cancel or complete the booking before changing its requirements");
      {
        const allowed = [
          "topic",
          "domain",
          "type",
          "audience",
          "audienceAge",
          "industry",
          "style",
          "focus",
          "development",
          "language",
          "mode",
          "location",
          "date",
          "duration",
          "fee",
          "participantCount",
          "expectedOutcome",
          "responseDeadline",
          "sessionEnd",
          "detailsConfirmed",
          "crucialReason",
        ];
        const d = p.details || {};
        for (const k of allowed) if (k in d) l[k] = d[k];
        if (l.date) {
          if (
            !/^\d{4}-\d{2}-\d{2}$/.test(l.date) ||
            !Number.isFinite(Date.parse(l.date))
          )
            fail("Use a valid single-session date YYYY-MM-DD");
        }
        if ("crucial" in d) {
          if (u.role === "coordinator") l.crucialRequested = !!d.crucial;
          else l.crucial = !!d.crucial;
        }
        l.initialApprovals = [];
        l.approvals = [];
        l.clientToken = null;
        l.status = "detailing";
      }
      break;
    case "initialApprove":
      staff(s, u, l);
      if (["confirmed", "completed"].includes(l.status))
        fail("Assignment already booked");
      {
        const n = Number(p.threshold ?? l.threshold);
        if (!Number.isFinite(n) || n < 0 || n > 10)
          fail("Threshold must be 0–10");
        if (n < 7 && (u.role !== "admin" || !p.reason))
          fail("Only Admin can set below 7 with a reason", 403);
        if (
          !l.detailsConfirmed ||
          !l.audience ||
          !l.mode ||
          !l.responseDeadline
        )
          fail(
            "Confirm details, audience, delivery mode and response deadline first",
          );
        if (l.threshold !== n) {
          l.initialApprovals = [];
          l.approvals = [];
          l.clientToken = null;
        }
        l.threshold = n;
        if (l.initialApprovals.some((a) => a.userId === u.id))
          fail("Already approved");
        l.initialApprovals.push({ userId: u.id, role: u.role, at: now() });
        const ready =
          !l.crucial ||
          (l.initialApprovals.some((a) => a.role === "coordinator") &&
            l.initialApprovals.some((a) =>
              ["admin", "subadmin"].includes(a.role),
            ));
        l.status = ready ? "inviting" : "awaiting_initial_approval";
        if (ready)
          l.submissions.forEach((x) => {
            x.verified = true;
          });
      }
      break;
    case "invite":
      staff(s, u, l);
      if (l.status !== "inviting") fail("Initial assignment approval required");
      if (!t || t.status !== "approved") fail("Approved trainer required");
      if (l.invitations.some((i) => i.trainerId === t.id))
        fail("Trainer already invited");
      l.invitations.push({ trainerId: t.id, response: "pending", at: now() });
      break;
    case "respond": {
      const inv = l.invitations.find((i) => i.trainerId === u.id);
      if (!inv) fail("Not invited", 403);
      if (!["interested", "decline", "clarification"].includes(p.response))
        fail("Invalid response");
      if (p.response === "decline" && !p.reason)
        fail("Decline reason required");
      if (l.responseDeadline && Date.now() > Date.parse(l.responseDeadline))
        fail("Response deadline has passed");
      inv.response = p.response;
      inv.reason = p.reason || "";
      inv.respondedAt = now();
      break;
    }
    case "propose":
      staff(s, u, l);
      if (
        !ready(l) ||
        ["confirmed", "completed", "awaiting_confirmation"].includes(l.status)
      )
        fail("Current initial approval required before proposing");
      {
        const ids = [...new Set(p.candidateIds || [])];
        if (!ids.length || ids.length > 3)
          fail("Select one to three candidates");
        const matches = candidates(s, l);
        for (const tid of ids) {
          if (
            !l.invitations.some(
              (i) => i.trainerId === tid && i.response === "interested",
            )
          )
            fail("Candidates must express interest");
          const m = matches.find((m) => m.trainerId === tid);
          if (!m?.eligible || m.score < l.threshold)
            fail("Candidate does not meet threshold or essential fit");
        }
        if (!p.category || !p.reason)
          fail("Consideration category and recommendation reason required");
        l.shortlist = ids;
        l.proposerId = u.id;
        l.consideration = { category: p.category, reason: p.reason };
        l.clientRecommendation = String(p.clientRecommendation || "").slice(
          0,
          1000,
        );
        l.clientCandidates = ids.map((tid) => {
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
        });
        l.matchSnapshot = {
          weights: l.weights || s.settings.weights,
          pooling: l.pooling || s.settings.pooling,
          candidates: matches.filter((m) => ids.includes(m.trainerId)),
        };
        l.approvals = [];
        l.clientToken = null;
        l.status = "awaiting_shortlist_approval";
      }
      break;
    case "approveShortlist":
      requireRole(u, ["admin", "subadmin"]);
      if (!manages(s, u, l)) fail("Assignment outside your hierarchy", 403);
      if (u.id === l.proposerId)
        fail("Proposer cannot independently approve", 403);
      if (
        !l.shortlist.length ||
        !ready(l) ||
        l.status !== "awaiting_shortlist_approval"
      )
        fail("Current initial approval and proposed shortlist required");
      if (l.approvals.some((a) => a.userId === u.id)) fail("Already approved");
      l.approvals.push({ userId: u.id, at: now() });
      if (l.approvals.length >= (l.crucial ? 2 : 1)) {
        l.status = "client_selection";
        l.clientToken = id();
        l.clientExpires = Date.now() + 7 * 86400000;
      }
      break;
    case "configureMatching": {
      staff(s, u, l);
      if (
        ["confirmed", "completed", "awaiting_confirmation"].includes(l.status)
      )
        fail("Booked assignment matching cannot change");
      if (u.role === "coordinator") fail("Admin/Sub-admin only", 403);
      if (p.weights && u.role !== "admin")
        fail("Only Admin changes weights", 403);
      if (
        p.pooling &&
        u.role !== "admin" &&
        !u.permissions?.includes("poolingAssignment")
      )
        fail("Pooling override permission required", 403);
      if (p.weights) {
        const vals = Object.values(p.weights);
        if (
          vals.length !== 7 ||
          vals.some((v) => typeof v !== "number" || v < 0) ||
          vals.reduce((a, b) => a + b, 0) !== 100
        )
          fail("Weights must total 100");
        l.weights = p.weights;
      }
      if (p.pooling) l.pooling = p.pooling;
      if (p.requirements) l.requirements = p.requirements;
      l.initialApprovals = [];
      l.approvals = [];
      l.clientToken = null;
      l.status = "detailing";
      break;
    }
    case "acceptLead":
      staff(s, u, l);
      if (l.acceptedAt) fail("Lead already accepted");
      s.coordinatorEvents.push({
        userId: u.id,
        action: "accept",
        timely: true,
        at: now(),
        leadId: l.id,
      });
      l.acceptedAt = now();
      break;
    case "closeLead":
      staff(s, u, l);
      if (
        ["confirmed", "completed", "awaiting_confirmation"].includes(l.status)
      )
        fail("Use explicit cancellation for booked assignments");
      if (!p.reason) fail("Closure reason required");
      l.status = "closed";
      l.closedReason = p.reason;
      l.completedAt = now();
      l.clientToken = null;
      break;
    case "cancelBooking":
      staff(s, u, l);
      if (!p.reason) fail("Cancellation reason required");
      l.status = "inviting";
      l.cancellation = { reason: p.reason, by: u.id, at: now() };
      l.selectedTrainerId = null;
      l.approvals = [];
      l.clientToken = null;
      l.shortlist = [];
      break;
    case "passLead":
      staff(s, u, l);
      if (
        ["confirmed", "completed", "awaiting_confirmation"].includes(l.status)
      )
        fail("Booked assignments cannot be passed");
      requireRole(u, ["coordinator"]);
      if (!p.reason) fail("Pass reason required");
      l.ownerId = null;
      l.status = "escalated";
      s.coordinatorEvents.push({
        userId: u.id,
        action: "pass",
        reason: p.reason,
        at: now(),
      });
      break;
    case "reassign":
      requireRole(u, ["admin", "subadmin"]);
      if (
        ["confirmed", "completed", "awaiting_confirmation"].includes(l.status)
      )
        fail("Booked assignments cannot be reassigned");
      if (u.role === "subadmin" && l.ownerId && !manages(s, u, l))
        fail("Assignment outside hierarchy", 403);
      if (
        !s.users.some(
          (x) =>
            x.id === p.ownerId &&
            ["admin", "subadmin", "coordinator"].includes(x.role),
        )
      )
        fail("Invalid owner");
      l.ownerId = p.ownerId;
      if (l.status === "escalated") l.status = "detailing";
      break;
    case "selectCoordinator":
      if (
        u.role !== "admin" &&
        !(u.role === "subadmin" && u.permissions?.includes("selectCoordinator"))
      )
        fail("Admin permission required", 403);
      if (
        !t ||
        !canSee(s, u, t) ||
        !s.users.some(
          (x) => x.id === p.coordinatorId && x.role === "coordinator",
        )
      )
        fail("Invalid coordinator");
      t.coordinatorId = p.coordinatorId;
      break;
    case "assignHierarchy":
      requireRole(u, ["admin"]);
      {
        const c = s.users.find((x) => x.id === p.coordinatorId),
          sub = s.users.find((x) => x.id === p.subadminId);
        if (c?.role !== "coordinator" || sub?.role !== "subadmin")
          fail("Invalid hierarchy");
        c.subadminId = sub.id;
      }
      break;
    case "updateSettings":
      {
        const change = p.settings || {};
        if (u.role !== "admin") {
          requireRole(u, ["subadmin"]);
          if (
            Object.keys(change).some((k) => k !== "pooling") ||
            !u.permissions?.includes("poolingGlobal")
          )
            fail("Admin-only settings", 403);
        }
        if (change.weights) {
          const values = Object.values(change.weights);
          if (
            values.length !== 7 ||
            values.some((v) => typeof v !== "number" || v < 0) ||
            values.reduce((a, b) => a + b, 0) !== 100
          )
            fail("Seven weights must total 100");
        }
        if (change.questions)
          for (const q of Object.values(change.questions))
            if (
              !Array.isArray(q) ||
              q.length !== 5 ||
              q.some((x) => typeof x !== "string" || !x.trim())
            )
              fail("Five questions per form required");
        for (const k of ["weights", "pooling", "questions"])
          if (k in change) s.settings[k] = change[k];
      }
      break;
    case "confirmBooking":
      if (l.selectedTrainerId !== u.id || l.status !== "awaiting_confirmation")
        fail("No booking awaiting your confirmation", 403);
      if (
        s.leads.some(
          (x) =>
            x.id !== l.id &&
            x.selectedTrainerId === u.id &&
            x.status === "confirmed" &&
            x.date &&
            x.date === l.date,
        )
      )
        fail("Booking conflict");
      l.status = "confirmed";
      l.confirmedAt = now();
      l.deadlines = {
        draft: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
        plan: l.date
          ? new Date(Date.parse(l.date) - 5 * 86400000)
              .toISOString()
              .slice(0, 10)
          : "",
        report: l.date
          ? new Date(Date.parse(l.date) + 2 * 86400000)
              .toISOString()
              .slice(0, 10)
          : "",
      };
      l.feedbackLinks = { client: id(), audience: id() };
      l.feedbackQuestions = JSON.parse(JSON.stringify(s.settings.questions));
      break;
    case "submitReport":
      if (l.compactedAt) fail("Archived sessions cannot accept new reports");
      if (
        l.selectedTrainerId !== u.id ||
        !["confirmed", "completed"].includes(l.status)
      )
        fail("Confirmed trainer required", 403);
      if (!["draft", "plan", "report"].includes(p.kind) || !p.content?.trim())
        fail("Report content required");
      l.reports[p.kind] = { content: p.content, at: now() };
      break;
    case "assignReviewer":
      requireRole(u, ["admin", "subadmin"]);
      if (!manages(s, u, l)) fail("Assignment outside hierarchy", 403);
      if (
        !s.users.some((x) => x.id === p.reviewerId && x.role === "coordinator")
      )
        fail("Coordinator reviewer required");
      l.reviewerId = p.reviewerId;
      break;
    case "review":
      {
        if (
          u.id !== l.reviewerId &&
          !(u.role === "admin" || (u.role === "subadmin" && manages(s, u, l)))
        )
          fail("Not an assigned reviewer", 403);
        if (!["plan", "report"].includes(p.kind) || !l.reports[p.kind])
          fail("Submission required");
        if (!["confirmed", "completed"].includes(l.status))
          fail("Confirmed delivery required before review");
        const score = Number(p.score);
        if (
          p.outcomes !== undefined &&
          (!Number.isFinite(Number(p.outcomes)) ||
            Number(p.outcomes) < 0 ||
            Number(p.outcomes) > 10)
        )
          fail("Outcome must be 0–10");
        if (!Number.isFinite(score) || score < 0 || score > 10)
          fail("Score must be 0–10");
        l.reviews = l.reviews.filter(
          (r) => !(r.userId === u.id && r.kind === p.kind),
        );
        l.reviews.push({
          userId: u.id,
          role: u.role,
          kind: p.kind,
          score,
          outcome: Number(p.outcomes) || 0,
          at: now(),
        });
        if (p.kind === "plan") {
          const reviews = l.reviews.filter((r) => r.kind === "plan");
          l.planApproved =
            !l.crucial ||
            (reviews.some((r) => r.role === "coordinator") &&
              reviews.some((r) => ["subadmin", "admin"].includes(r.role)));
        }
        if (p.kind === "report") {
          if (l.date && Date.now() < Date.parse(l.date))
            fail("Completion review opens on the session date");
          const reviews = l.reviews.filter((r) => r.kind === "report");
          if (
            !l.crucial ||
            (reviews.some((r) => r.role === "coordinator") &&
              reviews.some((r) => ["subadmin", "admin"].includes(r.role)))
          ) {
            l.status = "completed";
            l.completedAt = now();
            const event = s.coordinatorEvents.find(
              (e) => e.leadId === l.id && e.action === "accept",
            );
            if (event) event.completed = true;
            syncHistory(s, l);
          }
        }
      }
      break;
    case "extendDeadline":
      staff(s, u, l);
      if (
        !["draft", "plan", "report"].includes(p.kind) ||
        !p.reason ||
        !Number.isFinite(Date.parse(p.date))
      )
        fail("Valid deadline and reason required");
      l.deadlines[p.kind] = p.date;
      l.extensions = (l.extensions || []).concat({
        kind: p.kind,
        date: p.date,
        reason: p.reason,
        by: u.id,
      });
      break;
    case "setRole":
      requireRole(u, ["admin"]);
      {
        const target = s.users.find((x) => x.id === p.userId);
        if (
          !target ||
          !["trainer", "coordinator", "subadmin"].includes(p.role) ||
          target.role === "admin"
        )
          fail("Invalid role change");
        if (
          p.role === "subadmin" &&
          target.role !== "subadmin" &&
          s.users.filter((x) => x.role === "subadmin").length >= 2
        )
          fail("Two Sub-admin positions already filled");
        target.role = p.role;
      }
      break;
    case "verifyExpertise":
      requireRole(u, ["admin", "subadmin"]);
      if (!t || !canSee(s, u, t)) fail("Trainer outside hierarchy", 403);
      if (
        !Array.isArray(p.topics) ||
        p.topics.some((topic) => !t.profile.topics.includes(topic))
      )
        fail("Select declared topics to verify");
      t.profile.verifiedTopics = p.topics;
      break;
    case "verifyCertificate":
      requireRole(u, ["admin", "subadmin"]);
      if (!t || !canSee(s, u, t)) fail("Trainer outside hierarchy", 403);
      if (!t.profile.certificates) fail("Certificate link required");
      t.certificationVerified = true;
      break;
    case "setCapacity":
      requireRole(u, ["admin"]);
      {
        const c = s.users.find((x) => x.id === p.coordinatorId);
        if (
          c?.role !== "coordinator" ||
          !Number.isInteger(p.capacity) ||
          p.capacity < 1
        )
          fail("Valid coordinator capacity required");
        c.capacity = p.capacity;
        c.city = p.city || c.city || "";
      }
      break;
    case "setTier":
      requireRole(u, ["admin"]);
      if (
        !t ||
        !["Associate", "Trainer", "Senior Trainer", "Master Trainer"].includes(
          p.tier,
        )
      )
        fail("Invalid tier");
      t.tier = p.tier;
      break;
    case "grantPermission":
      requireRole(u, ["admin"]);
      {
        const target = s.users.find((x) => x.id === p.userId);
        if (
          target?.role !== "subadmin" ||
          !["poolingGlobal", "poolingAssignment", "selectCoordinator"].includes(
            p.permission,
          )
        )
          fail("Invalid permission");
        target.permissions = [
          ...new Set([...(target.permissions || []), p.permission]),
        ];
      }
      break;
    default:
      fail("Unknown action");
  }
  audit(s, u, p.action, l?.id || t?.id || u.id, p.reason || "");
  return { ok: true };
}
function syncHistory(s, l) {
  const t = s.trainers.find((t) => t.id === l.selectedTrainerId);
  if (!t) return;
  const avg = (arr, key) =>
    arr.length ? arr.reduce((a, r) => a + (r[key] || 0), 0) / arr.length : null;
  const plan = l.reviews.filter((r) => r.kind === "plan"),
    report = l.reviews.filter((r) => r.kind === "report"),
    fb = l.feedback || [];
  const client = fb.filter(
      (f) => f.kind === "client" && Number.isFinite(f.score),
    ),
    audience = fb.filter(
      (f) => f.kind === "audience" && Number.isFinite(f.score),
    );
  const minimumAudience =
    Number(l.participantCount) > 0
      ? Math.min(5, Math.ceil(Number(l.participantCount) / 2))
      : 5;
  const entry = {
    leadId: l.id,
    completed: l.status === "completed",
    topic: l.topic,
    audienceLevel: l.audience,
    mode: l.mode,
    plan: avg(plan, "score"),
    report: avg(report, "score"),
    outcome: avg(report, "outcome"),
    reliability: l.status === "completed" ? 10 : null,
    client: avg(client, "score"),
    audience:
      audience.length >= minimumAudience ? avg(audience, "score") : null,
    audienceResponseCount: audience.length,
    audienceMinimum: minimumAudience,
  };
  t.history = (t.history || []).filter((h) => h.leadId !== l.id).concat(entry);
}
module.exports = {
  act,
  dashboard,
  candidates,
  canSee,
  manages,
  visibleLead,
  fail,
  syncHistory,
};
