# Trainer Assignment Bridge — Complete Site Specification

*Connecting trainers, opportunities, and facilitation.*

Version: 1.0 | Prepared: 10 October 2026 | Intended hosting: Codex Sites

## Document scope and decision status

This is the consolidated product specification from the discussion, incorporating later corrections and the approved instruction to use simple initial defaults. It describes the whole intended site, not merely the current screen designs.

- **Agreed requirements:** Explicit decisions made during the discussion, including roles, approval counts, pooling categories, scoring weights, deadlines, visibility and storage policy.
- **Initial defaults:** Practical rules adopted under the user's instruction to keep remaining details simple and adjustable. These are identified in the initial-default section.
- **Implementation limits:** Features or integrations that remain incomplete or unverified are identified separately. A requirement in this document is not a claim that it is already deployed.

Later specific decisions take precedence over earlier proposals. In particular: all approved trainers can submit leads; coordinators cannot pass directly to another coordinator; expertise-based reviewers are used for both pre-session and post-session reviews; and Codex Sites is the intended host.

## Product identity and experience

The site connects a trainer community with training opportunities. It should be professional, welcoming and easy to use on mobile and desktop. Fast lead capture and short trainer registration take priority over unnecessary form filling. Coordinators facilitate; the site explains recommendations; approvals and client selection remain accountable human decisions.

There are four distinct measurements: assignment-specific suitability, trainer delivery performance, community contribution, and coordinator preference. They must not be collapsed into one unexplained score.

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

Target initial completion time: 3–5 minutes. Initial default: name, city and at least one topic are required; verified identity email comes from sign-in. The remaining fields are available, with supporting links completable later.

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

Both delivery-location and trainer-location coordinators participate in in-person coordination. Initial default: an available delivery-zone coordinator with capacity owns the lead; trainer-zone coordinators support. Uncovered locations go to Admin/Sub-admins. More detailed overlap rules can be refined later.

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

Coordinator preference rating is automatically calculated from ownership, responsiveness, follow-through, handover quality, and community contribution. Every acceptance/pass contributes according to reason, timing, workload, and outcome; no neutral grading category. The five factors initially carry equal weight. Detailed pass categories and evidence rubrics can be refined without changing the agreed factors. Site suggests potential Sub-admin candidates when vacancies arise; Admin appoints.

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

Audience feedback is anonymous. Reviewers see response count and expected participant count. Initial default: one client response per session; audience duplicate prevention is best-effort. Audience scoring needs five responses, or half the batch if the participant count is below ten. Insufficient coverage stays provisional. Stronger participant/client verification remains a future refinement.

## Dashboards and access

Trainer: Invitations; Assignments; Pending actions/deadlines; My profile and ratings; My contributions.

Coordinator: Lead queue; Trainer coverage/profile requests; Assignment coordination; Assigned reviews; My rating/workload/pass history.

Sub-admin: Team overview; Escalated leads; Approvals; Quality reviews; Allocation tracking. Apply hierarchy and delegated permissions.

Admin: Overview; People and hierarchy; Approvals/exceptions; Performance and succession suggestions; Settings.

Use Google sign-in initially. New trainers complete registration and await approval; Admin assigns staff roles. Clients use private shortlist links.

Reminders appear in trainer Pending actions and notification bell. Automated email was discussed, but external notification channels and reminder cadence are not yet a committed implementation requirement.

## Storage and deployment

Use a shared dashboard, text records, and external document links. Plans/reports support text and optional links. No initial video/photo uploads. Older notifications may be cleared; retain grading/audit history under a policy still to be defined.

The selected deployment destination is Codex Sites with a native hosted URL. This session lacks Sites tools and a Sites skill; that is a session limitation, not proof that Sites cannot support the application. The receiving Sites-enabled session must assess runtime, durable shared data and authentication, then adapt without removing functionality. No Sites URL or production sign-in has been verified.

## Detailed trainer categorisation

