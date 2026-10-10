# Trainer Assignment Bridge

_Connecting trainers, opportunities, and facilitation._

Status: agreed product requirements, not an implemented application.

This document captures decisions from the product discussion. Unresolved rules are recorded in OPEN_DECISIONS.md rather than assumed here.

## Purpose

A shared trainer bank where members contribute opportunities they are not taking themselves. The site recommends suitable trainers, supports coordinated selection and independent approval, lets clients choose, and records delivery and community contributions.

## Roles and visibility

- Trainer: maintains a profile, submits leads, responds to invitations, confirms bookings, submits plans and reports, and distributes feedback links.
- Coordinator: monitors and details leads, coordinates their coverage, reviews profiles, prepares profile revisions, invites candidates, proposes shortlists, and performs assigned quality reviews.
- Sub-admin: oversees assigned coordinators and their trainers, handles passed leads, approves registrations and profile revisions, participates in allocation and approvals, and reviews escalations.
- Admin: has full oversight, appoints roles, assigns coordinators to Sub-admins and trainers to coordinators, manages permissions and settings, approves seniority changes and threshold exceptions.
- Client: accesses an approved shortlist through a private link, chooses a trainer, and submits feedback without requiring a trainer account.

Initially there is one Admin and two Sub-admins. Permissions can be granted separately to specific Sub-admins; rights must not automatically propagate to both.

Rating visibility follows the hierarchy: trainers see their own ratings; coordinators see their assigned trainers; Sub-admins see their assigned coordinators and those trainers; Admin sees all. Approved trainers can browse a directory containing name, city, teaching topics, and introduction. Contact details, CV, fees, grades, and assignment history remain restricted.

## Trainer profile

Target initial completion time: 3–5 minutes. Required versus optional fields remain to be settled.

- Name, email, mobile, city.
- LinkedIn link, CV link, short introduction (proposed limit: 300 characters).
- Training experience.
- Top five topics delivered.
- Top three training styles.
- Top three industries comfortable with.
- Primary focus: People / Process / Product.
- Primary development area: Knowledge / Attitude / Skill / Habit.
- Delivery languages, delivery modes, and travel preferences.
- Minimum comfortable fee: open text including charging basis and conditions.
- Special assignment conditions/preferences: optional open text.

Detailed categorisation supports domain/function (including a separate general soft-skills group), training type, audience level, geography/availability, language, engagement type, seniority, performance, and specialisation. Trainer age bracket and experience with audience age groups are available for context; age alone does not award or deduct suitability points.

Admin or Sub-admin approves initial registration. Coordinators can review and recommend corrections. For later changes, the trainer requests revisions, the coordinator reviews/edits the revised profile, and a Sub-admin approves. The existing approved version remains active until approval; retain versions and audit history.

CVs, certificates, and supporting documents use external links initially. Certificates remain Submitted until Admin/Sub-admin review; reviewed relevant certificates contribute fully to tier recommendations.

## Lead capture and detailing

Any approved trainer can submit a basic lead. Target entry time: 30–60 seconds.

Required quick inputs:

1. Topic or short title.
2. Client/organisation, allowing Not disclosed yet.
3. Original brief/message or short requirement.

Optional quick inputs: tentative date, mode, location, and budget. Record contributor and submission time automatically.

The site detects likely duplicates and asks the submitter to confirm that it is the same opportunity. Merge confirmed duplicates into one master lead, retaining original submissions, contributors, timestamps, and extra information. Show submission and contributor counts; flag conflicting details. Useful contributions receive separate community recognition. Repetition increases attention priority; urgency requires supporting evidence such as a deadline.

Detailed requirements are completed later by the proposer/coordinator, assisted by extraction and configurable rules. Preserve the original brief. Distinguish entered, extracted, and suggested information; assumptions require human confirmation before invitations or client documents. Initial trainer suggestions are provisional and do not notify trainers or affect ratings.

## Coverage and routing

Coverage uses city/state groupings according to trainer distribution and manageable capacity. Coordinators state capacity; Admin confirms coverage. The site suggests two suitable primary coordinators for each trainer using location, capacity, workload, and preference rating. Only Admin selects initially.

