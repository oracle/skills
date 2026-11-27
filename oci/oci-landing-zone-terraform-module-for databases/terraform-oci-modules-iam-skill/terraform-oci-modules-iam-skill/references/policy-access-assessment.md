# Assess existing DB access before adding policies

Use for DB policy access checks and grant requests, including natural-language requests for provisioning permissions, supplied grant statements, and requested policy templates. Explicit group membership additions/removals use [group-membership.md](group-membership.md); they do not independently authorize policy generation. For combined membership-and-policy requests, assess the policy portion here without dropping requested membership work when the group's permissions are already covered. The scope is the named principal's IAM access for the stated operation. It is not a guarantee that provisioning will succeed or an assessment of every group to which a particular user belongs. Never test access by creating, updating, or deleting an OCI resource.

## 1. Establish the requested operation and targets

For policy grant reductions, statement removals, named policy deletions, or analysis of their effects, use [policy-revocation.md](policy-revocation.md). It reuses this reference's evidence gathering and semantic interpretation, but defines its own proposal, confirmation, and residual-access outcomes. The grant-action table and generation instructions here do not authorize revocation edits.

When dynamic-group creation or rule changes are also requested, apply [dynamic-group-matching-rules.md](dynamic-group-matching-rules.md) to that portion separately. Covered policy access does not cancel pending group work. A policy-only request does not authorize changing the dynamic group's matching rule.

Reuse the conversation, read-only project context, and OCI lookups. Ask only for missing or ambiguous information:

- DB service, resource type, and operation. "Provision ExaDB-D" alone does not specify whether to create infrastructure, a VM cluster on existing infrastructure, a DB Home, a database, or several of these. Ask: **"Which ExaDB-D resource should this group be able to provision, and in which compartment?"** Ask only the unanswered part when one is already known. Do not expand provisioning into general lifecycle administration.
- Target compartment for each requested resource. Resolve names to exact OCIDs or an explicitly requested new compartment's configuration key; distinguish identical names under different parents.
- Exact group and identity domain, or another explicitly requested principal type. Resolve its identifier and policy subject syntax; do not assume an unqualified name belongs to the default domain or conflate similarly named groups. The MCP caller's privileges are not evidence of the target group's privileges.
- Existing parent resources and dependency compartments that affect authorization. For example, a VM cluster can use infrastructure or a network in a different compartment. Ask about optional features only when they change required permissions. Do not collect unrelated database sizing or deployment inputs.

A missing existing group or compartment is not permission to create it. Resolve the target with the user unless creation was already requested. For explicitly requested new groups or compartments, distinguish projected access after creation from current access. Use verified existing ancestor policies and supported module dependency references to assess the intended scope; do not fabricate OCIDs or treat proposed Terraform as deployed. If projected coverage cannot be established, use the unverified outcome below.

## 2. Derive the permission requirements

Consult current Oracle documentation for the exact service and operations. Build a compact requirements table: operation, required permission/resource type, principal, target/dependency scope, and applicable conditions. Include documented discovery/read and cross-resource permissions needed for the requested workflow. Distinguish group grants from any separately required OCI service-principal grants.

Use the ExaDB-D policy reference below for ExaDB-D; do not substitute ExaDB-C@C or Exascale permissions. Do not copy a generic full-admin example as the answer. If required permissions or dependency scopes are uncertain, resolve them before classifying coverage. The user supplies intent and resource information; the agent derives policy syntax.

## 3. Inspect live policies through read-only OCI MCP

- Discover the available `get_oci_command_help` and `run_oci_command` tools. Confirm syntax with help before each new command shape, then use only read operations. Pass command text after `oci`; do not include `oci`, `--profile`, `--auth`, or `--help`, and never fall back to the shell OCI CLI.
- Resolve the tenancy context, group/domain identifiers, target compartments, and their parent chains. Use the IAM home-region context where required. If the server context cannot read the relevant tenancy/region, report that limitation rather than changing authentication or claiming no policy exists.
- List policies attached to each target compartment, every ancestor up to the tenancy, and the corresponding chains for dependency compartments. Deduplicate shared ancestors. Fetch all pages and the complete statements; listing names or only the first page is insufficient. Confirm `iam policy list` syntax through MCP help; use its documented pagination mechanism, such as `--all`, when available.
- Inspect actual statements, not policy names or textual group-name matches alone. Keep each policy's OCID/name, attachment compartment, and the statements used as evidence. A policy attached at the tenancy may be scoped to just one child compartment; attachment alone does not establish its grant scope.
- Include applicable allow and deny statements. A deny can override an allow when the tenancy's deny feature applies. Do not activate, disable, remove, or weaken deny controls as part of this flow.
- Missing tools, failed or forbidden reads, incomplete pagination, unresolved identifiers, or insufficient visibility leave the affected coverage unverified. An empty successful listing is evidence only for that inspected attachment scope. Local Terraform/state can inform ownership and configuration comparison, but cannot replace live policy inspection or by itself establish which current file edits have been applied.