| Category | Choices or examples | Purpose |
| --- | --- | --- |
| Domain/function | Front office, F&B service, housekeeping, kitchen, sales, HR; separate general soft-skills group | Relevant functional expertise |
| Training type | Technical/skill-based; behavioural/soft skills; compliance and safety; leadership; digital/systems | Nature of the intervention |
| Seniority tier | Associate; Trainer; Senior Trainer; Master Trainer | Admin-approved quality ladder |
| Engagement type | Internal; empanelled external; one-time freelance; agency-affiliated | Commercial/organisational arrangement, used when relevant |
| Delivery mode | Classroom; virtual; blended; on-the-job/floor coaching | Practical delivery fit |
| Audience level | Frontline; supervisors; middle managers; senior leaders | Audience experience and responsibility |
| Geography/availability | Local; regional; national/travelling; remote-only; full-time/part-time; date availability | Coverage and scheduling |
| Language | Languages the trainer can confidently deliver in | Required-language compatibility |
| Performance | A; B; C; New/Unrated | Verified delivery record |
| Specialisation | Content designer; facilitator; assessor/evaluator; coach; train-the-trainer expert | Detailed shortlist refinement |

These categories support two-stage selection. The five agreed pooling categories narrow the initial pool; other relevant attributes refine the shortlist. Detailed categorisation must not make first registration unnecessarily long. Engagement type and age must not automatically imply competence.

Training style examples: interactive workshops; experiential activities/games; case studies/group discussion; role plays/simulations; demonstrations/hands-on practice; lectures/presentations; coaching/reflection; Other.

Special conditions may cover notice period, duration/batch size, travel/accommodation, accessibility, equipment, payment terms, or assignments the trainer does not take. Commercial and sensitive personal considerations remain internal.

## Detailed assignment form

Quick leads and detailed assignments are stages of the same record. Avoid forcing detailed fields during the 30–60 second lead entry.

| Group | Detailed information |
| --- | --- |
| Requirement | Topic/subtopics, audience level and age group, industry, intended outcomes, preferred training type/style |
| Alignment | People/Process/Product and Knowledge/Attitude/Skill/Habit, when specified |
| Delivery | Language, mode, location, confirmed or tentative date, duration, participant count, practical requirements |
| Commercial | Trainer fee/budget status, travel expenses and conditions where known |
| Coordination | Responsible coordinator, source/contributors, follow-up information, response deadline |
| Controls | Standard/Crucial status and reason, suitability threshold, authorised pooling/requirement overrides |

Initial invitation-readiness default: reviewed brief, audience, delivery mode/location status, date and fee status, response deadline, classification and threshold. Unknown facts remain explicitly unknown. Site-generated assumptions must not become client-confirmed facts without review.

Original briefs can be pasted. Future extraction should label facts as Entered, Extracted or Suggested. AI extraction is not currently integrated. Template suggestions can be added only under documented rules.

## Approval and permission matrix

| Decision | Standard | Crucial | Notes |
| --- | --- | --- | --- |
| Initial assignment readiness | One coordinator or Sub-admin | Coordinator plus one Sub-admin/Admin | Threshold set before invitations; minimum 7 unless Admin exception |
| Final client shortlist | One of Admin/two Sub-admins | Two of those three | Distinct independent approvers; proposer excluded |
| Pre-session plan | Suitable coordinator; escalation if needed | Suitable coordinator plus Sub-admin/Admin | Expertise/availability selection; averaged scores |
| Post-session report | Suitable coordinator; escalation if needed | Suitable coordinator plus Sub-admin/Admin | Same expert-review approach |
| Initial trainer registration | Admin or Sub-admin | Not applicable | Coordinator can review/recommend corrections |
| Approved profile changes | Coordinator-prepared revision, Sub-admin approval | Not applicable | Approved version remains active until approval |
| Seniority tier/change | Admin | Not applicable | Site recommendation with evidence |
| Primary coordinator assignment | Admin initially | Not applicable | Site suggests two; delegation individually granted later |
| Coordinator-to-Sub-admin hierarchy | Admin | Not applicable | Workload/trainer-count suggestions |
| Suitability weight changes | Admin only | Admin only | Global or per assignment |
| Pooling category changes | Admin; individually permitted Sub-admin | Same | Global and assignment permissions separately controlled |
| Backup, restore and cleanup | Admin only | Admin only | Preview, verified backup and explicit confirmation |

