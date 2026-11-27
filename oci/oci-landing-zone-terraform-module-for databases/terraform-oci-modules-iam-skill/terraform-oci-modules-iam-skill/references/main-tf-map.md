# Terraform file map

For any existing Identity Domains group attribute update, including descriptions/tags, first pass [Identity Domains group update support](lifecycle-safety.md#identity-domains-group-update-support). Do not write an ignored attribute edit as a working update. Supported updates preserve unrelated settings and memberships; confirmed unapplied drafts use the initial-value path.

For user-to-group membership work, first satisfy [group-membership.md](group-membership.md). Update only the eligible group's existing member data for the named delta, or the explicitly requested new group's initial assignment. Do not create a duplicate group, add a standalone membership module, adopt external resources, change management mode, or replace all members. A confirmed no-change result produces no configuration edits or Terraform-command handoff.

For dynamic-group creation or matching-rule changes, first satisfy [dynamic-group-matching-rules.md](dynamic-group-matching-rules.md). Put the derived or validated rule into the selected classic or domain dynamic-group configuration. Preserve unrelated conditions/settings, emit no unresolved resource identifiers, and do not add policies unless also requested. Metadata-only edits preserve the rule and follow lifecycle checks.

For policy access work, enter this map only after [policy-access-assessment.md](policy-access-assessment.md) establishes confirmed permission gaps or a verified relevant configuration discrepancy with an explicitly requested/clarified correction. Covered live access produces no duplicate grants; it does not prove that an in-scope configuration needs no correction. Unknown apply history stays unknown, and unresolved material intent stops affected edits. Unverified or denied live access stops speculative grant generation. A check-only request never reaches file generation. Reuse a matching eligible definition rather than creating another one, and do not adopt an unmanaged live policy merely because it supplied assessment evidence.

For policy grant reductions, statement removals, or named policy deletions, use [policy-revocation.md](policy-revocation.md). Use this map to prepare the reviewable proposed diff before confirmation, then write only after the user confirms that exact validated proposal. Preserve untouched policies/statements and report remaining grants. A blocked policy does not authorize a partial change to another policy; investigation-only and no-change choices produce no edits.

Use this map only after the request passes the [fixed skill allowlist](module-support.md), DB intent and resource relevance have been established, upstream support has been confirmed, and validation has passed. Generate only the requested DB-related IAM changes; preserve unrelated existing configuration. Distinguish skill scope from a module block absent from the **current repository** or a capability absent from the **upstream module repository**:

- Capability outside the fixed skill allowlist: generate nothing for it, even if upstream supports it or a module block already exists locally. Report the skill-scope exclusion.
- Allowed capability and existing module block absent, with verified upstream support: add the documented upstream module block.
- Allowed capability and existing module block present, with verified upstream support: extend its configuration data; do not add a duplicate module block.
- Allowed capability absent upstream at the selected ref: report unsupported at that ref under `module-support.md`; do not write a replacement module or direct `oci_*` resources. Incomplete source verification leaves support unverified and pauses generation.

## Existing repository: choose the change

Inspect the repository's current module blocks and trace the variable or local value supplied to each module input.

Before editing or removing an existing definition, apply the per-target classification in [lifecycle-safety.md](lifecycle-safety.md#classify-each-target-before-choosing-the-flow). A confirmed new unapplied draft needs no state entry; a managed resource requires ownership checks even when the current edit is unapplied. Clarify unknown status and stop unmanaged-resource changes. A module block's presence alone establishes neither ownership nor deployment status.

| User request | Existing repository state | Required change |
| --- | --- | --- |
| Edit or remove a confirmed new unapplied draft | User confirmation applies to this specific definition and no evidence conflicts | Edit only that definition and check references/dependencies. Removal cancels planned creation; do not describe it as a live deletion or enable deletion settings. |
| Edit or remove a managed resource's definition | Current state establishes ownership in this project/workspace | Apply the requested change only after its lifecycle and resource-specific checks pass. |
| Add an object or an optional input for a supported capability | A module block for that same upstream capability already exists | Add the validated data to the module's existing documented configuration object or optional module input. Preserve its map keys, object relationships, tags, and existing variable-data convention. Do not add a duplicate module block. |
| Add a different supported capability | No module block for that upstream capability exists | Add one module block using the canonical upstream source, plus its typed variable declaration and validated data, integrated with the existing provider and project conventions. |
| Request a capability outside the fixed skill allowlist | Any local/upstream module state | Stop that portion and explain the skill-scope exclusion; do not generate it through an existing module or a new one. |
| Request an otherwise allowed capability absent upstream at the selected ref | Required module implementation is verified unavailable | Stop that portion and use the selected-ref unsupported response in `module-support.md`. |

Never use the absence of a module block in the current repository as a reason to say the capability is unsupported. Skill scope is determined by `module-support.md`; upstream support must separately be verified at the selected ref. Neither upstream discovery nor an existing local module expands skill scope.

Examples of extending an existing module: add a compartment to `compartments_configuration`; add a group to `groups_configuration`; add a dynamic group to `dynamic_groups_configuration`; add a policy to the policies module's documented configuration; or add an Identity Domains object to its documented configuration. In each case, extend the existing module's data instead of creating another module block.

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
    database = {
      name        = "database"
      description = "Compartment for ExaDB-D resources"
    }
  }
}
```

Use the configuration shape documented at the selected source ref; this is only a placement example. Do not replace the existing object with this sample.

### New supported-module pattern

When, for example, dynamic groups are requested and no dynamic-groups module block exists, add one documented module block:

This is a wiring example only. Check the module argument names and types against `dynamic-groups/variables.tf`, `README.md`, and `SPEC.md` at the exact source ref selected for this configuration. Do not use `main` to validate a different pinned ref.

```hcl
module "dynamic_groups" {
  source = "git::https://github.com/oci-landing-zones/terraform-oci-modules-iam.git//dynamic-groups?ref=<selected-ref>"

  tenancy_ocid                 = var.tenancy_ocid
  dynamic_groups_configuration = var.dynamic_groups_configuration
}
```

Confirm the selected ref supports dynamic groups before emitting the block, and use its documented argument names and types. Do not add this block when dynamic groups are unsupported; do not create a custom alternative.

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
3. one module block for each requested capability admitted by the fixed skill allowlist and supported at the selected upstream ref.

### `variables.tf`

- Declare the OCI authentication and region variables for the selected authentication method.
- Declare one typed configuration variable for each selected module, based on its `SPEC.md` at the selected source ref.
- Do not declare variables, configuration objects, or modules for excluded, unsupported, or unverified capabilities.

### `terraform.tfvars`

- Put only resolved, non-secret provider and module data that satisfies the applicable validation rules here. Follow [required-input resolution](input-collection.md#required-input-resolution-all-modules); do not emit placeholders, dummy OCIDs, or empty/null stand-ins for required values.
- Keep documented literal dependency keys in the appropriate data object and supported Terraform dependency expressions in configuration wiring; a future generated OCID need not be supplied literally. Keep secrets external through the selected authentication or approved secret-input mechanism; never include private-key contents, tokens, or passwords.

## Final handoff

Do not run Terraform. Tell the user to install Terraform 1.3.0 or later if required, then provide:

```bash
terraform init
terraform validate
terraform plan
terraform apply
```

Tell the user to review the plan before applying it.
