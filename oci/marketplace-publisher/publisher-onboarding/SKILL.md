---
name: publisher-onboarding
description: Use when a new or existing Oracle Marketplace partner needs to confirm publisher onboarding before creating listings.
metadata:
  owner: sguleryuz
  last_updated: 2026-10-28
---

# Publisher onboarding

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

## Guide onboarding to the next usable stage

- Ask whether the publisher is new or already has Marketplace listings only if unknown. Explain OPN as Oracle PartnerNetwork membership and OCMA as the Marketplace agreement when first needed. Check the existing Publisher Profile before proposing registration.
- Work through applicable checks in dependency order using evidence already available. For missing membership, agreement activation, registration, region, or access, guide that specific step using the matching Oracle source below; do not present the entire checklist as homework.
- For registration, help collect the required organization and tenancy information, navigate to Publisher Registration, and review it with the publisher. Hand agreement acceptance to the publisher and verify the subsequent status. Submitted or renewing remains pending until the required approval is observed.
- When Oracle, Partner Assistance, or an administrator must act, identify who owns the next step and the non-secret information they need. Prepare a request if asked; sending it requires explicit authorization. Preserve a resumable checklist instead of promising approval or unattended monitoring.
- Once the requested readiness stage is confirmed, continue the publisher's original listing task through the relevant skill. If the request was only a readiness check, finish with the result and next action without creating resources.

## Connect and act in the publisher account

Use the publisher's chosen Console or OCI CLI path to perform the requested operation when those tools are available. Reuse supplied account information and discover missing identifiers through authorized reads or Console navigation before asking the publisher for them. Choosing a listing type or explaining requirements needs no sign-in. Private reads and writes require the publisher's authorized account.

