# OCI IAM and compartment lifecycle safety

Read this reference whenever the request edits an existing resource definition or updates, moves, recovers, removes, or destroys an IAM or compartment resource. First classify the specific target below; editing configuration does not by itself establish whether a deployed resource will change. Preserve repository style, state only verified effects, and never run Terraform commands.

## Classify each target before choosing the flow

Identify the target definition/resource and its Terraform project, backend, and workspace/environment from available context. Inspect relevant accessible state read-only. For managed-resource changes, require state evidence with established project/workspace, currency, exact resource address, and identity; if that evidence is insufficient, ask for what is missing from the user's approved state-inspection process. A confirmed draft follows the separate evidence path in the table below. Never execute Terraform/state/import commands or modify state. State ownership does not by itself prove current OCI status; retain the applicable live validation checks.

| Evidence | Classification | Flow |
| --- | --- | --- |
| The exact resource is present in the correct project/workspace's current Terraform state, with no conflicting evidence | Managed resource | Require verified ownership and apply the managed-resource lifecycle and validation checks. |
| The user explicitly confirms that this specific definition is for a new, never-applied resource, with no conflicting evidence | Unapplied draft | Edit the requested configuration without requiring a state entry for that new resource. |
| Evidence is insufficient or conflicting, including unavailable, missing, or stale state without sufficient draft confirmation | Unknown | Ask for clarification/evidence and wait before editing the affected target. Continue independent authorized work when possible. |
| The resource exists in OCI but is established not to be owned by this Terraform project/state | Existing unmanaged resource | Stop the requested managed-resource change and explain the unmanaged-resource boundary; do not treat it as a draft, recreate it, or automatically import/adopt it. |

Neither the presence of `.tf` files nor the absence of a local state file establishes deployment status; state may be remote. Having generated the files earlier is also insufficient because the user or a pipeline could have applied them. Reuse an explicit confirmation already established in the conversation if it still applies to this target and no later evidence conflicts. If unclear, ask, for example: "Is this resource definition still new and never applied, or has it already been applied through Terraform?" A statement that it was applied does not replace the managed-resource ownership evidence. Resolve conflicting evidence before choosing a flow.

An existing managed resource with unapplied edits remains managed. Classify per resource, not per directory or entire module: one configuration can contain both managed resources and new drafts. A change to shared module settings, defaults, or references that also affects managed resources must satisfy their ownership and lifecycle checks; the draft exception does not cover those effects. Keep the existing no-state-needed path for explicitly requested new-resource generation.

## Edit a confirmed unapplied draft

- Apply only the requested edit to the confirmed new resource definition. Keep the DB-intent gate, selected-ref support/schema checks, relevant input validation, and policy/membership checks; only the requirement for that new resource to already exist in state is waived.
- Removing a confirmed draft entry cancels planned creation; it is not deletion of an OCI resource. Check configuration references and dependencies, preserve unrelated entries, and do not enable compartment deletion for draft cleanup.
- Editing a new draft group's members changes its initial assignment; follow `group-membership.md`. A draft policy still requires the applicable access assessment before emitting grants and must not be described as live access.
- Describe the result as a configuration-only edit to a confirmed unapplied definition. Never claim that OCI was updated, moved, recovered, or deleted. The managed-resource sections below apply only when the change affects an existing resource.

## Update

