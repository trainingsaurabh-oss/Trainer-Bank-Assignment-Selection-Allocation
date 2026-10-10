# Intended deployment: Codex Sites

The user requires a native Codex Sites hosted URL. Render is not the intended host. No external paid service should be provisioned without an explicit explanation of an actual Sites limitation and approval for charges.

## Current session limitation

The callable tool inventory contains no Sites tool, no site deployment/publishing tool, and no tool-search capability for loading one. Cloud and executor skill catalogs contain no Sites skill. The cloud catalog exposes only cloud-environment-onboarding:setup; the executor catalog is empty.

Cloud-environment configuration draft publication is development-environment snapshot publication. It does not deploy a native Sites website. The Sites plugin is not listed among this session's recommended installable plugins, so a plugin installation request cannot be made through that mechanism.

This does not establish that Codex Sites lacks backend, storage, or authentication capabilities. Those capabilities must be read from the Sites skill and verified with Sites tools in a Sites-enabled conversation. Do not substitute assumptions from other hosts.

## Transfer

See [SITES_HANDOFF.md](SITES_HANDOFF.md) for the repository, continuation prompt, runtime requirements, compatibility checks, and verification checklist. The application source and existing functionality are preserved.

No Sites URL has been created or verified in this session. The earlier Render secret requirement is unnecessary for this intended deployment; no Render API key should be entered. The draft tool cannot remove individual secret requirements; that optional declaration can be removed in environment settings.

An optional Render document and blueprint remain in the repository to preserve prior configuration work, but they are not the default deployment instructions.
