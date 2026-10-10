"use strict";

const DEFAULT_WEIGHTS = {
  topic: 35,
  audience: 10,
  industry: 15,
  style: 10,
  experience: 10,
  focus: 10,
  development: 10,
};
const PERFORMANCE_WEIGHTS = {
  plan: 20,
  client: 15,
  audience: 15,
  reliability: 10,
  outcome: 15,
  report: 15,
  comparative: 10,
};
const clamp = (value) => Math.max(0, Math.min(10, Number(value) || 0));
const norm = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/microsoft|ms\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
const list = (value) =>
  (Array.isArray(value) ? value : value ? [value] : [])
    .map(norm)
    .filter(Boolean);
const average = (values) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
const rounded = (value) => Math.round(value * 10) / 10;

function similarity(values, target) {
  const options = list(values),
    query = norm(target);
  if (!options.length)
    return {
      score: 0,
      unknown: true,
      reason: "Profile information needs confirmation",
    };
  if (options.includes(query))
    return { score: 10, reason: "Direct declared match" };
  const words = query.split(" ").filter((word) => word.length > 2);
  const overlap = Math.max(
    0,
    ...options.map(
      (option) =>
        words.filter((word) => option.split(" ").includes(word)).length /
        Math.max(1, words.length),
    ),
  );
  return {
    score: overlap > 0 ? rounded(4 + overlap * 3) : 0,
    reason:
      overlap > 0 ? "Related expertise; review required" : "No declared match",
  };
}

function matchTrainer(profile, lead, settings = {}, history = []) {
  const weights = { ...DEFAULT_WEIGHTS, ...(settings.weights || {}) };
  const flags = [];
  let eligible = true;
  let provisional = !lead.detailsConfirmed;
  const requirements = settings.requirements || lead.requirements || {};
  // Practical requirements are shown independently from the suitability score.
  for (const [key, field] of [
    ["language", "languages"],
    ["mode", "modes"],
  ]) {
    if (!lead[key]) continue;
    const supplied = list(profile[field]);
    if (!supplied.length) {
      flags.push(`${key}: needs confirmation`);
      provisional = true;
    } else if (
      !supplied.includes(norm(lead[key])) &&
      !(key === "mode" && supplied.includes("both"))
    ) {
      flags.push(`${key}: mismatch`);
      if (
        requirements[key] === "mandatory" ||
        key === "language" ||
        (settings.pooling || []).includes("mode")
      )
        eligible = false;
    }
  }
  if (
    lead.location &&
    profile.city &&
    norm(lead.location) !== norm(profile.city)
  ) {
    const travelling = /national|regional|state|india|travel/i.test(
      profile.travel || "",
    );
    flags.push(
      travelling
        ? "Travel capability declared; confirm destination"
        : "Location/travel needs confirmation",
    );
    if (
      (settings.pooling || []).includes("geography") &&
      !travelling &&
      norm(lead.mode) !== "virtual"
    ) {
      if (/no|local|city|remote/i.test(profile.travel || "")) eligible = false;
      else provisional = true;
    }
  }
  const categoryNames = [
    ...new Set([
      ...(settings.pooling || []),
      ...Object.keys(requirements).filter(
        (key) => requirements[key] === "mandatory",
      ),
    ]),
  ];
  for (const category of categoryNames) {
    const specification = {
      topic: [profile.topics, lead.topic || lead.title],
      type: [profile.type, lead.type],
      audience: [profile.audiences, lead.audience],
      domain: [profile.domain, lead.domain],
      industry: [profile.industries, lead.industry],
      style: [profile.styles, lead.style],
      focus: [profile.focus, lead.focus],
      development: [profile.development, lead.development],
    }[category];
    if (!specification || !specification[1]) continue;
    const match = similarity(...specification);
    if (match.unknown) {
      flags.push(`Pool ${category}: needs confirmation`);
      provisional = true;
    } else if (match.score === 0) {
      flags.push(`Pool ${category}: confirmed mismatch`);
      eligible = false;
    }
  }
  const conflict =
    lead.date &&
    history.some(
      (item) =>
        String(item.date || "").slice(0, 10) ===
          String(lead.date).slice(0, 10) &&
        ["confirmed", "allocated"].includes(item.status) &&
        item.leadId !== lead.id,
    );
  if (conflict) {
    flags.push("Confirmed booking conflict");
    eligible = false;
  }
  const definitions = [
    ["topic", "Topic expertise", profile.topics, lead.topic || lead.title],
    ["audience", "Audience fit", profile.audiences, lead.audience],
    ["industry", "Industry familiarity", profile.industries, lead.industry],
    ["style", "Training type and style", profile.styles, lead.style],
    ["experience", "Relevant experience", null, true],
    ["focus", "People / Process / Product", profile.focus, lead.focus],
    [
      "development",
      "Knowledge / Attitude / Skill / Habit",
      profile.development,
      lead.development,
    ],
  ];
  const factors = definitions
    .filter(([, , , target]) => target)
    .map(([key, label, values, target]) => {
      const result =
        key === "experience"
          ? profile.experience == null || profile.experience === ""
            ? {
                score: 0,
                unknown: true,
                reason: "Relevant experience needs confirmation",
              }
            : {
                score: clamp(4 + Math.min(6, Number(profile.experience))),
                reason: `${profile.experience} years declared; evidence review strengthens confidence`,
              }
          : similarity(values, target);
      if (key === "topic" && result.score === 10) {
        const reviewed = list(profile.verifiedTopics).includes(norm(target));
        const delivered = history.some(
          (item) =>
            (item.completed || item.status === "completed") &&
            norm(item.topic) === norm(target),
        );
        if (reviewed || delivered)
          result.reason = reviewed
            ? "Direct match supported by reviewed topic evidence"
            : "Direct match supported by verified completed delivery";
        else {
          result.score = 8;
          result.reason =
            "Direct declared match; topic evidence awaits verification";
          provisional = true;
        }
      }
      if (result.unknown) {
        provisional = true;
        flags.push(`${label}: missing information`);
      }
      return {
        key,
        label,
        weight: Math.max(0, Number(weights[key]) || 0),
        score: result.score,
        reason: result.reason,
      };
    });
  const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);
  const score = totalWeight
    ? rounded(
        factors.reduce((sum, factor) => sum + factor.score * factor.weight, 0) /
          totalWeight,
      )
    : 0;
  return { score, provisional, factors, flags, eligible };
}