Ordinary discretion does not bypass essential requirements, thresholds, initial approval, independent shortlist approval or client choice. Admin threshold exceptions must be recorded.

If an Admin proposes a crucial shortlist, both Sub-admins provide independent approval. If a Sub-admin proposes one, Admin and the other Sub-admin approve. A recommendation can carry weight but is not a vote.

## Coordinator allocation examples

A city containing 100 trainers may require more coordinators than a state containing 50. Capacity depends on the person's declared and Admin-approved ability to handle trainers, not a fixed geographic quota.

The site suggests two coordinator candidates for each trainer; Admin makes the initial choice. Suggestions consider location, capacity, workload and preference rating. The trainer has one primary coordinator.

For twelve online coordinators: lead 1 goes to coordinator 1; lead 12 to coordinator 12; lead 13 to coordinator 1. If coordinator 1 passes, that lead goes to Admin/Sub-admins for a decision. The next new lead goes to coordinator 2. Receiving a reassigned lead does not automatically change the normal rotation.

Admin/Sub-admins remain informed. A coordinator cannot select another coordinator as the recipient of a passed lead.

## Suitability explanation and discretion

Suitability is specific to the assignment and shown as, for example, 8.2/10. Show the seven-factor breakdown, supporting information, practical-fit flags and unresolved gaps.

Topic evidence comes from declared expertise, reviewed supporting information and verified delivery. A short profile does not justify fabricated skills. Missing evidence produces a provisional assessment rather than certainty. Trainer age bracket is context only; audience age-group experience may inform audience fit.

Consideration categories: standard fit; long time without assignment; needs opportunity/financial support; new trainer; expertise not reflected in profile; client preference/prior relationship; availability/location advantage; fair distribution; Other. Record a short internal reason. Keep any professional client-facing recommendation separate so sensitive reasons are not disclosed.

A declined invitation triggers fresh suggestions. The coordinator/Sub-admin/Admin decides whom to approach. An uninvited appearance in a shortlist/pool must not affect trainer response history or performance.

## Client experience and exports

Clients receive only the approved shortlist. No trainer account is required for the private link. Candidate cards show professional introduction, relevant topics, experience, industry fit and approved supporting information. Include approved professional recommendations where applicable.

Hide internal suitability/performance grades, acceptance/decline history, personal consideration reasons, coordinator notes and client-contact records. Client selects a candidate; that selection is followed by the trainer's final confirmation.

Provide a private link, printable PDF and shareable image. Link/QR access is part of the desired shareable experience; automated QR rendering must be checked separately from the implemented SVG image export. Candidate changes invalidate approval and client access until reapproved. Previously downloaded files cannot be revoked; retain version attribution and superseded status where supported.

## Pre-session and post-session content

The rough draft should describe objectives, intended approach and proposed activities. The final plan should cover session flow/timings, methods, materials and assessment. Keep these text-first with optional external document links.

The post-session report should record what was delivered, duration/participant count, outcomes, challenges, recommendations and optional evidence shared with permission. It should be short enough for regular use. Coordinator review verifies delivery; the report's praise alone does not establish teaching quality.

Expert reviewers are suggested from relevant expertise and availability; the site offers three. Selection is by responsible Admin/Sub-admin. The review need not be conducted by the trainer's primary coordinator.

Quality/completeness and timeliness matter. Requested changes should be visible. Extensions by Coordinator/Sub-admin/Admin retain the original deadline, revised deadline, actor and reason in history where supported.

## Exact initial feedback forms

Both forms contain five multiple-choice questions plus one optional open comment. Simple five-point responses, with question-appropriate wording, and Unable to assess. Do not count Unable to assess as zero. Admin may edit future form versions; preserve the questions/options used for previous sessions.

### Audience questions

