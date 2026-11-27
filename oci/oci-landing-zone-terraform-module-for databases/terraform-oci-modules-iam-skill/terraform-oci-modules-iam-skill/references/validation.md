# Validation contract

Read this file when the applicable checks are needed; reading it does not require first asking an optional-input question. Complete validation before generation once support, required inputs, and relevant optional choices are resolved through [optional-input handling](input-collection.md#optional-input-handling-all-modules). Supplied choices, documented defaults/inheritance for new settings, and preserved existing settings can resolve those choices; every optional field need not be supplied. Never proceed with a known invalid input. When validation fails, pause the affected generation and ask for the correction.

Check that a scoped update preserves omitted optional values and that any reset is explicitly requested for identified settings, has an established effective default, and passes its lifecycle/resource-specific checks. An ambiguous update instruction to "use defaults" remains unresolved; it does not authorize clearing existing values. This also applies to edits of confirmed unapplied drafts and to shared module defaults. Do not discard task-required values or bypass membership-mode restrictions or policy-revocation confirmation through optional/default handling.

## Validation outcomes

- **Pass:** continue to generation, subject to the policy-revocation confirmation gate where applicable. Passing validation is not user confirmation.
- **Known invalid or unresolved required input:** stop the affected generation and ask for the correction or missing information. Apply [required-input resolution](input-collection.md#required-input-resolution-all-modules): supported dependency references for requested new resources and approved external secret wiring do not require literal future IDs or disclosed secrets. Placeholder strings, dummy values, and unpopulated variables do not resolve missing resource inputs. Do not proceed with a known invalid input.
- **OCI MCP tool unavailable:** tell the user that OCI MCP is unavailable and tenancy validation was skipped. Continue with remaining non-MCP rules only for work that does not depend on policy access evidence, verified group-update/membership evidence, or resolved dynamic-group matching criteria. This fallback only skips unavailable live checks; it does not resolve missing inputs, allow placeholders, or accept known invalid values. Required evidence for grants, revocation edits, Identity Domains group updates, user memberships, and dynamic-group rules cannot be waived. Follow `policy-revocation.md` for verified named edits whose residual access is explicitly accepted as unknown; missing evidence about the policy being changed still blocks its edit. Do not claim the tenancy OCID was validated.

## Common target-classification and state gate — all resources

For edits to existing definitions and for update, move, recovery, removal, or destroy requests, recheck the per-target classification established through [lifecycle-safety.md](lifecycle-safety.md#classify-each-target-before-choosing-the-flow). Apply it equally to compartments, groups, dynamic groups, policies, and Identity Domains resources:

- **Managed resource:** require the exact address and resource identity in current state for the correct project/backend/workspace before proposing the change. Inspect accessible state read-only; if evidence is unavailable or its context/currency is uncertain, ask for the user's verified evidence from their approved inspection process. An unapplied edit to a managed resource still requires this ownership check.
- **Confirmed unapplied draft:** an explicit user confirmation of a new, never-applied resource definition, with no conflicting evidence, permits the requested configuration edit without a pre-existing state entry. Preserve all other applicable validation. Removing that draft cancels planned creation, not a live resource. Shared changes that affect managed resources still require their checks.
- **Unknown:** missing/stale state, an uncertain project/workspace, or conflicting evidence does not establish a draft or ownership. Without sufficient confirmation/evidence for another classification, ask and wait before editing that target.
- **Existing unmanaged resource:** stop the affected change; do not generate a duplicate, assume ownership, or automatically import/adopt it. Explain that management must be established separately through the user's approved process, then reassessed. The membership-specific no-adoption boundary remains in force.

Never run Terraform/state/import commands or create, modify, replace, move, or delete a state file. Absence of local state, configuration presence, and earlier generation by the agent are not deployment-status evidence.

For membership work, apply the resource-specific ownership distinctions in `group-membership.md`: additions to existing OCI groups require the group's state ownership, not a prior resource for the new membership; classic removals require the specific membership address, while Identity Domains memberships are part of the group resource. Requested new groups with initial members, including edits to confirmed unapplied groups' initial assignments, need no pre-existing group state. Do not perform adoption/import as part of a membership request; reassess only after ownership is established separately.

## Tenancy OCID validation — all module requests

`tenancy_ocid` must be supplied and must resolve to the active usable tenancy through the OCI API MCP server.

### OCI MCP availability check

Before stating that OCI MCP is unavailable, inspect the currently available tool inventory for both `get_oci_command_help` and `run_oci_command` from the OCI MCP server. If both are present, call `get_oci_command_help` with `iam compartment get` before making a live read.

Treat OCI MCP as unavailable only when the OCI tools are absent from the tool inventory or the tool catalog/loading mechanism reports that they cannot be invoked. A returned authentication, authorization, connectivity, or OCI API error means the server is available but the tenancy validation failed; report that distinction and ask for corrected access or a valid tenancy OCID. Do not report an available tool as unavailable merely because it was not listed in an earlier tool snapshot or because the live read failed.

### MCP validation interface

Use the OCI MCP server for this read-only validation; never fall back to a shell command.

| MCP tool | Purpose | Request format |
| --- | --- | --- |
| `get_oci_command_help` | Confirm current CLI syntax before the live read | `{ "command": "iam compartment get" }` |
| `run_oci_command` | Verify the supplied tenancy OCID resolves as the root compartment | `{ "command": "iam compartment get --compartment-id <TENANCY_OCID>" }` |

Rules for the tool request:

- Pass only the OCI command text after `oci`; never include `oci`, `--profile`, `--auth`, or `--help`.
- Do not set a per-call profile; MCP server authentication and tenancy selection are server-level.
- Treat a successful response for the exact supplied OCID as valid. Treat not found, forbidden, authentication failure, or any different returned tenancy identifier as a validation failure.
- If the OCI MCP tool is unavailable, tell the user that tenancy validation was skipped because MCP is unavailable, then follow the validation outcomes above. Do not bypass required policy, Identity Domains group-update, user-membership, or dynamic-group checks, guess, use the local OCI CLI, or claim the OCID is valid.
- If MCP returns not found, forbidden, authentication failure, or a different tenancy identifier, treat the supplied `tenancy_ocid` as unvalidated/invalid for this workflow. Pause and ask the user for a valid tenancy OCID or corrected OCI access before proceeding.

## Compartment validation

Apply these rules whenever the request creates, updates, moves, removes, or destroys a compartment hierarchy through the `compartments` module.

> **Note:** An OCI tenancy is the root compartment. Validate tenancy OCIDs and all other compartment OCIDs with OCI IAM compartment commands (for example, `iam compartment get --compartment-id <OCID>`), rather than using a separate tenancy command.

### Name uniqueness within the parent

Every compartment `name` must be unique among all compartments with the same effective parent. Determine the effective parent from, in order:

1. the first-level compartment's explicit `parent_id`;
2. `default_parent_id`;
3. the tenancy root when neither is supplied;
4. the declared hierarchy parent for nested `children`.

Inspect the full requested `compartments_configuration`, including nested children, and reject duplicate names in the same effective parent. The same name may appear under different parents only when OCI permits that scope. Do not confuse a Terraform map key with a compartment name.

### Required description

Every requested compartment at every level must include a `description` that is not `null`. Report the exact logical key/path for any missing or null description.

### Nested hierarchy inputs

For each requested nested compartment:

- require a valid `name` and non-null `description`;
- ensure its parent exists as an ancestor declared in the same hierarchy or as a documented external parent dependency;
- resolve an external parent OCID with OCI MCP before treating it as valid;
- reject an unresolved parent reference, a self-parent, a cycle, or more than six hierarchy levels;
- preserve literal OCIDs and declared key references; do not infer a parent from a display name.

## DB grant-policy validation

For access/grant requests, [policy-access-assessment.md](policy-access-assessment.md) defines the required early live assessment before policy input collection. At this generation stage, check that its evidence still matches the requested principal, operations, targets, dependencies, and conditions. If any of these changed, reassess the affected coverage.

Keep live coverage separate from [configuration evidence](policy-access-assessment.md#separate-live-access-from-configuration-evidence). Before relying on a comparison, establish the correct project/backend/workspace, managed-policy identity, effective inputs, and selected module/template implementation. A missing statement in one file, a state entry, or a live/configuration mismatch does not alone establish an unapplied edit. Require explicit user confirmation or reliable evidence tied to the exact configuration/environment before using that label. Uncertain apply history does not invalidate verified live access; an unresolved material discrepancy stops only the affected configuration decision. Current-access-only findings need no project discovery or apply-history gate.

Generate only confirmed missing grants, clearly labeled projected missing grants for explicitly requested new resources with verified dependencies, or an explicitly authorized correction to an eligible existing definition whose relevant discrepancy is verified. For a correction, record the chosen intent and exact change without inventing a missing live permission or duplicating a covered grant. Unverified coverage or an applicable deny cannot be overridden by the generic MCP-unavailable fallback, by supplied statements, or by a template. Confirm each emitted statement maps to a gap or authorized correction and each policy's attachment scope supports its target scopes. Preserve lifecycle/state checks and any revocation confirmation requirements when modifying an existing policy.

## Identity Domains group update validation

For every attribute update to an existing Identity Domains group, including metadata-only edits, apply [Identity Domains group update support](lifecycle-safety.md#identity-domains-group-update-support). Verify the selected ref's implementation, exact owned resource branch, effective management mode, and whether it permits the requested field changes. Ignored updates stop with the explicit upstream-limitation explanation; unknown/conflicting evidence must be resolved first. A description/tag-only request cannot bypass the applicable membership-baseline checks for a branch that manages members. Preserve unrelated attributes and memberships, and do not switch modes or recreate groups to force support. Recheck affected evidence if the ref, mode, branch, group, or requested fields change. Initial values for new groups and confirmed unapplied drafts follow their existing creation/draft validation; deletion retains its separate lifecycle flow.

## DB group membership validation

Apply [group-membership.md](group-membership.md) to initial assignments and named additions/removals, including its initial-assignment flow for edits to confirmed new unapplied groups. At generation, require the DB purpose, exact group/domain and selected ref, user-identity evidence for the applicable flow, and the before/after membership delta. For existing OCI groups also require the matching configuration/state ownership and compatible established mode. Recheck affected evidence if the target group, users, source ref, or mode changes.

For removals from existing classic OCI groups, verify ownership of the specific membership resources. For additions/initial assignments verify active, uniquely resolved usernames; do not require the removed user to be active. Ensure remaining configured members will not be silently omitted by the upstream lookup/filter. For updates to existing Identity Domains groups, verify an established compatible mode at the selected ref (already `false` on the checked `main` implementation), its matching state address, and that no external membership drift or unknown baseline will cause unrelated changes. Do not toggle the mode, recreate the group, reset the list, or adopt unmanaged objects.

If requested live membership is already satisfied and no conflicting managed/planned change exists, report no change needed. Otherwise, missing/forbidden/incomplete live reads, unknown ownership, or incompatible/unknown mode stop that membership change. The MCP-unavailable fallback does not override these checks. This does not authorize modifying IAM policies or user accounts.

## DB policy revocation and deletion validation

Apply [policy-revocation.md](policy-revocation.md) in two stages. Before presenting the concrete proposal, verify the requested DB scope, exact affected policies/statements, target classification and managed ownership where required, selected source/ref schema, supported direct/template input changes, and direct effects. Assess current and projected coverage to the extent needed for the chosen outcome or named edit; distinguish verified residual grants from unknown coverage. A complete-revocation claim requires complete relevant evidence. A limited named edit requires verified target/direct effects and explicit acceptance of its stated remaining or unverified access.

Before writing, require explicit confirmation of the same reviewed policy/statement diff and effects. Approval to investigate, a general deletion/revocation request, or silence is insufficient. Do not auto-edit other discovered grants, partially implement a blocked multi-policy choice, or adopt unmanaged policies. Reuse existing confirmation only while the proposal and material evidence remain applicable; revise and reconfirm if they change. Enforce supported retained statements, preserve unrelated settings, and require explicit whole-policy deletion approval when no statements would remain. No live-revocation claim follows from file generation alone.

## DB dynamic-group matching-rule validation

For creation or rule changes, apply [dynamic-group-matching-rules.md](dynamic-group-matching-rules.md). Require the established DB purpose, exact group/domain and selected ref, explicit membership criteria, resolved resource mapping or supported selector/dependency scope, and a rule whose syntax and scope match those criteria. For named existing Compute instances, require the scoped exact-name lookup when needed, complete pagination, disambiguation, and get verification of selected OCIDs. Supplied OCIDs start with get verification; supplied rules do not bypass target/criteria checks. Apply the reference's distinctions for other resource types, selectors with future matches, planned dependencies, and removal of existing explicit ID conditions.

Recheck affected evidence if the target context, resource type, membership criteria, source ref, or ownership changes. Managed updates require lifecycle ownership and reconciliation of live/configured rules; metadata-only edits preserve the rule. Unavailable/failed/incomplete required reads, unresolved targets, or unsupported/unclear predicate semantics stop the affected rule generation. Do not broaden scope, create member resources, or add policies as a fallback. Report verified resource identity separately from user-established DB purpose and from any policy access assessment.

## Validation scope still to be added

Further resource-specific validation beyond the DB grant/revocation, Identity Domains group-update, user-group membership, and dynamic-group matching-rule checks is not yet defined for all Identity Domains and other IAM lifecycle operations. Apply the explicit checks above where relevant, the common target-classification and state gate, tenancy-OCID validation, module-specific collection checks, and repository-preservation rules. Do not invent additional rules or describe unperformed checks as passed.