- For any Identity Domains group attribute update, including descriptions, tags, names, requestable settings, or memberships, apply [Identity Domains group update support](#identity-domains-group-update-support) before generating the edit. A documented input alone does not establish that an existing group can be updated.
- Distinguish an in-place metadata/configuration change from a replacement before proposing a change. Surface a planned replacement or destroy/create action clearly to the user.
- Use the tenancy home-region OCI provider context for IAM operations. Do not introduce or change provider aliases unless the existing repository and the user request it.
- Warn that IAM changes can take time to propagate after they succeed in the home region.
- Preserve existing resource names, map keys, provider settings, and module layout unless the user explicitly requests a change.

## Identity Domains group update support

After target classification, inspect `identity-domains/groups.tf` and its inputs at the selected source ref. For a managed group, establish the module instance, effective `ignore_external_membership_updates` value, and matching owned resource branch/address from configuration and current state. State alone does not prove the current inputs were applied; resolve conflicting mode/branch evidence before editing. Check the requested fields against that branch's implementation and lifecycle rules.

| Target and implementation | Required behavior |
| --- | --- |
| Explicitly requested new group or confirmed new, unapplied group definition | Set/edit only the requested initial values after applicable validation. `ignore_changes` does not suppress initial creation values. Preserve any shared mode/settings affecting existing groups. |
| Existing managed group; the requested field change is ignored by its resource lifecycle | Explain the upstream limitation and stop the affected update; do not write an ineffective edit as a solution. |
| Existing managed group; the established branch supports the requested update | Continue through lifecycle and field validation, preserving unrelated attributes and memberships as described below. |
| Unknown classification, mode, resource branch, or field-update behavior | Resolve the missing/conflicting evidence before editing. An existing unmanaged group remains outside the managed-update path. |

On the checked `main` implementation, `ignore_external_membership_updates = true` selects a group resource with `lifecycle { ignore_changes = all }`. It ignores all attribute updates, including description, tags, and membership. The already-established `false` branch has no such ignore rule. Verify the selected ref rather than assuming every version behaves this way. Do not extend this behavior to classic IAM groups or dynamic groups.

When reporting an ignored update, identify the group, selected ref, effective mode, requested fields, and the verified lifecycle restriction. Use the following explanation for a verified `ignore_changes = all` branch; if another selected ref ignores only specific fields, describe only that actual restriction:

> The upstream `terraform-oci-modules-iam/identity-domains` module uses `ignore_changes = all` for this group's current mode. Terraform uses these attribute values when creating the group but ignores later changes, including description, tags, and membership. Editing this configuration would therefore leave the requested attributes unchanged in OCI. This is a limitation of the upstream module's implementation in this mode. I cannot generate an effective update while preserving that mode, and will not switch modes or recreate the group to force the change.

For an update-capable branch that manages the membership collection, apply the existing Identity Domains ownership and membership-baseline checks in [group-membership.md](group-membership.md#evidence-required-before-generation), even for a description/tag-only edit. Reconcile the complete relevant configured/live membership and lookup results before writing, so the metadata edit does not carry unrelated membership changes. Missing evidence or conflicting membership stops that update; do not silently reset/adopt members. Do not ask for a member delta when none was requested. Preserve unrelated group attributes and make only the authorized field changes.

Do not switch the mode, remove lifecycle rules, upgrade the module, change map keys/state addresses, use direct provider resources, or recreate the group to bypass an ignored update. No OCI mutation, Terraform execution, or state change is permitted. The MCP-unavailable fallback cannot waive evidence needed for this update check. Group deletion follows the separate deletion flow: `ignore_changes = all` is not deletion protection. A confirmed draft edit remains an initial-value edit, not an existing-group update.

Sources: [upstream group implementation](https://github.com/oci-landing-zones/terraform-oci-modules-iam/blob/main/identity-domains/groups.tf), [Terraform ignore_changes behavior](https://developer.hashicorp.com/terraform/language/meta-arguments/lifecycle#ignore_changes). Check the implementation at the selected ref for each request.

## Policy grant reductions and deletion

Follow [policy-revocation.md](policy-revocation.md) for grant narrowing/removal, statement removal, and named policy deletion, including cancellation of confirmed unapplied policy grants. Report the exact proposed edits, ownership, impact, and residual or unverified access; obtain confirmation before editing policy configuration. Detecting another applicable policy does not authorize changing it. Complete the applicable validation before the confirmation request; do not ask again for an unchanged proposal already accepted. Metadata-only edits that preserve statements and attachment location use the ordinary update checks; changes to grant targets, conditions, or template roles/toggles are not metadata-only.

## Group membership updates

Follow [group-membership.md](group-membership.md) for DB onboarding/offboarding. A named member addition/removal is not a request to recreate or delete the group, administer the user account, or migrate management modes. Existing OCI groups require verified module/state ownership; classic removals also require ownership of the specific membership resources. Initial membership on an explicitly requested new group, including an edit to a confirmed unapplied group's initial assignment, does not require prior group state.

Preserve all unrelated members, attributes, and stable keys. Identity Domains membership changes must also pass [Identity Domains group update support](#identity-domains-group-update-support), including its upstream-limitation explanation when the change is ignored. Do not change the mode, remove an ignore-changes rule, or perform state/import operations to complete a membership request. If ownership or mode is incompatible, explain and stop that membership portion.

Removing a group member only addresses that membership. Do not claim complete DB access revocation through other groups or policies. A request to delete the group itself uses the deletion rules below.

## Dynamic-group rule updates

Follow [dynamic-group-matching-rules.md](dynamic-group-matching-rules.md) to resolve criteria and show the before/after scope while preserving unrelated conditions. Metadata-only edits preserve the rule; deletion follows the deletion rules below. Do not apply human-group membership-management flags to dynamic groups by assumption.

## Move

- For a compartment move, collect the intended parent OCID and preserve the hierarchy. Explain that moving a compartment is an OCI asynchronous operation and must be reviewed in the plan.
- Do not treat tenancy-level IAM users or groups as ordinary compartment-movable resources. For policies, distinguish attachment location from target scopes in statements; an access restriction does not authorize relocation. Use only documented upstream configuration for relationship or scope changes; do not substitute direct OCI resources.
- If the requested move is not supported by the upstream module, report that the Terraform module is not supported.

## Recover

- Terraform cannot recover a soft-deleted OCI compartment by itself.
- A compartment recovery must be performed outside Terraform using an OCI-supported recovery path. After recovery, the resource must be brought back under Terraform state using the user's approved state-management process.
- Do not run recovery, import, CLI, Console, or Terraform commands. Explain the limitation and direct the user to their approved operational procedure.

## Delete and remove-from-configuration

- After classification, treat removing a managed resource's entry from a module configuration as a requested Terraform destroy operation. Removing a confirmed unapplied draft follows the draft flow above; an unknown target must be clarified first.
- For compartments, keep `enable_delete = false` by default. OCI requires the compartment to be empty before it can be deleted.
- Before proposing a compartment deletion, ask the user to confirm the exact logical key/OCID, confirm that it is empty, and approve deletion.
- Use a staged approach for a compartment whose configuration currently has deletion disabled:
  1. Temporarily set the existing module's documented `enable_delete` option to `true` while retaining the compartment configuration.
  2. Have the user review and apply that isolated lifecycle-setting change.
  3. Remove only the confirmed compartment entry, then have the user review a plan showing only the intended destroy.
  4. After successful deletion, restore `enable_delete = false` unless the user explicitly wants it left enabled.
- Policy removal requires the concrete review and confirmation in `policy-revocation.md`; a general deletion request is not that confirmation. Do not remove a group, dynamic group, or Identity Domains object without warning that dependent policy assignments, memberships, applications, or other references may be affected. Ask the user to confirm the intended object and review the plan.

## Required user-facing handoff

For every managed-resource lifecycle change, state:

- the exact object(s) expected to change;
- whether the expected action is update, move, replacement, or delete;
- dependencies and operational prerequisites;
- that the user must review `terraform plan` before `terraform apply`.
