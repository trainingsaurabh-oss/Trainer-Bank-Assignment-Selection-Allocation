const crypto = require("node:crypto");
const questions = {
  audience: [
    "How clear were the explanations?",
    "How relevant was the training?",
    "How engaging was the session?",
    "How useful were examples and activities?",
    "How confident are you applying the learning?",
  ],
  client: [
    "How well were objectives met?",
    "How well did content suit the audience?",
    "How effective was delivery?",
    "How well were agreed requirements managed?",
    "How satisfied are you overall?",
  ],
};
function initialState(demo = false) {
  const users = demo
    ? [
        {
          id: "admin",
          name: "Saurabh Pande",
          email: "admin@example.test",
          role: "admin",
        },
        {
          id: "sub1",
          name: "Meera Shah",
          email: "meera@example.test",
          role: "subadmin",
        },
        {
          id: "sub2",
          name: "Arjun Rao",
          email: "arjun@example.test",
          role: "subadmin",
        },
        ...["North", "West", "South"].map((z, i) => ({
          id: "coord" + (i + 1),
          name: z + " Coordinator",
          email: "coord" + i + "@example.test",
          role: "coordinator",
          capacity: 25,
          subadminId: i === 2 ? "sub2" : "sub1",
        })),
        ...["Ananya Sharma", "Rohan Mehta", "Priya Nair", "Kabir Singh"].map(
          (name, i) => ({
            id: "trainer" + (i + 1),
            name,
            email: "trainer" + i + "@example.test",
            role: "trainer",
          }),
        ),
      ]
    : [];
  const trainers = demo
    ? users
        .filter((u) => u.role === "trainer")
        .map((u, i) => ({
          id: u.id,
          userId: u.id,
          status: "approved",
          coordinatorId: "coord" + ((i % 3) + 1),
          tier: "Trainer",
          profile: {
            name: u.name,
            email: u.email,
            mobile: "",
            city: ["Delhi", "Mumbai", "Bengaluru", "Delhi"][i],
            topics:
              i === 3
                ? ["Excel", "Digital productivity"]
                : ["Leadership", "Communication", "Team building"],
            styles: ["Interactive workshops", "Case studies"],
            industries: ["Hospitality", "Retail"],
            languages: ["English", "Hindi"],
            modes: ["virtual", "classroom"],
            audiences: ["Frontline", "Supervisors"],
            experience: 3 + i,
            focus: "People",
            development: "Skill",
            introduction:
              "Practical learning experiences that help people thrive.",
            fee: "Discuss based on assignment scope",
            domain: "General soft skills",
            type: "behavioural",
            cv: "",
            linkedin: "",
            conditions: "",
            travel: "National",
          },
          revision: null,
          history: [],
        }))
    : [];
  const state = {
    version: 1,
    users,
    trainers,
    leads: [],
    sessions: {},
    settings: {
      weights: {
        topic: 35,
        audience: 10,
        industry: 15,
        style: 10,
        experience: 10,
        focus: 10,
        development: 10,
      },
      pooling: ["topic", "type", "audience", "mode", "geography"],
      questions,
      rotation: 0,
    },
    audit: [],
    coordinatorEvents: [],
    backups: [],
  };
  if (demo)
    state.leads = [
      {
        id: "lead-welcome",
        title: "Leadership for frontline teams",
        client: "Horizon Hospitality",
        brief:
          "A practical leadership workshop for frontline supervisors. English delivery, online.",
        createdBy: "trainer1",
        ownerId: "coord1",
        createdAt: new Date().toISOString(),
        status: "detailing",
        mode: "virtual",
        location: "",
        date: "",
        threshold: 7,
        crucial: false,
        detailsConfirmed: false,
        topic: "Leadership",
        audience: "Supervisors",
        industry: "Hospitality",
        style: "Interactive workshops",
        focus: "People",
        development: "Skill",
        language: "English",
        submissions: [
          {
            id: crypto.randomUUID(),
            userId: "trainer1",
            brief: "Leadership workshop opportunity",
            at: new Date().toISOString(),
          },
        ],
        invitations: [],
        shortlist: [],
        approvals: [],
        initialApprovals: [],
        reports: {},
        reviews: [],
        deadlines: {},
      },
    ];
  return state;
}
module.exports = { initialState, questions };
