# Terraform file map

Use this map only after support has been confirmed and validation has passed. First distinguish a module block that is absent from the **current repository** from a capability that is absent from the **upstream module repository**:

- Existing module block absent, but upstream supports the capability: add the documented upstream module block.
- Existing module block present: extend its configuration data; do not add a duplicate module block.
- Upstream does not support the capability: tell the user the Terraform module is not supported; do not write a replacement module or direct `oci_*` resources.

## Existing repository: choose the change

Inspect the repository's current module blocks and trace the variable or local value supplied to each module input.

| User request | Existing repository state | Required change |
| --- | --- | --- |
| Add an object or an optional input for a supported capability | A module block for that same upstream capability already exists | Add the validated data to the module's existing documented configuration object or optional module input. Preserve its map keys, object relationships, tags, and existing variable-data convention. Do not add a duplicate module block. |
| Add a different supported capability | No module block for that upstream capability exists | Add one module block using the canonical upstream source, plus its typed variable declaration and validated data, integrated with the existing provider and project conventions. |
| Request an unsupported capability | No upstream module exists | Stop for that capability and say: “The Terraform module for `<capability>` is not supported by `oci-landing-zones/terraform-oci-modules-iam`.” |

Never use the absence of a module block in the current repository as a reason to say the capability is unsupported. Support is determined solely by `module-support.md` and the upstream repository.

Examples of the first row: add a compartment to `compartments_configuration`; add a group to `groups_configuration`; add a dynamic group to `dynamic_groups_configuration`; add a policy to the policies module's documented configuration; or add an Identity Domains object to its documented configuration. In each case, extend the existing module's data instead of creating another module block.

## Existing repository: file placement

Always preserve the repository's established style and layout rather than forcing a new one. Match nearby Terraform formatting, indentation, block ordering, naming, comments, variable-data format, and file placement; make the smallest scoped change that adds or mutates the requested resource.

- Locate the existing configuration value for the selected module. It may be in `terraform.tfvars`, a `*.tfvars` environment file, a `.tf` local, or another established configuration source. Update that source only.
- Reuse existing OCI provider configuration, aliases, `required_providers`, backend, version constraints, naming convention, and variable types.
- Add the module block to the repository's appropriate root/module `.tf` file. If the repository uses `main.tf`, add it there; otherwise preserve its chosen layout.
- Add or extend typed variable declarations in the existing variable-definition file. Do not weaken a documented object type to `any`.
- Add validated non-secret values to the existing variable-data file. Do not overwrite unrelated environment values.
- Avoid duplicate providers, duplicate module names, conflicting variables, backend changes, or state changes.

### Example: extend an existing compartments configuration

When this module already exists, the change is configuration data—not a second module:

```hcl
compartments_configuration = {
  # Preserve existing values.
  compartments = {
    # Preserve existing compartment entries.
    app = {
      name        = "app"
      description = "Application compartment"
    }
  }
}
```

Use the exact current configuration shape from the repository and `compartments/SPEC.md`; this is only a placement example. Do not replace the existing object with this sample.

### New supported-module pattern

When, for example, dynamic groups are requested and no dynamic-groups module block exists, add one documented module block:

```hcl
module "dynamic_groups" {
  source = "git::https://github.com/oci-landing-zones/terraform-oci-modules-iam.git//dynamic-groups?ref=<release-tag-or-commit-sha>"

  tenancy_id                   = var.tenancy_ocid
  dynamic_groups_configuration = var.dynamic_groups_configuration
}
```

Confirm the current `dynamic-groups/SPEC.md` before emitting the final argument names and type. Do not add this block when dynamic groups are unsupported; do not create a custom alternative.

## No repository or directory in scope: minimal project

Ask the user for a target directory. Then create only:

```text
main.tf
variables.tf
terraform.tfvars
```

### `main.tf`

Include, in order:

1. a `terraform` block with `required_version = ">= 1.3.0"` and OCI `required_providers`;
2. an OCI provider block consuming variables;
3. one module block for each requested, upstream-supported capability.

### `variables.tf`

- Declare the OCI authentication and region variables for the selected authentication method.
- Declare one typed configuration variable for each selected module, based on its current `SPEC.md`.
- Do not declare variables or modules for unsupported capabilities.

### `terraform.tfvars`

- Put only validated, non-secret provider and module data here.
- Use placeholders for unsupplied OCIDs and credentials; never include private-key contents, tokens, or passwords.

## Final handoff

Do not run Terraform. Tell the user to install Terraform 1.3.0 or later if required, then provide:

```bash
terraform init
terraform validate
terraform plan
terraform apply
```

Tell the user to review the plan before applying it.
