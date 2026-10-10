# Implementation status

This file distinguishes executable features from requirements that need more refinement or integration.

## Implemented

The Node/SQLite service implements authenticated role-scoped JSON APIs and shared persisted application records. It includes explicit local demo accounts, production Google OAuth authorization-code flow with PKCE, registration/revision approval, lead contribution merging, round-robin routing and pass escalation, assignment readiness approval, invitation responses, shortlist and independent approvals, client choice, final confirmation, booking conflict checks, plan/report submissions and reviews, configurable feedback forms, and backup/cleanup/restore.

The UI and automated verification results are described in the final handoff; do not infer deployment from this document.

## Initial defaults approved in discussion

A/B/C thresholds are 8/6 out of 10; minimum performance eligibility remains three verified completions with two client responses. Coordinator factors use equal weights. Missing performance inputs remain provisional. Document links replace uploads. External notifications are not enabled; dashboard reminders are the initial channel.

## Remaining limitations

- Google sign-in must be tested with actual OAuth credentials and the final public origin.
- Codex Sites is the selected host. No Sites tools or skill are present in this session; native hosting, shared storage and authentication support remain unassessed. Deployment artifacts do not constitute a live deployment.
- Feedback tokens are private bearer links; forwarding does not independently prove a client's identity. Audience duplicate prevention is best-effort, not a verified attendance roster.
- Topic similarity is deterministic matching, not an AI semantic engine. Related expertise still needs human review. Original-brief extraction is not an external AI integration.
- Multi-day date intervals, multiple trainers per assignment, recurring batches, payments and email/WhatsApp integrations are not implemented.
- Seniority recommendations and coordinator succession require human approval; no automatic appointment.
- Backups contain personal data and document links and require secure storage. External documents themselves are not backed up.
- A downloaded PDF/image cannot be revoked. Version records can mark exports superseded, but recipients may retain old copies.
- Cleanup compacts record content and runs SQLite vacuum/checkpoint to reclaim pages. Backup files are separate and require explicit removal after offsite storage.
- Live processes and sessions do not survive machine restarts; stored application records do.

## Validation

Automated tests cover workflow, privacy, independent approval, concurrent request preservation, persistence after restart, feedback duplication, backup safeguards, and database compaction. Desktop/mobile browser verification and a Docker build were also performed. Actual Google login, public URL, and cloud restart persistence remain unverified without deployment credentials.
