# Resolve DB dynamic-group membership and derive matching rules

Use for creating a dynamic group or changing its matching rule through `dynamic-groups` or `identity-domains`, including user-supplied rules. Apply the DB intent gate before resource lookups. A metadata-only edit preserves the existing rule and follows the lifecycle workflow; deleting a dynamic group also follows that workflow. A policy-only request for an existing dynamic group uses `policy-access-assessment.md` and does not authorize changing its membership.

## 1. Separate DB purpose from membership criteria

- Explicit purpose, such as "instances that perform database backups", establishes DB intent. A name or ambiguous label does not: for "my database-backup instances" without explanatory context, ask whether the dynamic group will identify instances that perform database backup operations and wait. Reuse established DB intent without asking again.
- Resolve the intended resource type. Do not assume every use of "instance" means OCI Compute; clarify if the user could mean a database VM or another service resource. Verify that OCI supports matching the requested resource-principal type.
- Establish which resources should match: specific resources, all resources of a specified type in an exact compartment, or a supported tag-based predicate. Ask only for missing criteria. Never infer all-compartment membership from a request for particular backup instances.
- For compartment/tag selectors, establish the intended type, compartment constraints, tag namespace/key/value or key-existence condition, and boolean combinations as applicable. Explain that matching future resources are also included. The region used for a lookup does not add a regional restriction to the rule. Do not silently turn a dynamic selector into a snapshot of today's instance IDs or expand it to descendant compartments.

Resource lookup establishes identity and attributes, not the workload running inside a resource. The DB purpose comes from the request or confirmed context, not from a display name, tag label, or successful API response.

## 2. Resolve the group context and selected module

Resolve tenancy and classic IAM versus Identity Domains from context; for a domain dynamic group, resolve the exact domain. This identifies where the dynamic group is managed, independently of the region and compartment used to find its resource members. A missing domain/group is not permission to create it unless requested.

Select the exact source ref through `terraform-sources.md`. Inspect the selected module's schema and matching-rule implementation: `dynamic-groups/main.tf` or `identity-domains/dynamic-groups.tf` at that ref, including any lifecycle restrictions. Current `main` passes `matching_rule` to the corresponding resource; the user need not author its syntax. Do not apply the human-group `ignore_external_membership_updates` behavior to dynamic groups by assumption.

Before editing an existing definition, classify the dynamic group through `lifecycle-safety.md`. Existing managed groups require current ownership evidence; confirmed new unapplied drafts need no group state entry. Clarify unknown status and stop unmanaged-group changes without adoption or recreation. For a new group, check for a conflicting group in the intended tenancy/domain; do not reuse or overwrite a name collision automatically.

## 3. Resolve selected existing resources through read-only OCI MCP

Discover `get_oci_command_help` and `run_oci_command`; confirm syntax before each new command shape. Pass only the command text after `oci`, omit `oci`, `--profile`, `--auth`, and `--help`, and never fall back to a shell OCI CLI or change authentication. Use the established resource region for Compute reads and the appropriate IAM context for group/domain reads. If the server cannot address the required context, stop the affected lookup and explain the missing access/context. These early reads precede the generation-stage `validation.md` checks.

For specifically named OCI Compute instances:

1. Establish the tenancy, region, and compartment scope from available context; ask for missing scope instead of assuming the MCP default region or a tenancy-wide search. Resolve compartment names under their established parent scope. Record each instance's scope if targets span compartments or regions.
2. Use `compute instance list` with the resolved compartment and exact `--display-name` filter; fetch all pages using the help-confirmed pagination mechanism. Do not use a running-only filter to resolve identity: stopped instances and duplicate names must not disappear from the comparison.
3. Handle results separately for each requested name:

   | Result within the established scope | Action |
   | --- | --- |
   | One exact candidate | Retain its OCID and verify it with the get operation below. |
   | Multiple candidates | Show the distinguishing OCID, compartment, region, availability domain, and lifecycle state; ask which candidate is intended and wait. Never select the first or newest match by assumption. |
   | No candidate | Ask for a corrected name, scope, or OCID. Do not create an instance or substitute a broader rule. |
   | Failed read or incomplete results | Report unresolved identity and ask for the missing access/evidence. Do not treat the failure as an empty successful result. |

4. Use `compute instance get` for each selected OCID and confirm its identity, compartment, regional context, and lifecycle state against the intended target. If the user supplies an OCID initially, start here; a name search is unnecessary. Resolve conflicting details or a terminated/replaced target before including it; do not substitute another instance with the same name. Being stopped alone does not invalidate an instance selection.
5. Record the verified name-to-OCID mapping and scope used for the rule. Uniqueness is established within the agreed search scope, not across every unseen region or compartment.

For other supported resource types, use their documented service-specific read operations and the same unique-match, pagination, and failed-read rules; do not send them to Compute APIs.

For compartment/tag selectors, verify the exact compartment and supported tag definition/namespace/key and intended predicate. Use only tag kinds supported by current matching-rule documentation; free-form tags are not a substitute for supported namespaced tag conditions. Any listing of current matches is a preview, not a complete membership guarantee across uninspected scopes or future resources. A verified selector may intentionally have no current matches when future DB resources are explicitly intended; a missing specifically named existing instance remains unresolved.

