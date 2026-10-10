# Initial operating defaults

These defaults implement the user's approval to keep unresolved details simple and adjustable. The agreed specification governs where it gives a more specific rule.

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

## External integrations

Google OAuth is implemented but requires a configured web client and public origin. Demo accounts exist only with DEMO_MODE=1. Dashboard deadlines/reminders require no external messaging provider. Email, WhatsApp and AI brief extraction are not integrated.

No public hosting was provisioned. The repository supplies Docker and a Render persistent-disk blueprint. The Render plan is paid; provisioning requires separate approval of charges. No continuous monitoring service is configured.