function rating(history = [], cohort = []) {
  const completed = history.filter(
    (item) => item.completed || item.status === "completed",
  );
  const clientCount = completed.filter((item) =>
    Number.isFinite(item.client),
  ).length;
  const factors = Object.entries(PERFORMANCE_WEIGHTS).map(([key, weight]) => {
    const scores = completed
      .map((item) => item[key])
      .filter((value) => Number.isFinite(value))
      .map(clamp);
    return { key, weight, score: average(scores), count: scores.length };
  });
  const comparative = factors.find((item) => item.key === "comparative");
  if (comparative.score === null && cohort.length >= 3) {
    const baseScore = (record) => {
      const available = Object.entries(PERFORMANCE_WEIGHTS).filter(
        ([key]) => key !== "comparative" && Number.isFinite(record[key]),
      );
      return available.length
        ? available.reduce(
            (sum, [key, weight]) => sum + clamp(record[key]) * weight,
            0,
          ) / available.reduce((sum, [, weight]) => sum + weight, 0)
        : null;
    };
    const own = average(completed.map(baseScore).filter(Number.isFinite));
    const peers = cohort.map(baseScore).filter(Number.isFinite);
    if (own !== null && peers.length >= 3) {
      comparative.score = rounded(
        (10 * peers.filter((score) => score <= own).length) / peers.length,
      );
      comparative.count = peers.length;
    }
  }
  const available = factors.filter((item) => item.score !== null);
  const score = available.length
    ? rounded(
        available.reduce((sum, item) => sum + item.score * item.weight, 0) /
          available.reduce((sum, item) => sum + item.weight, 0),
      )
    : null;
  const qualified = completed.length >= 3 && clientCount >= 2;
  return {
    score,
    grade:
      qualified && score !== null
        ? score >= 8
          ? "A"
          : score >= 6
            ? "B"
            : "C"
        : "New/Unrated",
    provisional: !qualified || factors.some((item) => item.score === null),
    factors,
    completed: completed.length,
    clientFeedbackCount: clientCount,
  };
}

function coordinatorRating(events = []) {
  const keys = [
    "ownership",
    "responsiveness",
    "followThrough",
    "handover",
    "contribution",
  ];
  const factors = keys.map((key) => {
    const scores = events
      .map((event) => {
        if (Number.isFinite(event[key])) return clamp(event[key]);
        if (event.action === "pass") {
          const valid = /workload|leave|conflict|occupied|capacity/i.test(
            event.reason || "",
          );
          return key === "handover"
            ? event.usefulHandover
              ? 8
              : 3
            : key === "responsiveness"
              ? event.timely
                ? 8
                : 2
              : valid
                ? 6
                : 2;
        }
        if (event.action === "accept")
          return event.completed ? 9 : event.overdue ? 2 : 5;
        return null;
      })
      .filter(Number.isFinite);
    return {
      key,
      weight: 20,
      score: average(scores),
      count: scores.length,
      reason:
        "Activity, timeliness, pass reasons, and follow-through; no neutral pass category",
    };
  });
  const values = factors.map((item) => item.score).filter(Number.isFinite);
  return {
    score: values.length ? rounded(average(values)) : null,
    provisional: events.length < 3,
    factors,
  };
}

function tierRecommendation(profile = {}, history = [], certificates = []) {
  const verified = certificates.filter(
    (c) => c.status === "verified" || c.status === "approved",
  ).length;
  const years = Math.max(0, Number(profile.experience) || 0);
  const performance = rating(history);
  const completed = history.filter(
    (h) => h.completed || h.status === "completed",
  ).length;
  let tier = "Associate";
  if (years >= 2 || verified || completed >= 3) tier = "Trainer";
  if (
    years >= 5 &&
    (verified || completed >= 5) &&
    (performance.score === null || performance.score >= 7)
  )
    tier = "Senior Trainer";
  if (years >= 10 && verified && completed >= 10 && performance.score >= 8)
    tier = "Master Trainer";
  return {
    tier,
    requiresAdminApproval: true,
    reasons: [
      `${years} declared relevant years`,
      `${verified} reviewed certificates`,
      `${completed} verified completed assignments`,
      profile.cv
        ? "CV link available for reviewer assessment"
        : "CV evidence not yet provided",
    ],
    provisional: !verified && completed === 0,
  };
}

module.exports = {
  matchTrainer,
  rating,
  coordinatorRating,
  tierRecommendation,
  DEFAULT_WEIGHTS,
  PERFORMANCE_WEIGHTS,
};
