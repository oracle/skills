---
name: marketplace-publisher
description: Use when routing an Oracle Marketplace publisher request to onboarding, IAM, listing creation, lead generation, or revision publication guidance.
metadata:
  owner: sguleryuz
  last_updated: 2026-10-28
---

# OCI Marketplace Publisher

Use this router for publishers working in their own production OCI tenancy through the Console or OCI CLI. For installation, sign-in, access checks, and example prompts, read [Getting started](references/getting-started.md). Read only the focused skill needed for the task. Each skill includes Oracle sources. The standalone skills use documented Console or CLI/API operations and do not require the Marketplace Publisher MCP fork.

## Guide the publisher through the task

- Start from the requested outcome and current stage. Explain the short route to that outcome, then take the next available action. For inspection or advice, finish that request without starting creation or release checks.
- Ask one short question at a time for the next missing decision. Reuse answers and current evidence across skills. Discover resource IDs with scoped reads or Console navigation; do not require a publisher to know OCIDs, API field names, or listing types before helping them.
- Explain what the next action does and what result to expect. Perform authorized tool actions yourself; use a human handoff only for credentials, agreements, decisions, or capabilities you cannot operate. A documentation link supplements guidance; it does not complete the task.
- At a handoff, give the exact Console location or command, the field or action needed, and the result to look for. Request only the relevant non-secret status or error. After the publisher returns, inspect the result and resume the same listing/revision rather than restarting the intake.
- When blocked, preserve known IDs and completed work. Explain the specific blocker in plain language, guide its next remedy, and recheck before resuming. Stop dependent writes while authentication, permissions, required readiness, or an ambiguous result is unresolved; continue independent preparation when useful.
- Before a change, summarize the target, exact change, and effect in publisher language. Reuse approval already covering that action; ask again only for missing authorization or changed scope. Keep draft saving, Oracle review, and public/private publication distinct.
- After each completed stage, state what was verified and what comes next. At completion or a required pause, give the observed status, resource link/IDs when known, remaining blocker and owner, and the exact next action. Never label a handoff, request acknowledgment, or illustrative scenario as completed execution.

| Request | Skill |
| --- | --- |
| Confirm OPN, OCMA, registration, approval, tenancy, or migration readiness | [publisher-onboarding](publisher-onboarding/SKILL.md) |
| Inspect policies or diagnose Publisher permissions | [publisher-iam](publisher-iam/SKILL.md) |
| Choose a listing type, including AI Agent, and create its first draft | [publisher-listing-types](publisher-listing-types/SKILL.md) |
| Create or inspect a Lead Generation draft | [lead-generation-listing](lead-generation-listing/SKILL.md) |
| Edit, clone, submit, publish, or withdraw a revision | [listing-revision-publish](listing-revision-publish/SKILL.md) |

For a first listing, use onboarding, IAM, and the listing type or Lead Generation skill. Carry the publisher's goal, answers, evidence, account, and resource IDs into each focused skill; continue the requested task instead of returning only a link to another skill. For an existing listing, inspect revisions before editing. Use documented Console, CLI, or API paths for supported operations. Registration, agreements, artwork, attachments, and package assets require the appropriate Oracle or Console workflow.

For Oracle Marketplace service support, direct publishers to [Oracle Support](https://support.oracle.com/). For corrections to these skill instructions, use [oracle/skills issues](https://github.com/oracle/skills/issues).

## Sources

- https://docs.oracle.com/en-us/iaas/Content/Marketplace/new-partners.htm
- https://docs.oracle.com/en-us/iaas/Content/Marketplace/existing-partners.htm
- https://docs.oracle.com/en-us/iaas/Content/Marketplace/manage-listings.htm
