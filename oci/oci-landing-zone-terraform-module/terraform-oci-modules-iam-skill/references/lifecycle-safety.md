# OCI IAM and compartment lifecycle safety

Read this reference whenever the request updates, moves, recovers, removes, or destroys an IAM or compartment resource. Treat lifecycle changes as high-impact: preserve repository style, state only verified effects, and never run Terraform commands.

## Update

- Distinguish an in-place metadata/configuration change from a replacement before proposing a change. Surface a planned replacement or destroy/create action clearly to the user.
- Use the tenancy home-region OCI provider context for IAM operations. Do not introduce or change provider aliases unless the existing repository and the user request it.
- Warn that IAM changes can take time to propagate after they succeed in the home region.
- Preserve existing resource names, map keys, provider settings, and module layout unless the user explicitly requests a change.

## Move

- For a compartment move, collect the intended parent OCID and preserve the hierarchy. Explain that moving a compartment is an OCI asynchronous operation and must be reviewed in the plan.
- Do not describe global IAM users, groups, or policies as ordinary compartment-scoped resources. For changes in relationship or membership, use only the documented upstream module configuration; do not create direct OCI resources as a substitute.
- If the requested move is not supported by the upstream module, report that the Terraform module is not supported.

## Recover

- Terraform cannot recover a soft-deleted OCI compartment by itself.
- A compartment recovery must be performed outside Terraform using an OCI-supported recovery path. After recovery, the resource must be brought back under Terraform state using the user's approved state-management process.
- Do not run recovery, import, CLI, Console, or Terraform commands. Explain the limitation and direct the user to their approved operational procedure.

## Delete and remove-from-configuration

- Treat removing an object from a module configuration as a requested Terraform destroy operation, not merely a source-code cleanup.
- For compartments, keep `enable_delete = false` by default. OCI requires the compartment to be empty before it can be deleted.
- Before proposing a compartment deletion, ask the user to confirm the exact logical key/OCID, confirm that it is empty, and approve deletion.
- Use a staged approach for a compartment whose configuration currently has deletion disabled:
  1. Temporarily set the existing module's documented `enable_delete` option to `true` while retaining the compartment configuration.
  2. Have the user review and apply that isolated lifecycle-setting change.
  3. Remove only the confirmed compartment entry, then have the user review a plan showing only the intended destroy.
  4. After successful deletion, restore `enable_delete = false` unless the user explicitly wants it left enabled.
- Do not remove a group, dynamic group, policy, or Identity Domains object without warning that dependent policy assignments, memberships, applications, or other references may be affected. Ask the user to confirm the intended object and review the plan.

## Required user-facing handoff

For every lifecycle mutation, state:

- the exact object(s) expected to change;
- whether the expected action is update, move, replacement, or delete;
- dependencies and operational prerequisites;
- that the user must review `terraform plan` before `terraform apply`.
