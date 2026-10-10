"use strict";
const $ = (s) => document.querySelector(s);
let state = { view: "overview", data: null, user: null, lead: null };
const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const list = (v) => (Array.isArray(v) ? v.join(", ") : v || "");
const pretty = (v) => String(v || "").replace(/[_-]/g, " ");
const pill = (v) =>
  `<span class="pill ${/pending|new|detail|propos|interest/.test(v || "") ? "amber" : /closed|declin|cancel/.test(v || "") ? "gray" : ""}">${esc(pretty(v))}</span>`;
async function api(path, body) {
  const r = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json();
  if (!r.ok) throw Error(d.error || d.message || "Request failed");
  return d;
}
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").style.display = "block";
  setTimeout(() => ($("#toast").style.display = "none"), 5500);
}
function name(id) {
  return (
    state.data?.users?.find((x) => x.id === id)?.name || id || "Unassigned"
  );
}
function trainer(id) {
  return state.data?.trainers?.find((x) => x.id === id);
}
function uId() {
  return state.user?.id;
}
function staff() {
  return ["admin", "subadmin", "coordinator"].includes(state.user?.role);
}
function admin() {
  return state.user?.role === "admin";
}
function field(label, key, value = "", type = "text", wide = false) {
  return `<label class="field ${wide ? "wide" : ""}">${esc(label)}${type === "textarea" ? `<textarea name="${key}">${esc(value)}</textarea>` : `<input name="${key}" type="${type}" value="${esc(value)}">`}</label>`;
}
function select(label, key, options, value = "", wide = false) {
  return `<label class="field ${wide ? "wide" : ""}">${esc(label)}<select name="${key}">${options
    .map((o) => {
      const v = typeof o === "object" ? o.value : o,
        t = typeof o === "object" ? o.label : o;
      return `<option value="${esc(v)}" ${v === value ? "selected" : ""}>${esc(t)}</option>`;
    })
    .join("")}</select></label>`;
}
function formData(form) {
  return Object.fromEntries(new FormData(form));
}
function modal(title, content, onSubmit) {
  const el = document.createElement("div");
  el.className = "modal-shade";
  el.innerHTML = `<div class="modal"><div class="modalhead"><h2>${title}</h2><button class="close" aria-label="Close">×</button></div><form>${content}<div class="divider"></div><div class="actions"><button class="btn" type="submit">Save changes</button><button class="btn secondary" type="button" data-cancel>Cancel</button></div></form></div>`;
  document.body.append(el);
  el.querySelector(".close").onclick = () => el.remove();
  el.querySelector("[data-cancel]").onclick = () => el.remove();
  el.querySelector("form").onsubmit = async (e) => {
    e.preventDefault();
    try {
      await onSubmit(formData(e.target), e.target);
      el.remove();
      await refresh();
      toast("Saved successfully");
    } catch (err) {
      toast(err.message);
    }
  };
}
async function action(action, payload = {}) {
  return api("/api/actions", { action, ...payload });
}
async function refresh() {
  state.data = await api("/api/dashboard");
  state.user = state.data.user;
  if (state.lead) state.lead = await api("/api/leads/" + state.lead.id);
  render();
}
function nav(view) {
  state.view = view;
  state.lead = null;
  render();
}
function render() {
  const d = state.data,
    u = state.user;
  const menus = [
    ["overview", "Overview"],
    ["leads", staff() ? "Lead & assignment desk" : "Opportunities"],
    ["directory", "Trainer directory"],
    ["profile", "My profile"],
    ["reports", "Plans & reports"],
    ["ratings", "Ratings & contribution"],
  ];
  if (staff()) menus.push(["team", "People & coverage"]);
  if (admin())
    menus.push(["settings", "System settings"], ["backup", "Backup & cleanup"]);
  $("#app").innerHTML =
    `<div class="shell"><aside class="sidebar"><div class="brand"><div class="mark">B</div><strong>Trainer Assignment<br>Bridge<small>THE OPPORTUNITY WORKSPACE</small></strong></div><nav class="nav">${menus.map(([v, l]) => `<button data-nav="${v}" class="${state.view === v ? "active" : ""}">${l}</button>`).join("")}</nav><div class="sidebar-foot"><span class="eyebrow">YOUR WORKSPACE</span><strong>${esc(u.name)}</strong>${esc(pretty(u.role))}<p class="tagline">Connecting trainers, opportunities,<br>and facilitation.</p></div></aside><main class="main"><header class="topbar"><div><span class="eyebrow">Trainer Assignment Bridge</span><strong>A better connection. A stronger community.</strong></div><div class="account">${state.session?.demo ? `<div class="demo"><small>Demo workspace · switch role</small><select id="demo-user">${(d.demoUsers || state.demoUsers || []).map((x) => `<option value="${x.id}" ${x.id === u.id ? "selected" : ""}>${esc(x.name)} · ${esc(x.role)}</option>`).join("")}</select></div>` : ""}<button class="btn small secondary" id="signout">Sign out</button><div class="avatar">${esc(u.name?.slice(0, 1))}</div><div class="identity"><strong>${esc(u.name)}</strong><small>${esc(pretty(u.role))}</small></div></div></header><div class="content">${state.lead ? leadView() : views[state.view]()}</div></main></div>`;
  bind();
}
function heading(title, sub, button = "") {
  return `<div class="pagehead"><div><h1>${title}</h1><p class="sub">${sub}</p></div>${button}</div>`;
}
function leadRow(l) {
  return `<div class="row"><div class="avatar">↗</div><div class="row-body"><strong>${esc(l.title)}</strong><small>${esc(l.client)} · ${esc(l.location || l.mode || "Location pending")} · ${esc(l.date || "Date pending")}</small></div>${pill(l.status)}<button class="btn small secondary" data-lead="${l.id}">View</button></div>`;
}
const views = {
  overview() {
    const d = state.data,
      ls = d.leads || [],
      ts = d.trainers || [],
      mine = ts.find((t) => t.userId === state.user.id);
    return (
      heading(
        `Welcome back, ${esc(state.user.name.split(" ")[0])}.`,
        "Your community, connected to the right opportunities.",
        `<button class="btn" data-create>＋ Share a lead</button>`,
      ) +
      `<div class="hero"><div><span class="eyebrow" style="color:#a5ded0">PURPOSE MEETS POSSIBILITY</span><h2>Great training starts with the right connection.</h2><p>Capture opportunities, discover expertise, and bring exceptional learning experiences to life.</p></div><button class="btn" data-nav="directory">Explore trainer bank ↗</button></div><div class="stats"><div class="stat"><small>Trainer community</small><strong>${ts.length}</strong><span>${ts.filter((x) => x.status === "approved").length} approved profiles</span></div><div class="stat"><small>Active opportunities</small><strong>${ls.filter((x) => !["closed", "completed"].includes(x.status)).length}</strong><span>Across your visible workspace</span></div><div class="stat"><small>Awaiting response</small><strong>${ls.reduce((n, l) => n + (l.invitations || []).filter((i) => !i.response || i.response === "pending").length, 0)}</strong><span>Invitations in progress</span></div><div class="stat"><small>${mine ? "My performance" : "Crucial assignments"}</small><strong>${mine ? esc(mine.rating?.grade || "New") : ls.filter((l) => l.crucial).length}</strong><span>${mine ? "Verified delivery builds credibility" : "Two independent approvals required"}</span></div></div><div class="grid"><section class="card"><div class="cardhead"><h2>Opportunity pipeline</h2><button class="btn small secondary" data-nav="leads">View all</button></div>${ls.slice(0, 5).map(leadRow).join("") || '<div class="empty">No leads yet. Share the first opportunity.</div>'}</section><section class="card"><h2>Pending actions & activity</h2>${ls
        .filter((l) => l.selectedTrainerId === uId() || l.reviewerId === uId())
        .flatMap((l) =>
          Object.entries(l.deadlines || {})
            .filter(([k, v]) => v && !l.reports?.[k])
            .map(
              ([k, v]) =>
                `<div class="notice ${new Date(v) < new Date() ? "warn" : ""}">${esc(pretty(k))}: ${esc(l.title)} · due ${esc(v)}</div>`,
            ),
        )
        .join("")}${
        (d.audit || [])
          .slice(-6)
          .reverse()
          .map(
            (a) =>
              `<div class="row"><div class="row-body"><strong>${esc(pretty(a.action || a.type))}</strong><small>${esc(name(a.userId || a.actorId))} · ${esc(new Date(a.at || a.createdAt || Date.now()).toLocaleDateString())}</small></div></div>`,
          )
          .join("") ||
        '<p class="muted">Activity appears here as your team works.</p>'
      }<div class="notice" style="margin-top:18px">${state.session?.demo ? "Demo access is enabled. Role switching is for evaluation; production uses configured authentication." : "Your role determines the records and actions available to you."}</div></section></div>`
    );
  },
  leads() {
    return (
      heading(
        "Lead & assignment desk",
        "A quick entry today. A meaningful opportunity tomorrow.",
        `<button class="btn" data-create>＋ Share a lead</button>`,
      ) +
      `<section class="card">${(state.data.leads || []).map(leadRow).join("") || '<div class="empty">No opportunities in your scope.</div>'}</section>`
    );
  },
  directory() {
    return (
      heading(
        "The trainer bank",
        "Discover the expertise within your community.",
      ) +
      `<div class="profile-grid">${state.data.trainers.map((t) => `<article class="card profile-card"><div class="avatar">${esc(t.profile?.name?.slice(0, 1) || "T")}</div><h3>${esc(t.profile?.name || name(t.userId))}</h3>${pill(t.status)}<p>${esc(t.profile?.city)} · ${esc(list(t.profile?.topics))}</p><p>${esc(t.profile?.introduction || "Introduction not yet added.")}</p>${staff() ? `<button class="btn small secondary" data-trainer="${t.id}">Review profile</button>` : ""}</article>`).join("")}</div>`
    );
  },
  profile() {
    const t = state.data.trainers.find((x) => x.userId === state.user.id);
    return (
      heading(
        "My profile",
        "Your expertise, clearly represented.",
        `<button class="btn" data-edit-profile="${t?.id || ""}">${t ? "Request profile changes" : "Complete profile"}</button>`,
      ) +
      (t
        ? profileCard(t)
        : '<div class="card empty">Create your trainer profile to join the bank.</div>')
    );
  },
  reports() {
    return (
      heading(
        "Plans & reports",
        "Prepare thoughtfully. Reflect meaningfully.",
      ) +
      `<section class="card">${
        state.data.leads
          .filter(
            (l) =>
              l.status === "confirmed" ||
              l.reports ||
              l.reviewerId === state.user.id,
          )
          .map(
            (l) =>
              `<div class="row"><div class="row-body"><strong>${esc(l.title)}</strong><small>Draft: ${esc(l.deadlines?.draft || "Not set")} · Plan: ${esc(l.deadlines?.plan || "Not set")} · Report: ${esc(l.deadlines?.report || "Not set")}</small></div><button class="btn small secondary" data-lead="${l.id}">Open workspace</button></div>`,
          )
          .join("") ||
        '<div class="empty">Assigned plans and reports appear here.</div>'
      }</section>`
    );
  },
  ratings() {
    return (
      heading(
        "Ratings & contribution",
        "A transparent record of delivery and community input.",
      ) +
      `<section class="card"><div class="tablewrap"><table><thead><tr><th>Trainer</th><th>Quality tier</th><th>Performance</th><th>Score</th></tr></thead><tbody>${state.data.trainers
        .filter((t) => t.rating)
        .map(
          (t) =>
            `<tr><td>${esc(t.profile?.name)}</td><td>${esc(t.tier || "Associate")}</td><td>${pill(t.rating?.grade || "New / Unrated")}</td><td>${t.rating?.score != null ? esc(t.rating.score) + "/10" : "Awaiting eligible history"}</td></tr>`,
        )
        .join(
          "",
        )}</tbody></table></div></section><div class="notice" style="margin-top:20px">Performance: plan 20%, client 15%, audience 15%, reliability 10%, outcomes 15%, report 15%, comparative 10%. Ratings shown are restricted to your authorised scope.</div><section class="card" style="margin-top:20px"><h2>Community contributions</h2>${(state.data.contributions || []).map((c) => `<div class="row"><div class="row-body"><strong>${esc(c.title)}</strong><small>${esc(name(c.userId))} · ${esc(c.at?.slice(0, 10))}</small></div>${pill(c.verified ? "Verified contribution" : "Pending verification")}</div>`).join("") || '<p class="muted">Contributions appear when you share an opportunity.</p>'}</section>${state.user.role === "coordinator" ? `<section class="card" style="margin-top:20px"><h2>My coordinator preference</h2><p>${esc(state.data.coordinatorRating?.score ?? "Awaiting activity")}/10</p><pre class="muted">${esc(JSON.stringify(state.data.coordinatorRating?.factors || [], null, 2))}</pre></section>` : ""}${admin() ? `<section class="card" style="margin-top:20px"><h2>Potential Sub-admin candidates</h2>${(state.data.succession || []).map((c) => `<div class="row"><strong>${esc(c.name)}</strong><span>${esc(c.score ?? "Insufficient history")}${c.provisional ? " · Provisional" : ""}</span></div>`).join("")}</section>` : ""}`
    );
  },
  team() {
    const users = state.data.users || [];
    return (
      heading(
        "People & coverage",
        "Clear ownership. Balanced capacity. Accountable coordination.",
      ) +
      `<section class="card"><div class="tablewrap"><table><thead><tr><th>Person</th><th>Role</th><th>Capacity</th><th>Reports to</th><th>Actions</th></tr></thead><tbody>${users.map((u) => `<tr><td>${esc(u.name)}<small>${esc(u.email)}</small></td><td>${pill(u.role)}</td><td>${esc(u.capacity ?? "—")}</td><td>${esc(name(u.subadminId || u.coordinatorId))}</td><td>${admin() ? `<button class="btn small secondary" data-manage-user="${u.id}">Manage</button>` : ""}</td></tr>`).join("")}</tbody></table></div></section><section class="card" style="margin-top:22px"><h2>Trainer assignments & registration</h2>${state.data.trainers.map((t) => `<div class="row"><div class="row-body"><strong>${esc(t.profile?.name)}</strong><small>Primary coordinator: ${esc(name(t.coordinatorId))}</small></div>${pill(t.status)}<button class="btn small secondary" data-trainer="${t.id}">Review</button></div>`).join("")}</section>`
    );
  },
  settings() {
    return (
      heading(
        "System settings",
        "Admin-controlled rules, with changes recorded.",
      ) +
      `<div class="card"><form id="settings-form"><h2>Initial pooling categories</h2><div class="formgrid">${["topic", "type", "audience", "mode", "geography", "language", "industry", "style"].map((k) => `<label class="checkbox"><input type="checkbox" name="pooling" value="${k}" ${(state.data.settings.pooling || ["topic", "type", "audience", "mode", "geography"]).includes(k) ? "checked" : ""}>${esc(pretty(k))}</label>`).join("")}</div><div class="divider"></div><h2>Suitability weights (%)</h2><div class="formgrid">${Object.entries(
        state.data.settings.weights || {
          topic: 35,
          audience: 10,
          industry: 15,
          style: 10,
          experience: 10,
          focus: 10,
          development: 10,
        },
      )
        .map(([k, v]) => field(pretty(k), `weight_${k}`, v, "number"))
        .join(
          "",
        )}</div><div class="divider"></div><h2>Feedback forms</h2><p class="muted">One question per line; changes apply to future sessions.</p><div class="formgrid">${field("Audience questions", "audienceQuestions", (state.data.settings.questions?.audience || []).join("\n"), "textarea", true)}${field("Client questions", "clientQuestions", (state.data.settings.questions?.client || []).join("\n"), "textarea", true)}</div><div class="divider"></div><button class="btn">Save settings</button></form></div>`
    );
  },
  backup() {
    return (
      heading(
        "Backup & cleanup",
        "Retain your community. Clear unnecessary detail safely.",
      ) +
      `<div class="detailgrid"><section class="card"><h2>Download backup</h2><p class="muted">Export data before cleanup. External document links are included; linked files remain with their provider.</p><button class="btn" id="backup-download">Download JSON backup</button><p id="backup-status" class="muted"></p><div class="divider"></div><h3>Restore a backup</h3><input id="restore-file" type="file" accept="application/json"><button class="btn secondary" id="restore-backup" style="margin-top:12px">Restore selected backup</button></section><section class="card"><h2>Preview cleanup</h2><p class="muted">Only eligible old completed or closed records are cleaned. Profiles, rating summaries, contribution totals and essential history remain.</p><form id="cleanup-preview">${field("Records before", "before", "", "date")}<button class="btn secondary" style="margin-top:15px">Preview eligible records</button></form><div id="cleanup-result"></div></section></div>`
    );
  },
};
function profileCard(t) {
  const p = t.profile || {};
  return `<section class="card"><div class="cardhead"><h2>${esc(p.name || name(t.userId))}</h2>${pill(t.status)}</div>${t.revision || t.changeRequest ? '<div class="notice warn">A revised profile is awaiting approval. Your current approved profile remains active.</div>' : ""}<div class="formgrid">${Object.entries(
    p,
  )
    .map(
      ([k, v]) =>
        `<div><span class="eyebrow">${esc(pretty(k))}</span><p style="margin:7px 0;font-size:13px">${esc(list(v)) || "—"}</p></div>`,
    )
    .join(
      "",
    )}</div><div class="divider"></div><div class="actions">${t.profile?.certificates && ["admin", "subadmin"].includes(state.user.role) ? `<button class="btn secondary" data-act="verifyCertificate" data-trainer-id="${t.id}">${t.certificationVerified ? "Certificate verified" : "Verify certificate"}</button>` : ""}${t.status === "pending" && staff() ? `<button class="btn" data-act="approveProfile" data-trainer-id="${t.id}">Approve registration</button>` : ""}${t.revision && ["admin", "subadmin"].includes(state.user.role) ? `<button class="btn" data-act="approveRevision" data-trainer-id="${t.id}">Approve revision</button>` : ""}${staff() ? `<button class="btn secondary" data-edit-profile="${t.id}">Prepare revision</button>` : ""}${admin() ? `<button class="btn secondary" data-coordinator="${t.id}">Assign primary coordinator</button><button class="btn secondary" data-tier="${t.id}">Set quality tier</button>` : ""}</div></section>`;
}
function leadView() {
  const l = state.lead,
    ts = state.data.trainers;
  return (
    heading(
      esc(l.title),
      `${esc(l.client)} · ${esc(l.mode || "Mode pending")} · ${esc(l.location || "Location pending")}`,
      `<button class="btn secondary" data-nav="leads">← All opportunities</button>`,
    ) +
    `<div class="notice">${pill(l.status)} &nbsp; ${l.crucial ? "Crucial · two independent approvals" : "Standard · one independent approval"} · Threshold ${esc(l.threshold || 7)}/10 · Owner: ${esc(name(l.ownerId))}</div><div class="detailgrid"><section class="card"><h2>Original opportunity</h2><p style="white-space:pre-wrap;font-size:14px">${esc(l.brief)}</p><p class="muted">${(l.submissions || []).length} submissions · ${new Set((l.submissions || []).map((x) => x.userId)).size} contributors</p>${staff() ? `<div class="actions">${["admin", "subadmin"].includes(state.user.role) ? '<button class="btn small secondary" data-matching>Matching controls</button>' : ""}<button class="btn small" data-detail>Complete details</button><button class="btn small secondary" data-close-lead>Close lead</button>${l.status === "confirmed" ? '<button class="btn small secondary" data-cancel-booking>Cancel booking</button>' : ""}<button class="btn small secondary" data-initial>Approve readiness</button>${state.user.role === "coordinator" ? '<button class="btn small secondary" data-accept>Accept lead</button><button class="btn small secondary" data-pass>Pass to Admin/Sub-admin</button>' : '<button class="btn small secondary" data-reassign>Assign owner</button>'}</div>` : ""}<div class="divider"></div><h3>Confirmed details</h3><p class="muted" style="white-space:pre-wrap">${esc(JSON.stringify({ topic: l.topic, audience: l.audience, industry: l.industry, language: l.language, date: l.date, fee: l.fee, expectedOutcome: l.expectedOutcome }, null, 2))}</p><p class="muted">Initial approvals: ${(l.initialApprovals || []).length}</p></section><section class="card"><h2>Selection & client handoff</h2><p class="muted">Shortlist: ${
      (l.shortlist || [])
        .map(
          (id) =>
            trainer(typeof id === "object" ? id.trainerId : id)?.profile
              ?.name || id,
        )
        .map(esc)
        .join(", ") || "Not proposed yet"
    }</p><p class="muted">Independent approvals: ${(l.approvals || []).length}</p>${staff() ? `<div class="actions"><button class="btn small" data-propose>Propose candidates</button><button class="btn small secondary" data-act="approveShortlist" data-lead-id="${l.id}">Approve shortlist</button></div>` : ""}${l.clientToken ? `<div class="divider"></div><a class="btn small" href="/client/${esc(l.clientToken)}" target="_blank" rel="noopener">Open client shortlist ↗</a><button class="btn small secondary" data-print>Print / save as PDF</button>` : ""}${l.selectedTrainerId ? `<p class="muted">Client selected: ${esc(trainer(l.selectedTrainerId)?.profile?.name)}</p><button class="btn small" data-act="confirmBooking" data-lead-id="${l.id}">Confirm booking</button>` : ""}</section><section class="card wide"><div class="cardhead"><h2>Suggested trainer pool</h2><span class="muted">Suitability is separate from performance</span></div><div class="tablewrap"><table><thead><tr><th>Trainer</th><th>Topics & industry</th><th>Suitability</th><th>Response</th><th>Action</th></tr></thead><tbody>${
      (l.candidates || [])
        .map((c) => {
          const t = trainer(c.trainerId),
            p = c.profile || t?.profile || {},
            inv = (l.invitations || []).find(
              (i) => i.trainerId === c.trainerId,
            );
          return `<tr><td>${esc(c.name || p.name)}<small>${esc(p.city)}</small></td><td>${esc(list(p.topics))}<small>${esc(list(p.industries))}</small></td><td><span class="score">${esc(c.score ?? c.suitability ?? "—")}<small style="display:inline">/10</small></span><small>${c.provisional ? "Provisional · " : ""}${esc(list(c.flags || c.missing))}</small><details><summary class="muted">Score breakdown</summary><pre class="muted">${esc(JSON.stringify(c.breakdown || c.factors || {}, null, 2))}</pre></details></td><td>${pill(inv?.response || "Not invited")}</td><td>${staff() ? `<button class="btn small secondary" data-invite="${c.trainerId}">Invite</button>` : t?.userId === state.user.id && inv ? '<button class="btn small" data-respond>Respond</button>' : ""}</td></tr>`;
        })
        .join("") ||
      '<tr><td colspan="5">Complete the brief to see eligible suggestions.</td></tr>'
    }</tbody></table></div></section><section class="card wide"><h2>Delivery workspace</h2><div class="actions">${["draft", "plan", "report"].map((k) => `<button class="btn small secondary" data-report="${k}">${pretty(k)} ${l.reports?.[k] ? "· submitted" : ""}</button>`).join("")}${staff() ? '<button class="btn small secondary" data-reviewer>Choose expert reviewer</button><button class="btn small secondary" data-review>Evaluate submission</button><button class="btn small secondary" data-extend>Extend deadline</button>' : ""}</div><p class="muted">Reviewer: ${esc(name(l.reviewerId))} · Draft ${esc(l.deadlines?.draft || "—")} · Plan ${esc(l.deadlines?.plan || "—")} · Report ${esc(l.deadlines?.report || "—")}</p>${Object.entries(
      l.reports || {},
    )
      .map(
        ([k, v]) =>
          `<details><summary>${esc(pretty(k))}</summary><p style="white-space:pre-wrap">${esc(typeof v === "object" ? v.content : v)}</p></details>`,
      )
      .join("")}${
      l.feedbackLinks
        ? `<div class="divider"></div><h3>Share your session feedback</h3><div class="actions">${Object.entries(
            l.feedbackLinks,
          )
            .map(
              ([k, v]) =>
                `<a class="btn small secondary" href="${esc(v.startsWith("/") ? v : "/feedback/" + v)}" target="_blank" rel="noopener">${esc(pretty(k))} feedback ↗</a>`,
            )
            .join("")}</div>`
        : ""
    }</section></div>`
  );
}
function bind() {
  $("#signout")?.addEventListener("click", async () => {
    try {
      await api("/api/logout", {});
      location.reload();
    } catch (e) {
      toast(e.message);
    }
  });
  document
    .querySelectorAll("[data-nav]")
    .forEach((b) => (b.onclick = () => nav(b.dataset.nav)));
  $("#demo-user")?.addEventListener("change", async (e) => {
    try {
      await api("/api/demo-login", { userId: e.target.value });
      state.lead = null;
      await refresh();
    } catch (err) {
      toast(err.message);
    }
  });
  document.querySelectorAll("[data-lead]").forEach(
    (b) =>
      (b.onclick = async () => {
        try {
          state.lead = await api("/api/leads/" + b.dataset.lead);
          render();
        } catch (e) {
          toast(e.message);
        }
      }),
  );
  document
    .querySelectorAll("[data-create]")
    .forEach((b) => (b.onclick = createLead));
  document.querySelectorAll("[data-trainer]").forEach(
    (b) =>
      (b.onclick = () => {
        state.view = "profile";
        $("#app .content").innerHTML =
          heading(
            "Trainer review",
            "Approved information stays active until revisions are approved.",
          ) + profileCard(trainer(b.dataset.trainer));
        bind();
      }),
  );
  document
    .querySelectorAll("[data-edit-profile]")
    .forEach((b) => (b.onclick = () => editProfile(b.dataset.editProfile)));
  document.querySelectorAll("[data-act]").forEach(
    (b) =>
      (b.onclick = async () => {
        try {
          await action(b.dataset.act, {
            leadId: b.dataset.leadId,
            trainerId: b.dataset.trainerId,
          });
          await refresh();
          toast("Action completed");
        } catch (e) {
          toast(e.message);
        }
      }),
  );
  const l = state.lead;
  document.querySelectorAll("[data-invite]").forEach(
    (b) =>
      (b.onclick = async () => {
        try {
          await action("invite", { leadId: l.id, trainerId: b.dataset.invite });
          await refresh();
          toast("Invitation sent");
        } catch (e) {
          toast(e.message);
        }
      }),
  );
  $("[data-detail]")?.addEventListener("click", () =>
    modal(
      "Assignment detailing",
      `<div class="formgrid">${field("Topic", "topic", l.topic || l.title)}${select("Training type", "type", ["Technical", "Behavioural", "Compliance", "Leadership", "Digital"], l.type)}${select("Audience level", "audience", ["Frontline", "Supervisors", "Middle managers", "Senior leaders"], l.audience)}${field("Audience age group", "audienceAge", l.audienceAge)}${field("Industry", "industry", l.industry)}${field("Preferred training style", "style", l.style)}${field("Language", "language", l.language)}${select("Delivery mode", "mode", ["classroom", "virtual", "blended", "on-the-job"], l.mode)}${field("Location", "location", l.location)}${field("Date", "date", l.date, "date")}${field("Fee / budget status", "fee", l.fee)}${select("Primary focus", "focus", ["People", "Process", "Product"], l.focus)}${select("Development area", "development", ["Knowledge", "Attitude", "Skill", "Habit"], l.development)}${select(
        "Classification",
        "crucial",
        [
          { value: "false", label: "Standard" },
          { value: "true", label: "Crucial" },
        ],
        String(l.crucial),
      )}${field("Crucial reason", "crucialReason", l.crucialReason)}${field("Expected outcomes", "expectedOutcome", l.expectedOutcome, "textarea", true)}${field("Response deadline", "responseDeadline", l.responseDeadline, "datetime-local")}</div>`,
      (d) =>
        action("detailLead", {
          leadId: l.id,
          details: {
            ...d,
            detailsConfirmed: true,
            crucial: d.crucial === "true",
          },
        }),
    ),
  );
  $(" [data-matching]")?.addEventListener("click", () =>
    modal(
      "Assignment matching controls",
      `<p class="muted">Only Admin changes weights. Pooling override requires Admin or delegated permission.</p><div class="formgrid">${["topic", "type", "audience", "mode", "geography", "language", "industry", "style"].map((k) => `<label class="checkbox"><input type="checkbox" name="pooling" value="${k}" ${(l.pooling || state.data.settings.pooling || []).includes(k) ? "checked" : ""}>${pretty(k)}</label>`).join("")}</div><div class="divider"></div>${["language", "mode", "topic"].map((k) => select(pretty(k) + " requirement", "req_" + k, ["not_required", "preferred", "mandatory"], l.requirements?.[k] || "not_required")).join("")}${
        admin()
          ? `<div class="divider"></div><div class="formgrid">${Object.entries(
              l.weights || state.data.settings.weights,
            )
              .map(([k, v]) =>
                field(pretty(k) + " %", "weight_" + k, v, "number"),
              )
              .join("")}</div>`
          : ""
      }`,
      async (d, f) => {
        const payload = {
          leadId: l.id,
          requirements: {
            language: d.req_language,
            mode: d.req_mode,
            topic: d.req_topic,
          },
        };
        if (admin() || state.user.permissions?.includes("poolingAssignment"))
          payload.pooling = new FormData(f).getAll("pooling");
        if (admin()) {
          payload.weights = {};
          Object.entries(d)
            .filter(([k]) => k.startsWith("weight_"))
            .forEach(([k, v]) => (payload.weights[k.slice(7)] = Number(v)));
        }
        await action("configureMatching", payload);
      },
    ),
  );
  $("[data-initial]")?.addEventListener("click", () =>
    modal(
      "Approve assignment readiness",
      `<div class="notice">Standard requires one reviewer; Crucial requires a coordinator and a Sub-admin/Admin. Only Admin can authorise a threshold below 7.</div>${field("Suitability threshold /10", "threshold", l.threshold || 7, "number")}${field("Reason for exception, if applicable", "reason", "", "textarea")}`,
      (d) =>
        action("initialApprove", {
          leadId: l.id,
          threshold: Number(d.threshold),
          reason: d.reason,
        }),
    ),
  );
  $(" [data-accept]")?.addEventListener("click", async () => {
    try {
      await action("acceptLead", { leadId: l.id });
      await refresh();
      toast("Lead accepted");
    } catch (e) {
      toast(e.message);
    }
  });
  $(" [data-close-lead]")?.addEventListener("click", () =>
    modal("Close lead", field("Reason", "reason", "", "textarea"), (d) =>
      action("closeLead", { leadId: l.id, reason: d.reason }),
    ),
  );
  $(" [data-cancel-booking]")?.addEventListener("click", () =>
    modal("Cancel booking", field("Reason", "reason", "", "textarea"), (d) =>
      action("cancelBooking", { leadId: l.id, reason: d.reason }),
    ),
  );
  $("[data-pass]")?.addEventListener("click", () =>
    modal(
      "Pass to leadership",
      field("Pass reason", "reason", "", "textarea"),
      (d) => action("passLead", { leadId: l.id, reason: d.reason }),
    ),
  );
  $("[data-reassign]")?.addEventListener("click", () =>
    modal(
      "Assign lead owner",
      select(
        "Owner",
        "ownerId",
        state.data.users
          .filter((u) => ["admin", "subadmin", "coordinator"].includes(u.role))
          .map((u) => ({ value: u.id, label: u.name })),
        l.ownerId,
      ),
      (d) => action("reassign", { leadId: l.id, ...d }),
    ),
  );
  $("[data-respond]")?.addEventListener("click", () =>
    modal(
      "Respond to invitation",
      select("Your response", "response", [
        "interested",
        "decline",
        "clarification",
      ]) + field("Reason or question", "reason", "", "textarea"),
      (d) => action("respond", { leadId: l.id, ...d }),
    ),
  );
  $("[data-propose]")?.addEventListener("click", () =>
    modal(
      "Propose client shortlist",
      `<p class="muted">Choose up to three interested trainers. Discretionary selections require a category and reason.</p><div class="list">${state.data.trainers.map((t) => `<label class="checkbox"><input type="checkbox" name="candidateIds" value="${t.id}" ${(l.shortlist || []).includes(t.id) ? "checked" : ""}>${esc(t.profile.name)}</label>`).join("")}</div><div class="divider"></div>${select("Consideration category", "category", ["Standard match", "Long time without assignment", "Needs opportunity / financial support", "New trainer", "Expertise not reflected in profile", "Client preference", "Availability / location", "Fair distribution", "Other"])}${field("Internal consideration reason", "reason", "", "textarea") + field("Client-facing recommendation (optional)", "clientRecommendation", "", "textarea")}`,
      (d, f) =>
        action("propose", {
          leadId: l.id,
          candidateIds: new FormData(f).getAll("candidateIds"),
          category: d.category,
          reason: d.reason,
          clientRecommendation: d.clientRecommendation,
        }),
    ),
  );
  $("[data-print]")?.addEventListener("click", () =>
    window.open("/client/" + l.clientToken + "?print=1", "_blank"),
  );
  document
    .querySelectorAll("[data-report]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          modal(
            "Submit " + pretty(b.dataset.report),
            field(
              "Plan / report content",
              "content",
              l.reports?.[b.dataset.report]?.content || "",
              "textarea",
            ),
            (d) =>
              action("submitReport", {
                leadId: l.id,
                kind: b.dataset.report,
                content: d.content,
              }),
          )),
    );
  $("[data-reviewer]")?.addEventListener("click", () =>
    modal(
      "Select expert reviewer",
      `<p class="muted">Select an available coordinator with relevant expertise.</p>${(l.reviewerSuggestions || []).map((r) => `<div class="notice">${esc(r.name || name(r.userId || r.id))} · ${esc(list(r.reasons || r.reason))}</div>`).join("")}${select(
        "Reviewer",
        "reviewerId",
        state.data.users
          .filter((u) => u.role === "coordinator")
          .map((u) => ({ value: u.id, label: u.name })),
        l.reviewerId,
      )}`,
      (d) => action("assignReviewer", { leadId: l.id, ...d }),
    ),
  );
  $("[data-review]")?.addEventListener("click", () =>
    modal(
      "Evaluate submission",
      select("Submission", "kind", ["plan", "report"]) +
        field("Quality score /10", "score", 8, "number") +
        field("Verified outcome score /10", "outcomes", 8, "number"),
      (d) =>
        action("review", {
          leadId: l.id,
          kind: d.kind,
          score: Number(d.score),
          outcomes: Number(d.outcomes),
        }),
    ),
  );
  $("[data-extend]")?.addEventListener("click", () =>
    modal(
      "Extend deadline",
      select("Deadline", "kind", ["draft", "plan", "report"]) +
        field("New deadline", "date", "", "date") +
        field("Reason", "reason", "", "textarea"),
      (d) => action("extendDeadline", { leadId: l.id, ...d }),
    ),
  );
  document.querySelectorAll("[data-coordinator]").forEach(
    (b) =>
      (b.onclick = () => {
        const t = trainer(b.dataset.coordinator);
        modal(
          "Select primary coordinator",
          `<p class="muted">Site suggestions: ${(t.coordinatorSuggestions || []).map((c) => esc(c.name || name(c.id || c.userId))).join(", ") || "Review location and capacity below"}</p>` +
            select(
              "Coordinator",
              "coordinatorId",
              state.data.users
                .filter((u) => u.role === "coordinator")
                .map((u) => ({ value: u.id, label: u.name })),
              t.coordinatorId,
            ),
          (d) => action("selectCoordinator", { trainerId: t.id, ...d }),
        );
      }),
  );
  document
    .querySelectorAll("[data-tier]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          modal(
            "Approve quality tier",
            `<p class="muted">Site recommendation: ${esc(trainer(b.dataset.tier).tierRecommendation?.tier || trainer(b.dataset.tier).tierRecommendation || "Pending evidence review")}</p>` +
              select(
                "Tier",
                "tier",
                ["Associate", "Trainer", "Senior Trainer", "Master Trainer"],
                trainer(b.dataset.tier).tier,
              ),
            (d) => action("setTier", { trainerId: b.dataset.tier, ...d }),
          )),
    );
  document.querySelectorAll("[data-manage-user]").forEach(
    (b) =>
      (b.onclick = () => {
        const u = state.data.users.find((x) => x.id === b.dataset.manageUser);
        modal(
          "Manage " + esc(u.name),
          select(
            "Role",
            "role",
            ["trainer", "coordinator", "subadmin", "admin"],
            u.role,
          ) +
            select(
              "Reporting Sub-admin",
              "subadminId",
              [
                { value: "", label: "Unassigned" },
                ...state.data.users
                  .filter((x) => x.role === "subadmin")
                  .map((x) => ({ value: x.id, label: x.name })),
              ],
              u.subadminId,
            ) +
            field(
              "Coordinator capacity",
              "capacity",
              u.capacity || 25,
              "number",
            ) +
            field("Coordinator city", "city", u.city || "") +
            select("Grant additional permission", "permission", [
              { value: "", label: "No additional permission" },
              "poolingGlobal",
              "poolingAssignment",
            ]),
          async (d) => {
            await action("setRole", { userId: u.id, role: d.role });
            if (d.role === "coordinator")
              await action("setCapacity", {
                coordinatorId: u.id,
                capacity: Number(d.capacity),
                city: d.city,
              });
            if (d.subadminId)
              await action("assignHierarchy", {
                coordinatorId: u.id,
                subadminId: d.subadminId,
              });
            if (d.permission)
              await action("grantPermission", {
                userId: u.id,
                permission: d.permission,
              });
          },
        );
      }),
  );
  $("#settings-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const d = formData(e.target),
      weights = {};
    Object.entries(d)
      .filter(([k]) => k.startsWith("weight_"))
      .forEach(([k, v]) => (weights[k.slice(7)] = Number(v)));
    try {
      await action("updateSettings", {
        settings: {
          pooling: new FormData(e.target).getAll("pooling"),
          weights,
          questions: {
            audience: d.audienceQuestions.split("\n").filter(Boolean),
            client: d.clientQuestions.split("\n").filter(Boolean),
          },
        },
      });
      await refresh();
      toast("Settings updated");
    } catch (err) {
      toast(err.message);
    }
  });
  $("#backup-download")?.addEventListener("click", async () => {
    try {
      const d = await api("/api/backup");
      state.backupId = d.backupId || d.id;
      const blob = new Blob([JSON.stringify(d, null, 2)], {
          type: "application/json",
        }),
        url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download =
        "trainer-bridge-backup-" +
        new Date().toISOString().slice(0, 10) +
        ".json";
      a.click();
      URL.revokeObjectURL(url);
      $("#backup-status").textContent =
        "Backup downloaded. ID: " +
        (state.backupId || "Not returned by server");
    } catch (e) {
      toast(e.message);
    }
  });
  $("#restore-backup")?.addEventListener("click", async () => {
    const file = $("#restore-file").files[0];
    if (!file) {
      toast("Choose a backup JSON file first");
      return;
    }
    try {
      const backup = JSON.parse(await file.text());
      modal(
        "Restore backup",
        `<div class="notice warn">This replaces current application records. Type RESTORE to confirm.</div>${field("Confirmation", "confirm")}`,
        (d) => api("/api/restore", { backup, confirm: d.confirm }),
      );
    } catch (e) {
      toast(e.message);
    }
  });
  $("#cleanup-preview")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const before = formData(e.target).before,
        d = await api(
          "/api/backup-preview?before=" + encodeURIComponent(before),
        );
      $("#cleanup-result").innerHTML =
        `<div class="notice warn" style="margin-top:15px"><pre style="white-space:pre-wrap">${esc(JSON.stringify(d, null, 2))}</pre></div><button class="btn danger" id="cleanup-confirm">Confirm cleanup after backup</button>`;
      $("#cleanup-confirm").onclick = () =>
        modal(
          "Confirm permanent cleanup",
          `<div class="notice warn">Review the backup before deleting. Type DELETE to confirm.</div>${field("Backup ID", "backupId", state.backupId || "")}${field("Confirmation", "confirm")}`,
          async (f) => {
            await api("/api/cleanup", { before, ...f });
          },
        );
    } catch (err) {
      toast(err.message);
    }
  });
}
function createLead() {
  modal(
    "Share an opportunity",
    `<p class="muted">A 30-second entry is enough to get started.</p><div class="formgrid">${field("Topic / title", "title")}${field("Client / organisation", "client", "Not disclosed yet")}${field("Original message / brief", "brief", "", "textarea", true)}${select("Delivery mode (optional)", "mode", ["", "virtual", "classroom", "blended", "on-the-job"])}${field("Location (optional)", "location")}${field("Tentative date (optional)", "date", "", "date")}</div><div id="duplicate-hint"></div>`,
    async (d) => {
      const matches = await api(
        "/api/duplicates?title=" +
          encodeURIComponent(d.title) +
          "&client=" +
          encodeURIComponent(d.client),
      );
      if (
        matches.length &&
        confirm(
          `Possible duplicate: ${matches[0].title}. Add your contribution to this existing lead?`,
        )
      )
        d.mergeId = matches[0].id;
      await action("createLead", d);
    },
  );
}
function editProfile(id) {
  const t = trainer(id),
    p = t?.revision ||
      t?.changeRequest ||
      t?.profile || { name: state.user.name, email: state.user.email };
  modal(
    t ? "Request / prepare profile revision" : "Create your trainer profile",
    `<div class="notice">Use comma-separated values for topics, industries, languages and styles. Keep your top topics to five and styles/industries to three.</div><div class="formgrid">${["name", "email", "mobile", "city", "linkedin", "cv", "certificates"].map((k) => field(pretty(k), k, p[k])).join("")}${field("Short introduction", "introduction", p.introduction, "textarea", true)}${field("Top 5 topics", "topics", list(p.topics))}${field("Top 3 training styles", "styles", list(p.styles))}${field("Top 3 industries", "industries", list(p.industries))}${field("Languages", "languages", list(p.languages))}${field("Delivery modes", "modes", list(p.modes))}${field("Audience levels", "audiences", list(p.audiences))}${field("Years of relevant experience", "experience", p.experience || 0, "number")}${field("Domain / function", "domain", p.domain)}${select("Training type", "type", ["Technical", "Behavioural", "Compliance", "Leadership", "Digital"], p.type)}${select("Primary focus", "focus", ["People", "Process", "Product"], p.focus)}${select("Primary development area", "development", ["Knowledge", "Attitude", "Skill", "Habit"], p.development)}${select("Trainer age bracket (context only)", "ageBracket", ["Prefer not to say", "18–25", "26–35", "36–45", "46–55", "56+"], p.ageBracket)}${field("Travel preferences", "travel", p.travel)}${field("Minimum fee comfortable with", "fee", p.fee)}${field("Special conditions", "conditions", p.conditions, "textarea", true)}</div>`,
    (d) => {
      [
        "topics",
        "styles",
        "industries",
        "languages",
        "modes",
        "audiences",
      ].forEach(
        (k) =>
          (d[k] = d[k]
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)),
      );
      d.experience = Number(d.experience);
      return action(
        t && staff() && t.userId !== state.user.id
          ? "reviseProfile"
          : "saveProfile",
        t && staff() && t.userId !== state.user.id
          ? { trainerId: t.id, profile: d }
          : { profile: d },
      );
    },
  );
}
async function publicPage() {
  const path = location.pathname,
    token = path.split("/")[2],
    isClient = path.startsWith("/client/"),
    d = await api(
      (isClient ? "/api/client/" : "/api/feedback/") +
        encodeURIComponent(token),
    );
  $("#app").innerHTML =
    `<main class="public"><header class="publicheader"><div class="mark">B</div><span class="eyebrow">Trainer Assignment Bridge</span><h1>${isClient ? "Your training shortlist" : "Share your feedback"}</h1><p class="sub">Connecting trainers, opportunities, and facilitation.</p></header>${
      isClient
        ? `<section class="card" style="margin-bottom:20px"><h2>${esc(d.lead.title)}</h2><p>${esc(d.lead.brief || "")}</p><p class="muted">${esc(d.lead.date || "")} · ${esc(d.lead.mode || "")} · ${esc(d.lead.location || "")}</p></section><div class="actions" style="margin-bottom:18px"><button class="btn secondary" id="export-shortlist">Download shareable image</button></div>${d.lead.recommendation ? `<div class="notice">Coordinator recommendation: ${esc(d.lead.recommendation)}</div>` : ""}<div class="candidategrid">${d.candidates
            .map((c) => {
              const p = c.profile || c;
              return `<section class="card"><div class="avatar">${esc(p.name?.slice(0, 1))}</div><h2 style="margin-top:15px">${esc(p.name)}</h2><p>${esc(p.introduction || "")}</p><p class="muted">${esc(list(p.topics))}</p><p class="muted">${esc(p.city)} · ${esc(p.experience)} years experience</p>${p.linkedin ? `<a href="${esc(p.linkedin)}" target="_blank" rel="noopener">LinkedIn ↗</a>` : ""}<div class="divider"></div><button class="btn" data-client-select="${esc(c.trainerId || c.id)}">Choose this trainer</button></section>`;
            })
            .join("")}</div>`
        : `<section class="card"><h2>${esc(pretty(d.kind))} feedback</h2><p class="muted">Five quick questions. Your response goes directly to the site.</p><form id="feedback-form">${d.questions.map((q, i) => `<div class="feedback-question"><strong>${i + 1}. ${esc(typeof q === "string" ? q : q.text)}</strong><div class="choices">${["1 · Very poor", "2 · Poor", "3 · Fair", "4 · Good", "5 · Excellent", "Unable to assess"].map((v, j) => `<label><input type="radio" name="q${i}" value="${j === 5 ? "na" : j + 1}" required>${esc(v)}</label>`).join("")}</div></div>`).join("")}${field("What worked well, and what could be improved? (optional)", "comment", "", "textarea")}<button class="btn" style="margin-top:20px">Submit feedback</button></form></section>`
    }</main>`;
  $("#export-shortlist")?.addEventListener("click", () => {
    const rows = d.candidates
      .map((c, i) => {
        const p = c.profile || c;
        return `<text x="50" y="${200 + i * 125}" font-size="24" font-weight="bold">${esc(p.name)}</text><text x="50" y="${232 + i * 125}" font-size="16">${esc(list(p.topics).slice(0, 85))}</text><text x="50" y="${260 + i * 125}" font-size="14">${esc(p.city || "")} · ${esc(p.experience || 0)} years experience</text>`;
      })
      .join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="650"><rect width="900" height="650" fill="#f5f6f2"/><rect width="900" height="125" fill="#112936"/><g font-family="sans-serif" fill="#21313c"><text x="50" y="55" fill="white" font-size="28" font-weight="bold">Trainer Assignment Bridge</text><text x="50" y="90" fill="#a5ded0" font-size="18">${esc(d.lead.title)}</text>${rows}<text x="50" y="620" font-size="12">Approved shortlist · Open your private link to select a trainer</text></g></svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })),
      a = document.createElement("a");
    a.href = url;
    a.download = "approved-trainer-shortlist.svg";
    a.click();
    URL.revokeObjectURL(url);
  });
  document.querySelectorAll("[data-client-select]").forEach(
    (b) =>
      (b.onclick = async () => {
        try {
          await api("/api/client/" + token, {
            trainerId: b.dataset.clientSelect,
          });
          toast("Selection recorded. The trainer will confirm the booking.");
          b.disabled = true;
          b.textContent = "Selected";
        } catch (e) {
          toast(e.message);
        }
      }),
  );
  $("#feedback-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = formData(e.target);
    try {
      await api("/api/feedback/" + token, {
        answers: d.questions.map((q, i) =>
          f["q" + i] === "na" ? 0 : Number(f["q" + i]),
        ),
        comment: f.comment,
      });
      e.target.innerHTML =
        '<div class="notice">Thank you. Your feedback has been recorded.</div>';
    } catch (err) {
      toast(err.message);
    }
  });
  if (new URLSearchParams(location.search).has("print"))
    setTimeout(() => window.print(), 500);
}
async function boot() {
  try {
    if (/^\/(client|feedback)\//.test(location.pathname)) {
      await publicPage();
      return;
    }
    state.session = await api("/api/session");
    if (state.session.demo && !state.session.user) {
      const users = await api("/api/demo-users");
      await api("/api/demo-login", {
        userId: users.find((u) => u.role === "admin").id,
      });
      state.session = await api("/api/session");
    }
    if (!state.session.user) {
      $("#app").innerHTML =
        `<main class="public"><div class="publicheader"><div class="mark">B</div><h1>Trainer Assignment Bridge</h1><p>Connecting trainers, opportunities, and facilitation.</p></div><section class="card"><h2>Welcome to your trainer community</h2>${state.session.googleConfigured ? '<a class="btn" href="/auth/google">Continue with Google</a>' : '<div class="notice warn">Google sign-in needs deployment credentials. Contact your administrator.</div>'}</section></main>`;
      return;
    }
    if (state.session.demo) {
      const r = await api("/api/demo-users");
      state.demoUsers = Array.isArray(r) ? r : r.users || r.demoUsers || [];
    }
    await refresh();
  } catch (e) {
    $("#app").innerHTML =
      `<main class="public"><section class="card"><h1>Workspace unavailable</h1><p>${esc(e.message)}</p><button class="btn" id="retry-workspace">Try again</button></section></main>`;
  }
}
boot();
document.addEventListener("click", (e) => {
  if (e.target.id === "retry-workspace") location.reload();
});
