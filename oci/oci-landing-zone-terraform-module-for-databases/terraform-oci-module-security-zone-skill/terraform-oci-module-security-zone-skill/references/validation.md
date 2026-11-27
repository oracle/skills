# Security Zones validation contract

Read only after required values and optional choices are collected. Never generate usable configuration with a missing, empty, unresolved, malformed, or known-invalid supplied value.

## Mandatory OCI MCP policy validation

Before generating usable configuration, require an exact `authorized_group_name` and resolve the tenancy OCID before using OCI MCP to prove that an active tenancy policy grants the required permission.

### Resolve the tenancy root

Use a supplied literal `tenancy_ocid` only when it starts with `ocid1.tenancy.`. Otherwise, require a literal `scope_compartment_ocid` beginning with `ocid1.compartment.` and resolve it through OCI MCP:

1. Call `get_oci_command_help` for `iam compartment get` before the first read.
2. Call `run_oci_command` with `iam compartment get --compartment-id <CURRENT_OCID>`.
3. Read the returned compartment's parent identifier (`data.compartment-id` / `data.compartmentId`). If it begins with `ocid1.tenancy.`, it is the resolved `tenancy_ocid`; otherwise it must be a different `ocid1.compartment.` OCID, which becomes `<CURRENT_OCID>` for the next read.
4. Repeat until the root tenancy OCID is reached. Reject a missing parent, malformed OCID, repeated OCID, authorization/API error, or more than the documented hierarchy depth. Do not infer a tenancy OCID from a compartment name.

Use the resolved root only as `tenancy_ocid` in the Terraform module; do not emit traversal metadata.

### Verify the policy

Use OCI MCP only. Do not use the local OCI CLI or write an IAM policy.

1. Call `get_oci_command_help` for `iam policy list`.
2. Call `run_oci_command` with `iam policy list --compartment-id <TENANCY_OCID> --all`.
3. Inspect every returned active policy statement, including every response page when the MCP result does not automatically aggregate pages.
4. Parse each statement using the documented OCI policy syntax rather than comparing the whole statement to one literal string. Normalize whitespace; compare policy keywords case-insensitively, group names to the exact supplied name, and OCIDs by full literal equality. A qualifying grant must have `manage`, `cloud-guard-family` or `all-resources`, and `in tenancy`, with no `where` condition. `all-resources` is broader and qualifies.
5. For the subject, accept either:
   - The exact `authorized_group_name` as a single group subject, such as `Allow group A to manage cloud-guard-family in tenancy`.
   - The exact `authorized_group_name` as one member of a comma-separated group-name subject, such as `Allow group A, B to manage cloud-guard-family in tenancy`.
   - A group OCID that resolves to the exact `authorized_group_name`, including an OCID in a comma-separated group subject. Do not match an OCID by its spelling or prefix alone.

For a potentially qualifying statement that uses `group id <OCID>`, resolve the identity through OCI MCP:

1. Call `get_oci_command_help` for `iam group get` before the first group lookup.
2. Call `run_oci_command` with `iam group get --group-id <GROUP_OCID>` for each distinct candidate group OCID. Reuse a successful lookup for repeated OCIDs.
3. Compare the returned group `id` to the requested OCID and its `name` to the exact `authorized_group_name`. Treat a failed lookup, mismatched ID, or non-active group as unresolved. If another fully verified statement already grants the required permission, the unresolved statement does not negate that grant.

Recognize the documented multiple-group forms, including `group A, B` and `group id <OCID1>, id <OCID2>`. Do not treat dynamic groups or other subject types as the named authorized group. If no supported statement proves the grant and a potentially qualifying statement uses a subject form, condition, or other syntax that cannot be safely evaluated, classify the authorization result as **inconclusive**. Do not call it a missing grant.

Classify the overall check as follows:

- **Verified:** At least one active tenancy policy contains a fully evaluated qualifying grant for the authorized group by name or resolved OCID. Continue validation and generate the requested Terraform configuration. This verifies the group's grant; it does not prove the current credentials are a member of that group.
- **Not found:** Policy listing and pagination completed, all potentially qualifying statements were evaluated, and none grants the required permission. Stop before generating usable configuration and say no qualifying grant was found.
- **Inconclusive:** No grant has already been verified, and OCI MCP is unavailable, policy listing or pagination fails, a required group lookup fails, or a potentially qualifying statement cannot be evaluated. Stop before generating usable configuration. Say that authorization could not be verified, identify the failed lookup or statement, and direct the user to have a tenancy IAM administrator check the active tenancy policy and resolve any group OCID in the OCI Console or their approved IAM process. Refer to [OCI policy syntax](https://docs.oracle.com/en-us/iaas/Content/Identity/Concepts/policysyntax.htm). Do not claim the grant is missing.

Do not infer an inherited or related permission is enough, create an IAM policy, fall back to the local OCI CLI, or claim the apply principal belongs to the named group.

## OCI resource validation

When OCI MCP provides `get_oci_command_help` and `run_oci_command`, use it for read-only validation. Confirm syntax with `get_oci_command_help` before the first use of `iam compartment get`, then use `run_oci_command` with:

```text
iam compartment get --compartment-id <OCID>
```

Pass only the command text after `oci`; do not pass profiles, credentials, or write flags. Validate the exact supplied `tenancy_ocid`, literal recipe/zone compartment OCIDs, and every `compartments_dependency[*].id`. A not-found, authorization, authentication, service error, or mismatched ID is a validation failure.

After the mandatory policy check passes, tenancy, required group-identity, and compartment OCID reads remain mandatory; if they cannot be performed or return an error, stop before generating usable configuration and report the failed or inconclusive validation. For optional `security_policies_ocids` only, if OCI MCP does not expose a documented read operation, say OCI-side validation was skipped and continue with structural checks. If a documented read is available and returns not-found, authorization, authentication, service error, or a mismatched ID, treat it as a validation failure. Do not fall back to the local OCI CLI or claim an OCID was validated when its read was skipped.

## Configuration rules

- `tenancy_ocid` must be supplied and non-empty.
- Every requested Security Zone must have non-empty `name`, `compartment_id`, and `recipe_key`; every requested recipe must have non-empty `name` and `compartment_id`.
- `default_cis_level` and each supplied recipe `cis_level` must be exactly `"1"` or `"2"`.
- Every supplied `security_policies_ocids` value must be a non-empty security-policy OCID; validate OCI-side only when a documented read is available. Never manufacture a policy ID.
- Every literal `compartment_id` must resolve through the OCI MCP compartment read. Every key reference must resolve through a supplied external dependency with a validated `id`.
- If `enable_obp_checks` is omitted or true, reject a recipe or zone whose effective compartment is the tenancy root. Permit root deployment only after the user explicitly sets it to false and acknowledges its scope.
- For every Security Zone, verify that its recipe key exists in `recipes`; do not look up a recipe that the same module will create.
- Treat `reporting_region` as an exact OCI region identifier; do not infer it. When omitted, the module uses tenancy home region.

## Lifecycle gate

For updates, removals, or replacements, inspect accessible local state read-only and require the exact Terraform address to exist. If no accessible state proves ownership, ask the user to confirm it through their approved state-inspection process. Do not import, adopt, recreate, or alter state.