## 4. Compare effective coverage for the stated operation

Evaluate the exact principal, statement target, inherited scope, resource-family expansion, verb/permission coverage, and conditions. Combine applicable statements across policies; permissions need not all appear in one policy. Evaluate applicable denies and any documented exceptions before declaring access covered. Use current Oracle condition semantics: an unresolved condition is not an unconditional grant.

Record each requirement as **covered**, **missing**, **unverified**, or **denied**, with the policy evidence or the specific gap. "Missing" requires a sufficiently complete inspection of every relevant policy scope and condition to establish that no applicable grant covers that requirement. For projected access to explicitly requested new resources, label the evidence and findings as projected, never as current effective access.

### Separate live access from configuration evidence

Before concluding that no configuration work is needed, inspect relevant configuration already in scope when available. Do not search unrelated projects or require a Terraform directory merely to answer a current-access question. A live-access finding and a configuration finding are separate: unknown apply history does not change verified live coverage to "unverified".

- Compare an exact managed policy only after establishing the correct project/backend/workspace, target identity and ownership, selected module ref, effective inputs, and any template-generated statements. A statement missing from one file is not sufficient evidence that the effective configuration removes it. If the mapping or inputs cannot be established, report that the comparison is unresolved; ask for context only when needed for the requested configuration outcome.
- When a relevant difference is established, report what OCI grants now and what the inspected configuration expresses. Do not call the difference a pending removal, unapplied edit, or drift without supporting evidence. It may reflect different inputs/context or a change whose deployment history is unknown. A state entry establishes tracking, not proof that current file contents were applied; file presence, timestamps, Git differences, and missing local state are also insufficient by themselves.
- Label a change unapplied only when explicit user confirmation or reliable deployment evidence tied to that exact configuration/environment establishes it, with no conflicting evidence. Follow `lifecycle-safety.md` for target classification; an unapplied edit to a managed policy does not make the policy a new draft. Any expected effect after applying the inspected configuration is a conditional assessment, not an executed Terraform plan or proof of deployment history.
- If a material discrepancy conflicts with the requested configuration outcome and its meaning or desired handling is unclear, report it and ask only for the missing clarification before editing that portion. For example, after establishing the comparison: "OCI currently grants this access, but this project's configuration omits it. Has this configuration version been applied, and should this configuration preserve the grant?" Reuse clear intent/evidence already supplied; do not ask again merely because a difference exists.
- A current-access-only question ends with the verified live result and any relevant observed discrepancy/comparison limitation; it does not require resolving apply history or authorize edits. For configuration work, preserve files until the intended handling is established. Do not silently undo an edit, duplicate a live policy, or adopt an unmanaged policy. An explicitly requested or clarified correction to the existing definition uses the ownership/support checks and the correction path below; any grant reduction/removal also requires `policy-revocation.md` confirmation.

| Overall result for one requested operation | Required action |
| --- | --- |
| Every requirement is covered in the assessed live or explicitly projected scope, with applicable conditions and denies resolved | Label coverage as current or projected; generate no duplicate grants. Apply the configuration-evidence checks above before declaring an in-scope configuration needs no work. Surface material discrepancies separately and clarify desired handling when necessary. Request no policy-generation-only inputs unless a specific configuration correction is requested or chosen; continue independently requested new-resource work. |
| Some or all requirements are confirmed missing; none are unverified or denied | For a grant request, derive additions for the missing requirements only, then enter the normal generation workflow. For a check-only request, report the gaps without writing files. |
| Any requirement remains unverified | Explain the known coverage and missing evidence. Request the specific identity, scope, condition context, or corrected read access needed, then reassess. Do not emit a speculative policy block or label unknown permissions missing. |
| An applicable deny blocks a required action | Identify the denying policy and explain that another allow will not resolve it. Stop grant generation for that operation; changing the deny requires a separate, explicit request and support/lifecycle checks. |

If several independent operations were requested, assess each separately. Do not present additions for one operation as completing another that is unverified or denied. The generic "MCP unavailable: continue without MCP validation" rule does not waive this assessment.

## 5. Generate only justified additions or authorized configuration corrections

For confirmed permission gaps in a grant request:

