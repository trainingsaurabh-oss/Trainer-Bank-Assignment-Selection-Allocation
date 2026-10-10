"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  matchTrainer,
  rating,
  coordinatorRating,
  DEFAULT_WEIGHTS,
} = require("../lib/scoring");
const profile = {
  topics: ["Microsoft Excel"],
  audiences: ["frontline"],
  industries: ["hospitality"],
  styles: ["hands-on"],
  experience: 6,
  focus: "process",
  development: "skill",
  modes: ["classroom"],
  languages: ["Hindi"],
  city: "Jaipur",
};
const lead = {
  topic: "Excel",
  audience: "frontline",
  industry: "hospitality",
  style: "hands-on",
  focus: "process",
  development: "skill",
  mode: "classroom",
  language: "Hindi",
  location: "Jaipur",
  detailsConfirmed: true,
};

test("agreed suitability weights total 100 and exact full match scores ten", () => {
  assert.equal(
    Object.values(DEFAULT_WEIGHTS).reduce((a, b) => a + b),
    100,
  );
  const result = matchTrainer(profile, lead);
  assert.equal(result.score, 10);
  assert.equal(result.factors.length, 7);
  assert.equal(result.provisional, false);
});
test("trainer age cannot change suitability", () => {
  assert.equal(
    matchTrainer({ ...profile, age: 22 }, lead).score,
    matchTrainer({ ...profile, age: 62 }, lead).score,
  );
});
test("missing information remains provisional and explicit", () => {
  const result = matchTrainer({ ...profile, topics: [] }, lead);
  assert.equal(result.provisional, true);
  assert.ok(result.flags.some((flag) => flag.includes("Topic expertise")));
});
test("unused criteria redistribute weights and confirmed conflicts exclude", () => {
  const result = matchTrainer(
    profile,
    { topic: "Excel", detailsConfirmed: true, date: "2026-11-12", id: 2 },
    {},
    [{ status: "confirmed", date: "2026-11-12", leadId: 1 }],
  );
  assert.equal(result.score, 10);
  assert.equal(result.eligible, false);
});
test("specified language mismatch excludes and missing language remains provisional", () => {
  assert.equal(
    matchTrainer(profile, { ...lead, language: "English" }).eligible,
    false,
  );
  assert.equal(
    matchTrainer(
      profile,
      { ...lead, language: "English" },
      { requirements: { language: "mandatory" } },
    ).eligible,
    false,
  );
});
test("performance requires three completions and at least two client responses", () => {
  const record = {
    completed: true,
    plan: 9,
    client: 8,
    audience: 8,
    reliability: 10,
    outcome: 9,
    report: 9,
  };
  assert.equal(rating([record, record]).grade, "New/Unrated");
  const result = rating([record, record, { ...record, client: null }]);
  assert.equal(result.grade, "A");
  assert.equal(result.provisional, true);
  assert.equal(
    result.factors.find((item) => item.key === "comparative").score,
    null,
  );
});
test("comparative score uses other factors and requires a cohort", () => {
  const record = {
    completed: true,
    plan: 9,
    client: 9,
    audience: 9,
    reliability: 9,
    outcome: 9,
    report: 9,
  };
  const result = rating(
    [record, record, record],
    [{ ...record, plan: 2 }, { ...record, plan: 5 }, record],
  );
  assert.equal(
    result.factors.find((item) => item.key === "comparative").score,
    10,
  );
});
test("coordinator pass reasons produce explainable non-neutral differences", () => {
  const good = coordinatorRating([
    {
      action: "pass",
      reason: "Workload at capacity",
      timely: true,
      usefulHandover: true,
    },
  ]);
  const poor = coordinatorRating([
    { action: "pass", reason: "", timely: false },
  ]);
  assert.ok(good.score > poor.score);
  assert.equal(good.factors.length, 5);
});
test("pooling categories exclude confirmed mismatches and related topics remain reviewable", () => {
  assert.equal(
    matchTrainer(
      profile,
      { ...lead, topic: "Kitchen safety" },
      { pooling: ["topic"] },
    ).eligible,
    false,
  );
  assert.equal(
    matchTrainer(
      profile,
      { ...lead, topic: "Advanced Excel" },
      { pooling: ["topic"] },
    ).eligible,
    true,
  );
  assert.equal(
    matchTrainer(
      { ...profile, type: "behavioural" },
      { ...lead, type: "technical" },
      { pooling: ["type"] },
    ).eligible,
    false,
  );
  assert.equal(
    matchTrainer({ ...profile, modes: [] }, lead, { pooling: ["mode"] })
      .provisional,
    true,
  );
});
test("tier recommendation needs reviewed evidence and remains subject to Admin approval", () => {
  const { tierRecommendation } = require("../lib/scoring");
  assert.equal(
    tierRecommendation({ experience: 1 }, [], [{ status: "submitted" }]).tier,
    "Associate",
  );
  const recommendation = tierRecommendation(
    { experience: 6, cv: "https://example.test/cv" },
    [],
    [{ status: "approved" }],
  );
  assert.equal(recommendation.tier, "Senior Trainer");
  assert.equal(recommendation.requiresAdminApproval, true);
});
