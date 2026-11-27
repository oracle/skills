# Validation contract

Read this file after support is confirmed and all required and optional inputs are collected. Never proceed with a known invalid input. When validation fails, pause and ask the user for the corrected value before generating or mutating configuration.

## Validation outcomes

- **Pass:** continue to generation.
- **Known invalid or missing input:** stop and ask for the valid OCID, corrected value, or missing information. Do not proceed with a known invalid input.
- **OCI MCP tool unavailable:** tell the user that OCI MCP is unavailable, tenancy validation was skipped, and continue with the remaining non-MCP validation rules. Do not claim the tenancy OCID was validated.

## Common lifecycle-state gate — all resources

For every update, move, recover, remove-from-configuration, or destroy request involving an IAM or compartment resource:

1. Inspect any accessible local Terraform state file read-only and identify the exact Terraform resource address. Do not run `terraform state` or any other Terraform command, and never create, modify, replace, move, or delete a state file.
2. Require the exact resource to exist in the current Terraform state before proposing the mutation. Configuration presence alone is not evidence of state ownership.
3. If no local state file is accessible, ask the user to confirm the state address from their approved state-inspection process. Do not assume a remote-state resource exists.
4. If the resource is absent from the current state, stop and do not assume it is managed. Give the user these options: manually import or adopt the existing OCI resource into state using their approved process; or reconcile or remove the stale configuration manually. Do not import, adopt, create a replacement, or alter state without explicit user direction and an approved state-management process.

This applies equally to compartments, groups, dynamic groups, policies, and Identity Domains resources.

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
- If the OCI MCP tool is unavailable, tell the user that tenancy validation was skipped because MCP is unavailable, then continue with the remaining validation rules. Do not guess, use the local OCI CLI, or claim the OCID is valid.
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

## Validation scope still to be added

Dedicated validation rules for Identity Domains, classic IAM groups, dynamic groups, and policies will be added later. Until then, apply the common lifecycle-state gate, tenancy-OCID validation, the module-specific structural checks in their collection references, and all existing repository-preservation rules. Do not invent additional rules.