- Form complete statements for the resolved principal and scopes using documented permissions and conditions. Avoid adding covered permissions, unrelated service access, or broader lifecycle rights. Where a verb bundles more than the requested access, use documented constraints when supported; otherwise explain the excess and resolve the intended scope before emitting it.
- Use the policies module's direct `supplied_policies` configuration for agent-derived statements, after verifying the selected upstream ref. "Supplied" means supplied to the Terraform module; it does not mean the human must author the statements.
- If the user supplied statements, check them through the same assessment. Explain redundant statements and omit them from additions; preserve the exact text of statements that are needed and in scope. If a statement must be narrowed or rewritten, show the proposed correction and resolve the intended scope with the user before emitting the changed statement. Do not silently broaden it.
- Use upstream templates only when requested. Inspect their emitted grants, defaults, and toggles against the assessed gaps. Do not emit a template that duplicates covered grants or introduces unrelated permissions; explain the mismatch and propose the scoped direct statements instead.
- Determine the policy attachment compartment separately from the grant targets. Reuse an appropriate established project convention; otherwise explain the proposed placement and resolve any missing organizational requirement. For dependencies in other compartments, choose a valid attachment scope or separate policies without widening the grants.
- Reuse a matching local definition instead of adding a duplicate. Establish its classification and the meaning of any live/configuration difference through the checks above. A confirmed new unapplied policy represents planned access, not live access; it needs no prior state entry, while edits to managed policies retain ownership checks. A matching definition of unknown apply status is not proof of either live access or a new draft.

For live access that is covered but a verified in-scope configuration discrepancy has an explicitly requested or clarified correction, update only the eligible existing definition to match that intent. The justification is the identified configuration correction, not a fabricated missing live permission. Show the exact correction and its conditional effect; do not create a duplicate policy or import/adopt a live policy as a workaround. If the user chooses to retain the inspected configuration, leave it unchanged and report the live/configuration distinction. A request to complete a removal follows `policy-revocation.md`.

For either generation path, collect only remaining metadata and documented options needed for the requested edit, then apply normal validation and generation. Grant-only additions and clearly authorized corrections need no repeated permission prompt merely to write the requested configuration once scope is established. Any removal or narrowing of existing/configured grants must also follow `policy-revocation.md` and its confirmation gate; an overall grant request does not bypass that gate. Never modify an existing OCI policy's configuration without the authorization and ownership checks required by `SKILL.md`.

In the handoff, show the requested operation/principal/scopes, live coverage findings, configuration evidence and its limits, and the purpose of each addition or authorized correction. Distinguish current access, confirmed versus unknown deployment status, and conditional effects of applying configuration. Report actual checks performed and remaining limitations; this is a policy analysis, not an executed Terraform plan, OCI authorization simulation, or provisioning test. Provide Terraform commands only when configuration was generated.

## Decision examples

| Request or evidence | Expected flow |
| --- | --- |
| "Let this group provision ExaDB-D in abc." | Resolve the group and ask which resource type unless already established; ask about abc only if it cannot be uniquely resolved. Inspect applicable policies before drafting additions. |
| "Let ops provision a VM cluster in abc" with infrastructure/network in other compartments | Include those dependency scopes and their policy ancestor chains in the comparison. |
| Required grants are inherited from a tenancy policy | Explain existing coverage; generate no duplicate compartment policy. |
| DB permissions are covered, but required subnet permissions are confirmed missing | Generate only the scoped missing network grant, not another full DB policy set. |
| Listing a parent compartment's policies returns forbidden | Mark affected coverage unverified; do not infer missing permissions or generate speculative additions. |
| An allow matches the resource type but its condition cannot be evaluated | Resolve the condition context or report unverified; do not report covered. |
| A relevant deny overrides a matching allow | Report denied; do not try adding another allow. |
| "Can this group create a database in abc?" | Assess and explain coverage/gaps; generate no Terraform from a read-only question. |
| Live access is covered; a verified in-scope configuration omits the grant, with unknown apply history | Report current coverage and the observed difference separately. For configuration work, clarify intended handling before editing; do not label it a pending removal. |
| A statement is absent from one file, but effective variables/template outputs or workspace mapping are unknown | Report comparison unresolved; do not infer a deletion or invalidate verified live access. |
| User confirms the relevant removal is unapplied and explicitly asks to restore that grant in its managed definition | Make only the authorized correction after ownership/support validation; do not add a duplicate live grant. |
| User chooses to keep the inspected configuration, or asks only about current access | Leave files unchanged; report current access and any supported conditional future effect without claiming a plan was run. |

## Authoritative references

- [ExaDB-D resource, verb, and API permission details](https://docs.oracle.com/en/engineered-systems/exadata-cloud-service/ecscm/ecs-policy-details.html)
- [Policy inheritance](https://docs.oracle.com/en-us/iaas/Content/Identity/policieshow/Policy_Inheritance.htm)
- [Policy attachment and compartment hierarchy](https://docs.oracle.com/en-us/iaas/Content/Identity/Concepts/policies.htm)
- [Policy conditions](https://docs.oracle.com/en-us/iaas/Content/Identity/Concepts/policyadvancedfeatures.htm)
- [Deny policy semantics](https://docs.oracle.com/en-us/iaas/Content/Identity/policysyntax/denypolicies.htm)
- [Listing policies and pagination](https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/iam/policy/list.html)
- [Upstream supplied and template policy modes](https://github.com/oci-landing-zones/terraform-oci-modules-iam/tree/main/policies) — verify the selected ref at generation time.