1. How clear were the trainer's explanations?
2. How relevant was the training to your needs?
3. How engaging was the session?
4. How useful were the examples and activities?
5. How confident are you about applying what you learned?

### Client questions

1. How well did the training meet the agreed objectives?
2. How well did the content suit the audience?
3. How effective was the trainer's delivery?
4. How well did the trainer manage the session and agreed requirements?
5. How satisfied are you overall?

Optional comment for both: What worked well, and what could be improved?

Trainer distributes the site-generated links; coordinators must not have to push them manually each time. Audience replies are anonymous and go directly to the site. Client and audience scores remain distinct. Trainers cannot change/delete replies. Record response count and expected batch size; low coverage is provisional.

## Dashboard specification

| User | Sections | Typical actions |
| --- | --- | --- |
| Trainer | Invitations; Assignments; Pending actions; My profile/ratings; My contributions | Respond, confirm, request changes, submit plans/reports, share feedback links, submit leads |
| Coordinator | Lead queue; Trainer coverage; Assignment coordination; Assigned reviews; My rating | Detail leads, accept/pass, invite, recommend, prepare revisions, review assigned submissions |
| Sub-admin | Team overview; Escalated leads; Approvals; Quality reviews; Allocation tracking | Handle passes, review registrations/revisions, approve within scope, manage selection and escalation |
| Admin | Overview; People/hierarchy; Approvals/exceptions; Performance/succession; Settings | Appoint roles, allocate coverage, approve tiers/exceptions, control rules, backup/restore/cleanup |
| Client | Private approved shortlist and feedback page | Compare, choose and provide feedback |

Dashboards are shared application pages showing authorised data, not separate stored websites for each person. Pending actions should show deadlines/overdue work. In-site reminders are the initial channel. Email/WhatsApp would require separate integrations; no continuous external notification service is assumed.

## Backup and space management

Keep trainer profiles, ratings, contribution totals/attribution and compact essential assignment history. Remove unnecessary old content only after safe backup and explicit Admin confirmation.

Eligible content can include original lead-message detail, superseded drafts, detailed feedback/comments and old notification detail. Active assignments are protected. Retain enough score/evidence summaries to explain grades. Detailed deleted content remains recoverable only from the retained backup, not magically from the live site.

Admin can preview eligible completed/closed records by cutoff date; create and download a verified backup; confirm cleanup; and restore a backup with explicit confirmation. External documents are links and remain at their provider. Local backup copies also consume space and may be removed after an offsite copy is confirmed. No silent scheduled deletion is required.

Storage should favour text, external CV/certificate/document links and no initial video/photo uploads. Database compaction reclaims pages in the current SQLite implementation. There is no approved fixed trainer-count/storage cap; limits must be verified on Sites.

## Initial defaults adopted for unresolved details

- Suitability uses the agreed seven weights and displays out of 10. A direct self-declared topic starts at 8 for its topic factor; reviewed topic expertise or verified delivery raises that factor to 10. Related topic matches require review and score at most 7. Age alone is never scored.
- Missing profile evidence makes recommendations provisional. Unspecified assignment factors redistribute weight. Required language and configured pooling mismatches exclude candidates; Admin/Sub-admin can configure requirement priority case by case. Thresholds are set at readiness approval, at least 7 except recorded Admin exceptions.
- Profile registration requires name, city and at least one topic. Supporting document links can be added later. The identity email comes from Google; phone and commercial details are entered separately.
- Performance A starts at 8, B at 6, C below 6. Three verified completions and two client responses are required. Missing data stays provisional, not zero. Audience scoring needs at least five responses or half the batch if fewer than ten participants.
- Coordinator preference uses five equal factors. Pass reason categories and activity timing inform the result. Values remain provisional until enough activity exists; ratings recommend candidates but do not appoint Sub-admins.
- Contributions retain separate attribution for original leads, duplicate submissions and added details. Initial readiness approval verifies the lead's contributions; contribution counts are separate from teaching performance.
- Plan/report reviewers score quality out of 10 and separately score verified outcomes. Crucial reviews need coordinator plus Admin/Sub-admin, averaged. Reviewer suggestions display expertise and workload; unknown expertise needs confirmation.
- Client links expire after seven days and close after selection. Revised candidates invalidate previous approval/link. Client profiles are frozen with the proposed shortlist. Internal consideration reasons are never included in client recommendations.
- Templates initially cover single-trainer, single-date assignments. Multi-day, multi-trainer, recurring programs need later extension. No cost or date is invented from an incomplete lead.
- Text and external document links keep storage low. Cleanup only compacts completed/closed records after a recent verified backup, preserving identities, contribution attribution, scores and audit records. SQLite compaction reclaims database pages. Local backups can be removed explicitly only after the Admin confirms an offsite copy.