Both delivery-location and trainer-location coordinators participate in in-person coordination. Exact lead ownership where coverage overlaps remains open.

Online leads follow round-robin assignment. With 12 coordinators, leads 1–12 go to coordinators 1–12 and lead 13 returns to coordinator 1. Coordinators may pass with a reason, but cannot transfer directly to another coordinator. Passed leads go to Admin/Sub-admins, who take ownership or decide reassignment. Passing does not change the regular rotation: after coordinator 1 passes, the next new lead goes to coordinator 2.

Admin/Sub-admin remain informed throughout. Admin assigns coordinators to Sub-admins with site suggestions based on workload and trainer count.

## Matching and suitability

Default initial pooling categories:

1. Domain/function and topic.
2. Training type: technical/skill-based, behavioural/soft skills, compliance/safety, leadership, digital/systems.
3. Audience level: frontline, supervisors, middle managers, senior leaders.
4. Delivery mode: classroom, virtual, blended, on-the-job/floor coaching.
5. Geography and availability.

Required language is an additional essential filter. Confirmed booking conflicts are excluded; unknown information is flagged. Mandatory / Preferred / Not required controls are available to Admin/Sub-admin case by case, outside normal entry.

Admin can change pooling checkboxes globally or per assignment. Sub-admins initially cannot; Admin can grant either permission individually. Record the settings used in each assessment.

Detailed suitability weights:

| Factor                                                | Weight |
| ----------------------------------------------------- | -----: |
| Topic expertise and depth                             |    35% |
| Audience fit, including audience age-group experience |    10% |
| Industry familiarity                                  |    15% |
| Training type and delivery style                      |    10% |
| Relevant experience, seniority, and specialisation    |    10% |
| People / Process / Product alignment                  |    10% |
| Knowledge / Attitude / Skill / Habit alignment        |    10% |
| Total                                                 |   100% |

Topic evidence uses declared topics, reviewed supporting evidence, and verified delivery history. New trainers remain eligible. Unspecified assignment factors have weights redistributed; missing trainer evidence is visibly flagged and the assessment remains provisional. Avoid counting the same evidence twice.

Display suitability out of 10, with one decimal, a factor breakdown, and gaps. Only Admin changes suitability weights globally or per assignment. Keep credibility, fees, availability flags, and allocation considerations visible separately.

At initial assignment approval, the coordinator/Sub-admin sets the suitability threshold, minimum 7/10. Only Admin may lower it with a recorded special-case reason.

Coordinators, Sub-admins, and Admin may propose candidates using discretion. Record a consideration category and short reason alongside actual suitability. Categories include time without allocation, need for opportunity/support, new trainer, expertise not reflected in profile, client preference, practical advantages, fair distribution, and Other. These reasons do not inflate suitability or reduce credibility.

## Invitations, approvals, and client selection

Flow: lead → detailing → initial assignment approval → invitations → interested candidates → proposed shortlist → independent shortlist approval → client choice → trainer confirmation → delivery → reports/feedback.

- Standard initial approval: one coordinator or Sub-admin.
- Crucial initial approval: two distinct reviewers, one coordinator plus one Sub-admin/Admin.
- Trainers respond Interested / Decline / Need clarification through the site.
- Declines trigger replacement suggestions; invitation/selection remains a human decision.
- Coordinator proposes up to three interested candidates, recording recommendation and ranking separately from automatic suitability.
- Standard shortlist: one approval from Admin/the two Sub-admins.
- Crucial shortlist: two approvals from those three.
- A proposer cannot approve their own shortlist. Their recommendation carries weight but is not independent approval.
- Adding, removing, or replacing candidates resets approval. Material scope/date/fee changes require review; spelling corrections do not.
- Fewer than three qualifying interested candidates: invite more, request Admin threshold exception, or propose a smaller shortlist using normal approval.

Crucial reasons include high value, key client, large audience, specialised expertise, high visibility, urgency, and Other with explanation. Coordinators can flag; Admin/Sub-admin confirms classification.

After approval, generate a private client link, PDF, and compact shareable image with link/QR. Client sees relevant professional information and approved recommendation, not internal grades, decline reasons, consideration reasons, or notes. Candidate changes pause client access until reapproval; track exported versions as superseded internally. Already downloaded files cannot be remotely withdrawn.

