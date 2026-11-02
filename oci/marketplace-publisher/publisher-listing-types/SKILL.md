---
name: publisher-listing-types
description: Use when a Marketplace publisher is unsure which listing type fits their offer, or wants to create a Lead Generation, Service, OCI Application, or AI Agent draft.
metadata:
  owner: sguleryuz
  last_updated: 2026-10-28
---

# Create a publisher listing

## Lead Generation OPN/OCMA advisory rule

For a Lead Generation task, follow the lead-generation skill's scoped rule: record and explain non-active or unknown OPN/OCMA status, but continue preparation, draft creation, and an authorized review-submission attempt. These checks remain pending or unknown; do not certify them as passed. The general readiness gates below do not create an additional assistant stop for these two checks in that flow. Respect authentication, target, permissions, required content, truthful attestations, and actual service rejection; do not bypass Oracle enforcement or accept agreements for the publisher. Other listing types and publication keep their applicable checks.

## Guide the publisher through the task

- Start from the requested outcome and current stage. Explain the short route to that outcome, then take the next available action. For inspection or advice, finish that request without starting creation or release checks.
- Ask one short question at a time for the next missing decision. Reuse answers and current evidence across skills. Discover resource IDs with scoped reads or Console navigation; do not require a publisher to know OCIDs, API field names, or listing types before helping them.
- Explain what the next action does and what result to expect. Perform authorized tool actions yourself; use a human handoff only for credentials, agreements, decisions, or capabilities you cannot operate. A documentation link supplements guidance; it does not complete the task.
- At a handoff, give the exact Console location or command, the field or action needed, and the result to look for. Request only the relevant non-secret status or error. After the publisher returns, inspect the result and resume the same listing/revision rather than restarting the intake.
- When blocked, preserve known IDs and completed work. Explain the specific blocker in plain language, guide its next remedy, and recheck before resuming. Stop dependent writes while authentication, permissions, required readiness, or an ambiguous result is unresolved; continue independent preparation when useful.
- Before a change, summarize the target, exact change, and effect in publisher language. Reuse approval already covering that action; ask again only for missing authorization or changed scope. Keep draft saving, Oracle review, and public/private publication distinct.
- After each completed stage, state what was verified and what comes next. At completion or a required pause, give the observed status, resource link/IDs when known, remaining blocker and owner, and the exact next action. Never label a handoff, request acknowledgment, or illustrative scenario as completed execution.

## Continue from an idea to the chosen workflow

- Accept a plain-language solution description. When a publisher does not know an answer, explain the remaining choices using their offering, then ask the question that distinguishes them; do not guess a commercial model or deployment artifact.
- For a recommendation-only request, explain the recommended customer experience and finish. When the publisher also requested creation, carry their confirmed answers into the selected listing workflow instead of ending at the recommendation or repeating the intake.
- For a package or listing type unavailable through the current tool, explain the supported Console route and guide it when browser tools are available and the publisher chooses that path. Otherwise give a specific handoff and resume after its result. Never promise an unsupported package or type conversion.

## Connect and act in the publisher account

Use the publisher's chosen Console or OCI CLI path to perform the requested operation when those tools are available. Reuse supplied account information and discover missing identifiers through authorized reads or Console navigation before asking the publisher for them. Choosing a listing type or explaining requirements needs no sign-in. Private reads and writes require the publisher's authorized account.