## Current implementation and verification limits

The application is implemented on branch `feat/trainer-assignment-bridge` in `trainingsaurabh-oss/Trainer-Bank-Assignment-Selection-Allocation`. Its tested application baseline is `1c5364290f8f4bd14d3abfd08ee3b8dc4e4f8cf9`; the Sites handoff commit is `336c495905dc293e8655b6d31b48216393c28a44`.

Verified: 31 automated tests passed, including hierarchy/privacy, independent approvals, revisions, routing, matching, concurrent request preservation, feedback duplicate checks, restart persistence and backup/database compaction. Syntax checks passed. Desktop/mobile walkthrough exercised the core lead-to-booking/report/feedback journey, PDF/SVG export, with no page errors or mobile overflow. Docker build and production-mode health/access checks passed.

These tests do not establish a live Sites deployment or real Google-login success. Implemented role dashboards do not establish that every configurable policy screen or advanced categorisation is complete.

Outstanding or limited:

- Native Codex Sites runtime, database, authentication, hosted URL and restart persistence need assessment in a Sites-enabled conversation.
- Google sign-in is implemented but requires actual configuration and testing, unless adapted to native Sites authentication.
- Brief extraction is not an AI integration. Matching is deterministic rather than a semantic AI engine.
- Multi-day intervals, multiple trainers, recurring batches, payments, email/WhatsApp integration and stronger client/participant verification are not implemented.
- Advanced engagement/specialisation metadata, detailed review checklists, configurable grading rubrics and automatic QR/version-management features need feature-by-feature verification or extension.
- Reviewer recommendations cannot prove availability or expertise when the underlying data is absent; unknowns must remain explicit.
- Session feedback links and dashboard actions are implemented; precise scheduled-end delivery/background notification behaviour must be checked on the deployed runtime.
- Current auth sessions and OAuth state use server memory; restarting logs users out. Current shared records use a SQLite JSON-state row on local disk. Sites adaptations must preserve permissions and concurrency guarantees.

## Release acceptance criteria

Before declaring the whole site ready for community use:

1. Verify an actual native Sites HTTPS URL and document its supported limits.
2. Verify shared data across different users, browser sessions and redeployment/restart.
3. Verify sign-in and secure role/hierarchy boundaries; disable public demo switching.
4. Verify profile revision preserves approved data pending review.
5. Verify contribution merging, routing and pass escalation retain attribution.
6. Verify suitability explanations, thresholds and authorised overrides.
7. Verify standard/crucial approvals, proposer exclusion and approval reset.
8. Verify client selection, trainer confirmation and booking conflict protection.
9. Verify plan/report review counts, deadline extensions and feedback scoring.
10. Verify backup/restore/cleanup preserve trainers, ratings and essential history.
11. Report any incomplete requirement explicitly; never substitute a static mockup or browser-local data for the agreed shared workflows.

## Reference documents

- `docs/PRODUCT_SPECIFICATION.md`: original consolidated agreed requirements.
- `docs/DEFAULT_RULES.md`: initial defaults.
- `docs/IMPLEMENTATION_STATUS.md`: implemented capabilities and limits.
- `docs/SITES_HANDOFF.md`: runtime, schema, authentication, dependencies and continuation prompt.
- `docs/DEPLOYMENT.md`: current Sites deployment direction.

This complete specification is the discussion's product reference. Future changes should preserve decision history and identify which approved rule is being revised.