## Seniority and performance

Seniority: Associate / Trainer / Senior Trainer / Master Trainer. Site proposes the initial tier from reviewed certifications, relevant experience, and CV. Later verified activity informs upgrades/downgrades. Admin approves changes with evidence; trainers do not select their own tier.

Performance grades: A / B / C / New-Unrated. Grading starts after three verified completed assignments with client feedback from at least two.

| Performance factor      | Weight |
| ----------------------- | -----: |
| Pre-session plan        |    20% |
| Client feedback         |    15% |
| Audience feedback       |    15% |
| Commitment reliability  |    10% |
| Verified outcomes       |    15% |
| Post-session reporting  |    15% |
| Comparative performance |    10% |
| Total                   |   100% |

Compare similar assignments by topic, audience level, and mode, using the other six factors to avoid circular calculations. With insufficient comparison data, show a provisional grade based on available factors. Plans/reports are assessed for quality and completeness, not just submission. Self-reported praise alone does not establish outcomes.

Declines and community contributions are separate indicators, not teaching-performance inputs. Invitations alone, provisional suggestions, and missing client feedback do not establish poor performance.

Coordinator preference rating is automatically calculated from ownership, responsiveness, follow-through, handover quality, and community contribution. Every acceptance/pass contributes according to reason, timing, workload, and outcome; no neutral grading category. Exact points remain open. Site suggests potential Sub-admin candidates when vacancies arise; Admin appoints.

## Plans, reports, and deadlines

- Rough approach draft: within three days of final booking acceptance, targeting day two.
- Final plan/flow: at least five days before training.
- Post-session report: within two days after training.
- Coordinator/Sub-admin/Admin can revise deadlines with recorded reasons, including short-notice bookings.

Reviewers are selected by expertise and availability, not necessarily trainer ownership. Site suggests three coordinators; responsible Admin/Sub-admin selects. If fewer qualify, show available candidates and flag the gap.

Standard plans/reports use one coordinator reviewer, with escalation as needed. Crucial plans/reports require two distinct reviewers: suitable coordinator plus Sub-admin/Admin. Use the same checklist and average their scores; address requested changes before approval.

## Feedback

Site automatically provides session-specific audience and client links to the trainer at scheduled session end. Trainer distributes the audience link/QR to the whole audience and forwards the client link. Responses go directly to the site and cannot be edited/deleted by the trainer.

Each form has five multiple-choice questions and an optional comment. Use a five-point scale with question-appropriate labels and Unable to assess excluded from scoring. Admin can change future questions/options; preserve the form version for each session.

Audience questions: clarity, relevance, engagement, useful examples/activities, confidence applying learning.

Client questions: objectives met, audience fit, delivery effectiveness, management of session/agreed requirements, overall satisfaction.

Optional comment: What worked well, and what could be improved?

Audience feedback is anonymous. Reviewers see response count and expected participant count. Verification, anti-duplication rules, and minimum response coverage remain to be specified.

## Dashboards and access

Trainer: Invitations; Assignments; Pending actions/deadlines; My profile and ratings; My contributions.

Coordinator: Lead queue; Trainer coverage/profile requests; Assignment coordination; Assigned reviews; My rating/workload/pass history.

Sub-admin: Team overview; Escalated leads; Approvals; Quality reviews; Allocation tracking. Apply hierarchy and delegated permissions.

Admin: Overview; People and hierarchy; Approvals/exceptions; Performance and succession suggestions; Settings.

Use Google sign-in initially. New trainers complete registration and await approval; Admin assigns staff roles. Clients use private shortlist links.

Reminders appear in trainer Pending actions and notification bell. Automated email was discussed, but external notification channels and reminder cadence are not yet a committed implementation requirement.

## Storage and deployment

Use a shared dashboard, text records, and external document links. Plans/reports support text and optional links. No initial video/photo uploads. Older notifications may be cleared; retain grading/audit history under a policy still to be defined.

Codex is currently the development environment. Permanent public hosting, storage limits, background scheduling, and authentication configuration remain unverified. Do not assume development processes provide production hosting.