- **Console:** use the in-app browser when requested. Open the production [OCI Console](https://cloud.oracle.com/), guide the publisher to their tenancy and identity domain or identity provider, and let them complete password and MFA entry. Verify the signed-in tenancy, user, Ashburn region, and selected Publisher resources in the Console. A Marketplace public page does not establish Publisher access.
- **CLI:** use the publisher's explicitly selected profile. For a new session run `oci session authenticate --region us-ashburn-1 --profile-name <publisher-profile>` and let the publisher complete browser sign-in. Validate a session profile with `oci session validate --profile <publisher-profile> --auth security_token`. Include that profile, region, and `--auth security_token` on subsequent session-authenticated calls. Preserve an existing authorized API-key profile's authentication mode. Console login does not authenticate the CLI.
- **Target check:** compare the actual tenancy and resource publisher/compartment with the requested account, then make the operation-relevant read-only Publisher call. A profile name, successful login, or generic region read does not prove access to the listing. Resolve mismatches before any write. After a 401, refresh or reauthenticate the selected account; after a 403 or `NotAuthorizedOrNotFound`, check target and IAM evidence before continuing. Do not create users, switch to an operator account, or broaden IAM to make a test pass.

Carry out approved edits through the selected tools and verify saved values with a fresh read. Reuse authorization when it already covers the exact target and change; submission and publication require their own scope. If the necessary browser or CLI capability is unavailable, report that blocker and provide the next action without claiming execution. For bundle installation and sample prompts, see [Getting started](../references/getting-started.md).

Identify whether the publisher is a **new partner** or an **existing partner**. For an existing partner, determine whether listings are already visible or migration is needed. Use the matching Oracle guide: [new partners](https://docs.oracle.com/en-us/iaas/Content/Marketplace/new-partners.htm) or [existing partners](https://docs.oracle.com/en-us/iaas/Content/Marketplace/existing-partners.htm). Report each applicable item as **confirmed**, **pending**, or **unknown**, with the evidence or the person who confirmed it. Never turn an unknown into a confirmation merely because an API returns a publisher record.

## Checks for both paths

1. Confirm the partner has a verified Oracle account and an OCI tenancy. Record the tenancy OCID and the intended publisher compartment OCID; do not request credentials.
2. Confirm **active OPN membership** and its OPN Company ID or number against partner records. An application or renewal in progress is pending, not confirmed. Direct uncertainty to [Partner Assistance](https://partnerhelp.oracle.com/).
3. Confirm the **Oracle Cloud Marketplace Agreement (OCMA) is approved and active** for that OPN entity. Acceptance or submission alone is pending until activation is confirmed. The [Publisher FAQ](https://docs.oracle.com/en-us/iaas/Content/Marketplace/faq-publisher.htm) describes first-time application, renewal, and confirmation email. Do not accept terms on the publisher's behalf.
4. Confirm the tenancy is subscribed to `us-ashburn-1`; the publisher must select that region to create or edit Publisher resources. A missing subscription is pending. An available read-only tool may support this check.
5. Confirm the publisher registration was submitted in the production OCI Console and its **Publisher Profile shows Approved**. A returned publisher ID or a submitted registration does not by itself establish approval. If an API status and Console status differ, report both and leave the check pending until resolved.
6. Confirm the publisher's OCI user has the required Marketplace Publisher IAM access using [publisher-iam](../publisher-iam/SKILL.md). Policy text alone does not prove effective access; ask an administrator to confirm group membership and scope, or verify an authorized read-only Publisher operation.

For **any paid listing**, confirm the applicable paid-listing agreement and supplier setup before publication. Oracle says a publisher can start creating a draft while supplier verification is pending. For a **paid package listing or private offer**, also confirm that the OPN membership and Marketplace agreement match the required U.S. legal entity and that the paid-offer banking requirements are met. Do not apply the U.S. domicile restriction to a non-package listing solely because it is a Lead Generation or Service listing. See [Becoming an OCI Partner and Publisher](https://docs.oracle.com/en-us/iaas/Content/Marketplace/become-oci-partner.htm).

## New partner path

Follow [Oracle's new-partner onboarding](https://docs.oracle.com/en-us/iaas/Content/Marketplace/new-partners.htm): complete partner enrollment and the checks above, then use **Marketplace → Publisher → Publisher Registration** in the production OCI Console. Confirm the OPN number used in registration matches the active membership and that the registration is approved. If no approved publisher is found, keep registration and approval pending and stop listing creation.

## Existing partner migration path

Confirm the partner's OPN and OCMA remain active and that the intended OCI tenancy is ready. Follow [Oracle's public existing-partner guide](https://docs.oracle.com/en-us/iaas/Content/Marketplace/existing-partners.htm) for migration; it says no legacy Partner Portal step is required. Check Publisher Registration in the production OCI Console before preparing a migration request. If an approved profile already exists, do not register again. If registration is missing, complete the [documented Publisher Registration flow](https://docs.oracle.com/en-us/iaas/Content/Marketplace/become-oci-partner.htm) first. If the OPN number is already associated with another publisher account, ask the tenancy administrator to verify access rather than retrying registration. Do not direct an external publisher to a staging Console.

If migration is needed, confirm that the partner has provided **partner name, OPN number, and tenancy OCID** to Oracle Marketplace as described in the [existing-partner guide](https://docs.oracle.com/en-us/iaas/Content/Marketplace/existing-partners.htm). Do not send the email yourself unless the publisher explicitly authorizes it. Confirm migrated listings are visible under **Marketplace → Publisher → Listings** in the root compartment; if not, keep migration pending.

## Completion

Show the checklist with evidence and the next action for each pending or unknown item. Say **ready to create listings** only when every applicable common check and path check is confirmed. Supplier verification may still be pending for a paid draft; label the draft as **not ready to publish** until commercial setup is confirmed. For existing partners, confirm that migrated listings are visible before editing them. OCMA activation and migration require publisher or Oracle evidence.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/Marketplace/new-partners.htm
- https://docs.oracle.com/en-us/iaas/Content/Marketplace/existing-partners.htm
- https://docs.oracle.com/en-us/iaas/Content/Marketplace/become-oci-partner.htm
- https://docs.oracle.com/en-us/iaas/Content/Marketplace/faq-publisher.htm
