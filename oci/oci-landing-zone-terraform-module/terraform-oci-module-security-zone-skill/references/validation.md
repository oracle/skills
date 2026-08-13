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

1. Call `get_oci_command_help` for `iam policy list`.
2. Call `run_oci_command` with `iam policy list --compartment-id <TENANCY_OCID> --all`.
3. Inspect every returned active policy statement, including every response page when the MCP result does not automatically aggregate pages.
4. Normalize statement whitespace and compare case-insensitively. Require either exact, unqualified statement for the supplied group:

   ```text
   allow group <AUTHORIZED_GROUP_NAME> to manage cloud-guard-family in tenancy

   allow group <AUTHORIZED_GROUP_NAME> to manage all-resources in tenancy
   ```

If OCI MCP is unavailable, the list fails, the group name is absent, or no matching statement is returned, stop and tell the user that the required authorization could not be verified. Do not generate a policy, use the local OCI CLI, assume an inherited or related permission is enough, or claim the apply principal belongs to the named group. A matching policy proves the group's grant; it does not prove the current credentials are a member of that group.

## OCI resource validation

When OCI MCP provides `get_oci_command_help` and `run_oci_command`, use it for read-only validation. Confirm syntax with `get_oci_command_help` before the first use of `iam compartment get`, then use `run_oci_command` with:

```text
iam compartment get --compartment-id <OCID>
```

Pass only the command text after `oci`; do not pass profiles, credentials, or write flags. Validate the exact supplied `tenancy_ocid`, literal recipe/zone compartment OCIDs, and every `compartments_dependency[*].id`. A not-found, authorization, authentication, service error, or mismatched ID is a validation failure.

After the mandatory policy check passes, if OCI MCP cannot perform a later OCID read, say only that OCID validation was skipped and continue with structural checks. Do not fall back to the local OCI CLI or claim an OCID was validated.

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
