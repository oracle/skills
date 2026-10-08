# Exadata lifecycle safety

Use this reference for every update, remove-from-configuration, delete, move, recovery, or replacement request. This module uses Terraform's standard declarative state reconciliation: change configuration, inspect the resulting plan, then apply only after the user approves. Never run Terraform commands for the user.

## State ownership gate

Before proposing any lifecycle mutation:

1. Require the user to name the exact object, its logical map key, and intended change.
2. Inspect accessible local Terraform state read-only and identify the exact state address. Configuration presence alone does not establish Terraform ownership.
3. Require the exact object to exist at that address. If no local state is accessible, ask the user to confirm the address through their approved state-inspection process.
4. Validate an existing OCI resource's literal ID and lifecycle state through OCI MCP, as required by `validation.md`.

If state ownership, resource identity, or readiness cannot be confirmed, stop. Do not import, adopt, recreate, replace, move state, or edit a state file as a workaround.

## Updates

Treat updates as a deliberate configuration change followed by Terraform reconciliation:

1. Change only the documented input or module parameter for the confirmed object.
2. Re-check the approved upstream module specification and provider documentation to determine whether the field is in-place, forces replacement, or is immutable.
3. Preserve stable map keys and all unrelated configuration. A map-key change alters a Terraform address; never present it as an in-place update.

Examples that may be supported only when the approved module/provider accepts them include VM-cluster compute or storage scaling, adding a child resource such as a PDB, and updating mutable tags or display names. Do not promise in-place behavior before confirming it at the approved module/provider version.

The upstream module documents these as not updatable after creation:

| Resource | Do not treat as in-place |
| --- | --- |
| Cloud VM Cluster | `gi_version`, `system_version`, `defined_tags` |
| DB Home | `db_version`, `database_software_image_id` |
| Container Database | `db_home_id`, `db_version`, `database.admin_password` |

## Delete and remove-from-configuration

- Treat removing a map entry from the module configuration as a requested Terraform destroy, not source-code cleanup.
- Require explicit confirmation of the exact logical key, state address, OCI ID, and intended deletion before removing it.
- Trace dependent references first. Removing an infrastructure, VM cluster, DB Home, CDB, or PDB can affect all downstream entries in the infrastructure → VM cluster → DB home → CDB → PDB chain.
- For DB Home/database deletion, use this required two-stage sequence only after the user explicitly confirms the exact DB Home/database scope:
  1. Retain the confirmed DB Home entry in configuration and set its documented `enable_database_delete = true` option. The user must run and review an isolated `terraform plan`, then run `terraform apply` themselves to persist that lifecycle setting.
  2. Remove only the confirmed DB Home entry from configuration. This is the Terraform destroy request. The user must again run and review `terraform plan`, confirm that it shows only the intended destroy, then run `terraform apply` themselves.
  Do not combine these stages, and never run either command for the user.
- Do not use a replacement resource to bypass a failed deletion. Do not delete baseline IAM/network resources; they are outside this skill.

## Move and rename

First distinguish the requested operation:

- **OCI relocation** (for example, changing compartment, region, availability domain, VCN/subnet, or parent resource): do not assume it is supported. Confirm the exact resource's documented move capability and lifecycle impact at the approved module/provider version. If unsupported, report that this module cannot perform the requested move.
- **Terraform address refactor** (for example, changing a module path or map key): require exact current and destination state addresses. Use a documented Terraform `moved` block only when the user explicitly requests this refactor and the mapping is one-to-one; never run `terraform state mv` or any state command.
- **Display-name change:** treat it as an update only after confirming the field is mutable; do not rename a logical map key merely to match it.

## Required user-facing handoff

For every lifecycle mutation, state:

- exact object(s), logical key(s), OCI ID(s), and state address(es) expected to change;
- whether the expected action is update, replacement, destroy, Terraform-address move, or unsupported OCI move;
- dependent Exadata resources and operational prerequisites;
- that the user must review `terraform plan` before `terraform apply`.

Provide, but never execute:

```bash
terraform init
terraform validate
terraform plan
terraform apply
```