For planned resources, follow `input-collection.md`'s supported-dependency rules and label the scope as projected. Do not demand a live get for a resource that has not been created, invent its OCID, or create Compute/tagging/network resources under this IAM skill. If supported wiring cannot express the intended future target, stop that portion for clarification.

Missing tools, forbidden/failed reads, incomplete pagination, ambiguous identity, or unsupported/unclear predicate semantics stop generation of the affected new or changed rule. The generic MCP-unavailable fallback cannot waive these checks. Continue independent authorized work when possible.

## 4. Derive or validate the rule without changing scope

Consult current Oracle matching-rule documentation for the exact resource type and identity context. Build the predicate from the resolved criteria, using the selected upstream schema. For multiple specifically selected Compute instances, use `instance.id` equality conditions combined with `ANY`; each condition contains a verified OCID. Do not replace those conditions with a compartment selector. Verify supported `ALL`/`ANY` combinations for compound criteria, and do not invent a display-name or region matching variable.

For a supplied rule, resolve its referenced targets and explain its membership scope using the same checks. Preserve valid text that matches the established intent. Explain any needed syntax correction; if the intended scope or correction is ambiguous or would change membership scope, ask and wait instead of silently rewriting it. Supplied syntax is not a validation bypass.

Once membership criteria are explicit and verified, derive their syntax without a separate mandatory syntax-approval question. If a predicate cannot faithfully represent the requested scope, explain the limitation and resolve the scope with the user before generation. Do not widen it as a fallback.

## 5. Apply only the requested change and hand off

For updates, compare the managed rule, live rule, and proposed configuration. Resolve discrepancies affecting the change before editing. Preserve all unrelated conditions and group settings; a named addition/removal is not authorization to replace the entire rule. Remove an explicit resource-ID condition only when that exact condition and group ownership are established; the resource need not still exist in OCI just to remove its condition. If the request instead requires exclusion from a compartment/tag selector, derive it only from explicit, supported exclusion criteria. An empty resulting membership expression is not permission to delete the group or invent a replacement rule; clarify the desired supported outcome.

Report no change needed only when the requested rule is already satisfied and no conflicting managed/planned change exists. A check-only request produces findings without files. Otherwise, resolve remaining required metadata and optional choices through `input-collection.md`, reusing applicable answers and preserving unrequested settings on updates; complete validation and generate only the requested supported group configuration.

Show the established DB purpose, group/domain, resolved resource mapping or selector scope, derived rule, and any before/after scope change. Explain future-match behavior for selectors. Changing membership can change which principals receive access through policies addressed to this dynamic group; do not claim to have assessed that access unless the policy assessment was requested and completed. Do not add or change policies automatically. If policies are also requested, assess that portion separately; covered policy access does not cancel pending dynamic-group work. State that configuration changes take effect only after the user's apply and OCI propagation, and do not claim complete access revocation from a rule change alone.

## Decision examples

| Request or evidence | Decision |
| --- | --- |
| "Create a dynamic group named database-backup" | Ask about DB purpose before lookup; the name alone is insufficient. |
| "Create a dynamic group for my database-backup instances" with no explanatory context | Ask whether those instances perform DB backup operations; wait before membership lookup. |
| "Create a dynamic group for instances that perform database backups" | DB purpose is explicit; ask only for missing membership criteria and lookup scope. |
| "Only backup-01 and backup-02" after DB intent is established | Resolve each within its established scope; verify selected OCIDs; derive only their ID predicates. |
| Two exact `backup-01` matches in the selected compartment/region | Ask the user to distinguish them; do not pick the first, newest, or running instance. |
| The user supplies instance OCIDs | Verify them with get operations in the appropriate context; do not require names first. |
| "All Compute instances in demo, including future backup workers" with established DB purpose | Verify the compartment and intended selector scope; explain future matches; do not replace the selector with current IDs. |
| A tag selector has no current matches but its verified scope intentionally covers future DB workers | Generate the supported selector after remaining validation; do not invent an instance or claim current membership. |
| Required lookup is forbidden, even with a user-supplied rule | Stop affected rule generation; ask for corrected access and retain independent work. |

## Sources

- [Compute instance list, exact names, and pagination](https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/compute/instance/list.html)
- [Compute instance get by OCID](https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/cmdref/compute/instance/get.html)
- [Dynamic-group matching-rule syntax and supported variables](https://docs.oracle.com/en-us/iaas/Content/Identity/dynamicgroups/Writing_Matching_Rules_to_Define_Dynamic_Groups.htm)
- [Managing dynamic groups](https://docs.oracle.com/en-us/iaas/Content/Identity/Tasks/managingdynamicgroups.htm)
- [Classic dynamic-group implementation](https://github.com/oci-landing-zones/terraform-oci-modules-iam/blob/main/dynamic-groups/main.tf)
- [Identity Domains dynamic-group implementation](https://github.com/oci-landing-zones/terraform-oci-modules-iam/blob/main/identity-domains/dynamic-groups.tf)

Upstream `main` links are orientation only; verify the selected ref at generation time.
