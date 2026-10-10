# Open decisions

These items require decisions or technical validation before the corresponding feature is considered complete. See PRODUCT_SPECIFICATION.md for agreed requirements.

## Product rules

1. Profile: required versus optional initial fields; detailed-profile timing; controlled topic/style/industry lists; age-bracket options and access.
2. Coverage: coordinator capacity approval, zone boundaries, in-person lead ownership with multiple coordinators, and fallback when a zone has no coverage.
3. Rating scope: who may see candidate ratings across zones during matching and reviews without breaking hierarchy restrictions.
4. Matching: exact factor rubrics and evidence confidence, taxonomy mapping, missing-data handling, minimum information for a meaningful score, and interaction between default language filtering and case-specific requirement controls.
5. Assignment detailing: exact fields and readiness checklist; confirmation of extracted facts; templates and automatic rules; conversion from lead to assignment.
6. Approvals: disagreement/rejection flow; unavailable approvers; Admin involvement in standard initial approval; permissions for classifications and exceptions.
7. Deadlines: invitation response, clarification, client decision, booking confirmation, overdue escalation, and reminder cadence.
8. Exceptions: cancellations, replacements, client rejection of all candidates, urgent bookings, recurring/multi-session engagements, multiple trainers, and repeated batches.
9. Performance: A/B/C thresholds, precise scoring rubrics, verified-outcome evidence, partial/missing feedback treatment, minimum audience responses, comparative cohort size and period.
10. Seniority: criteria for each tier, verification checklist, review cadence, downgrade appeal, and protection against erroneous evidence.
11. Coordinator preference: factor weights, pass categories and points, workload evidence, review period, comparative fairness, and succession eligibility.
12. Community contribution: useful-lead definition, duplicate credit, attribution, invalid/spam submissions, and how contribution recognition is displayed.
13. Plans/reports: form fields, evaluation checklists, score disagreement handling, reviewer conflicts, and who validates extension reasons for grading.
14. Client sharing: visible fields, fee visibility, link expiry/security, identity verification, export layout, and selection confirmation.
15. Feedback: audience duplicate prevention and coverage; client-response authenticity when trainer forwards the link; form scale labels and scoring across versions.
16. Permissions: exact role matrix, independently delegated Sub-admin rights, edits across reporting hierarchies, role removal, and audit access.
17. Privacy: consent, document-link accessibility, sensitive consideration reasons, data retention, deletion/export rights, and notification retention.

## Build and deployment

- Agree the first release scope rather than assuming every documented feature launches together.
- Choose the application framework, database, and background-job approach.
- Validate a permanent public hosting option; Codex development access does not establish production hosting.
- Establish actual storage limits, budget, backups, and expected trainer/session volumes.
- Configure Google sign-in, approved domains, and bootstrap the first Admin securely.
- Confirm notification channels; dashboard notifications are agreed, email/WhatsApp delivery requires further setup.
- Decide whether brief extraction is structured parsing or an external AI service, including cost and data handling.
- Define useful functional tests for registration, permissions, routing, approval resets, scoring, booking conflicts, and feedback.

## Recommended next discussion

Define the exact suitability rubric for each of the seven weighted factors. The categories and percentages are agreed, but a repeatable scoring method is still needed before reliable automatic recommendations can be built.