- **Console:** use the in-app browser when requested. Open the production [OCI Console](https://cloud.oracle.com/), guide the publisher to their tenancy and identity domain or identity provider, and let them complete password and MFA entry. Verify the signed-in tenancy, user, Ashburn region, and selected Publisher resources in the Console. A Marketplace public page does not establish Publisher access.
- **CLI:** use the publisher's explicitly selected profile. For a new session run `oci session authenticate --region us-ashburn-1 --profile-name <publisher-profile>` and let the publisher complete browser sign-in. Validate a session profile with `oci session validate --profile <publisher-profile> --auth security_token`. Include that profile, region, and `--auth security_token` on subsequent session-authenticated calls. Preserve an existing authorized API-key profile's authentication mode. Console login does not authenticate the CLI.
- **Target check:** compare the actual tenancy and resource publisher/compartment with the requested account, then make the operation-relevant read-only Publisher call. A profile name, successful login, or generic region read does not prove access to the listing. Resolve mismatches before any write. After a 401, refresh or reauthenticate the selected account; after a 403 or `NotAuthorizedOrNotFound`, check target and IAM evidence before continuing. Do not create users, switch to an operator account, or broaden IAM to make a test pass.

Carry out approved edits through the selected tools and verify saved values with a fresh read. Reuse authorization when it already covers the exact target and change; submission and publication require their own scope. If the necessary browser or CLI capability is unavailable, report that blocker and provide the next action without claiming execution. For bundle installation and sample prompts, see [Getting started](../references/getting-started.md).

## Choose with the publisher

Do not ask the publisher to pick a listing type before explaining the choices. Ask only the unanswered questions, one at a time:

1. What does the customer receive: software, a professional service, or an AI agent? What happens when they select **Get App**, **Contact Us**, or **Activate**?
2. If software: will the customer deploy an artifact in OCI, activate a paid SaaS subscription through a partner provisioning URL, or be sent to your site / submit a lead for a separate sale? If deployed, what artifact do you have: container image, Helm chart, compute image, or Terraform stack?
3. Is the offer free, BYOL, or paid through Marketplace? Where will it run, and which Oracle product does it actually integrate with? Ask these only when they distinguish the remaining options or affect the listing workflow.

Use the answers, not the product name or marketing category, to select the workflow:

| Offer | Listing type and details to collect |
| --- | --- |
| Software promoted through a redirect or lead form, without Marketplace deployment or subscription activation | [Lead Generation](https://docs.oracle.com/en-us/iaas/Content/Marketplace/Tasks/creating-lead-generation-listing.htm): Oracle product, category, pricing choice, and how **Get App** should redirect or capture a lead. Use [lead-generation-listing](../lead-generation-listing/SKILL.md) for the draft. |
| Professional service such as consulting, training, or implementation | [Service](https://docs.oracle.com/en-us/iaas/Content/Marketplace/Tasks/creating-service-listing.htm): product, industry focus, service type, office locations, contact instructions, and customer success material where applicable. |
| Software deployed from a Marketplace package, or paid SaaS activated through Marketplace | [OCI Application](https://docs.oracle.com/en-us/iaas/Content/Marketplace/Tasks/creating-oci-application-listing.htm): package type, artifact or SaaS provisioning URL, pricing model, terms, and market availability. |
| AI agent for Oracle Fusion and OCI workflows | [AI Agent](https://docs.oracle.com/en-us/iaas/Content/Marketplace/Tasks/creating-ai-listing.htm): use the AI Agent-specific Console workflow and its required agent details. Do not treat it as a generic OCI Application package. |

If an offer combines software and services, ask which customer action the listing must support first; explain when separate listings may better represent the two offers. If the publisher says “SaaS” but does not want a Marketplace subscription, distinguish an external redirect/lead from paid SaaS activation before recommending a type. A software offer running on OCI is not automatically a Compute Image package. Do not choose a package merely because the publisher has no artifact yet; ask whether they intend to prepare one or want lead capture instead.

Give a short recommendation in plain language: the type and package (if any), what the customer will do, the closest alternative and why it fits less well, and any unanswered fact that could change the answer. Ask the publisher to confirm the recommendation before moving to creation. If they already have a draft of another type or package, inspect it first and do not promise an in-place conversion; explain the supported route or confirm a new listing is needed before taking action.

For Lead Generation and Service listings, do not assume a deployable package. For OCI Application listings, Oracle documents Container Image, Helm Chart, Compute Image, Terraform Stack, and SaaS; Oracle's guide says SaaS is paid and uses a partner provisioning URL. Verify any CLI or API package value against the installed model before use. Complete package upload, artwork, terms, and attachments through the documented workflow. If a listing type is unavailable in the publisher's Console, check account approval and ask Oracle Support to enable the type rather than substituting another type.

Before creation, confirm active OPN and OCMA, approved Publisher registration, Ashburn subscription, and the user's IAM access; [publisher-onboarding](../publisher-onboarding/SKILL.md) provides the full checks when installed together. Check for an existing listing. Collect the internal listing name, compartment OCID, and type-specific revision metadata from the publisher. Show the exact listing type, package format if applicable, and public text before creating resources. Use the production Console or documented CLI/API operations. Save the listing OCID. If draft creation fails, report it so the publisher can resume without creating a duplicate.

For an existing listing, list revisions first. Edit an active draft; if a revision is already published, clone it through [listing-revision-publish](../listing-revision-publish/SKILL.md). Do not create a duplicate draft. After creation, re-read the revision and report its OCID and status. Inspect assets in the Console and compare them with the listing-type guide before review; an empty attachment or package inventory is not a completed guideline check.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/Marketplace/Tasks/creating-lead-generation-listing.htm
- https://docs.oracle.com/en-us/iaas/Content/Marketplace/Tasks/creating-service-listing.htm
- https://docs.oracle.com/en-us/iaas/Content/Marketplace/Tasks/creating-oci-application-listing.htm
- https://docs.oracle.com/en-us/iaas/Content/Marketplace/Tasks/creating-ai-listing.htm
- https://docs.oracle.com/en-us/iaas/Content/Marketplace/Tasks/clone-listing.htm
