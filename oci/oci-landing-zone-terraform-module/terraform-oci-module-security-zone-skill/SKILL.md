---
name: build-oci-security-zones-main-tf
description: "Generate or update Terraform configuration only for OCI Security Zones with the upstream `oci-landing-zones/terraform-oci-modules-security/tree/main/security-zones` folder. Use for Cloud Guard Security Zone recipes and Security Zones when requests must be mapped to the documented module, inputs collected and validated, and `main.tf`, `variables.tf`, and `terraform.tfvars` produced. Never deploy, run Terraform, or generate other security services, Cloud Guard targets, detectors, responders, IAM, or network resources."
---

# Build OCI Security Zones Terraform

Generate only the upstream Security Zones module configuration. Default to additive-only changes. Never invent a module path, input name, resource model, policy OCID, compartment relationship, or prerequisite value. Never mutate, replace, rename, move, or delete an existing resource unless the user explicitly and unambiguously requests that exact change. Never install or execute Terraform.

## Required workflow

1. Inspect the target before writing.
   - Inspect the project root, Terraform files, provider/backend setup, established layout, and existing module blocks.
   - For an update, removal, or deletion, inspect accessible local Terraform state read-only for the exact state address. Never modify state or run Terraform state commands.
   - Treat it as an existing project when a project or configuration is in scope. Otherwise ask for a target directory; do not hardcode one or overwrite unrelated files.
   - Read [references/module.md](references/module.md) first. If the request is outside Security Zone recipes or Security Zones, say: **"The Terraform module for `<capability>` is not supported by `oci-landing-zones/terraform-oci-modules-security/tree/main/security-zones`."**
   - Read [references/lifecycle-safety.md](references/lifecycle-safety.md) for any non-additive request.

2. Collect exact inputs.
   - Read [references/input-collection.md](references/input-collection.md). Collect `tenancy_ocid` or a supplied compartment OCID from which to resolve it through OCI MCP, the named OCI group authorized to apply this configuration, at least one Security Zone definition, its recipe key, and the matching recipe definition first.
   - For every recipe, explicitly explain the CIS choices before collecting `cis_level`: the module default is `"1"` unless a supplied top-level `default_cis_level` overrides it; Level 1 enables `deny public_buckets` and `deny db_instance_public_access`; Level 2 enables the Level 1 policies plus `deny block_volume_without_vault_key`, `deny boot_volume_without_vault_key`, `deny buckets_without_vault_key`, and `deny file_system_without_vault_key`. Ask the user to select Level 1 or Level 2, or explicitly accept the applicable default.
   - Then ask whether the user has specific Oracle Security Zone policies to add beyond the selected CIS baseline or wants to choose from the complete available-policy catalog. If they provide specific policy names or OCIDs, validate only those values through OCI MCP and add only the selected returned OCIDs to `security_policies_ocids`. If they choose the catalog, use OCI MCP read-only calls to list active policies and present every active returned policy in a Markdown table of policy name, description, services, category, and OCID before asking for their selection. Never infer policy relevance from the authorized group or any other input, and never omit catalog entries. If the user declines extra policies, omit `security_policies_ocids`.
   - Preserve literal OCIDs and stable logical map keys. Do not infer a compartment OCID, policy OCID, reporting region, CIS level, or a recipe-to-zone association from a name.
   - Collect `compartments_dependency` only when a recipe or Security Zone uses a compartment-reference key instead of a literal compartment OCID.
   - Ask whether the user wants documented optional inputs only after all required values are present. If declined, use documented defaults; never invent optional values.
   - Read the upstream `SPEC.md` before writing configuration so the generated object matches the approved module revision's exact shape.
   - Read [references/terraform-sources.md](references/terraform-sources.md) before writing a module block.

3. Validate before producing usable configuration.
   - Read [references/validation.md](references/validation.md) only after input collection.
   - Apply every non-placeholder rule. Pause for a corrected value when a required or supplied optional input is missing or known invalid.
   - Use OCI MCP read-only commands to verify that the supplied group has an active tenancy policy granting either `manage cloud-guard-family in tenancy` or `manage all-resources in tenancy`. This policy check is mandatory; stop if OCI MCP is unavailable, policy listing fails, or neither authorization is found. Validate tenancy and supplied literal compartment OCIDs through OCI MCP when available; never use local OCI CLI or claim OCI-side validation.
   - For an existing-resource mutation, require confirmed Terraform-state ownership before proposing it.

4. Generate after validation succeeds.
   - Read [references/main-tf-map.md](references/main-tf-map.md).
   - In an existing project, preserve its layout, provider/backend blocks, naming, variables, and secret-handling approach. Make the smallest scoped change; do not add a duplicate module block.
   - In a new project, create exactly `main.tf`, `variables.tf`, and `terraform.tfvars`. Include the OCI provider baseline and module block in `main.tf`; typed declarations in `variables.tf`; only validated non-secret values in `terraform.tfvars`.

5. Hand off without execution.
   - Tell the user this upstream module requires Terraform 1.3.0 or later and either `manage cloud-guard-family in tenancy` or `manage all-resources in tenancy` permission.
   - State clearly that the module enables Cloud Guard when it is disabled and does not disable it.
   - Provide, but never run: `terraform init`, `terraform validate`, `terraform plan`, and `terraform apply`.
   - State that the plan requires review before apply, especially because associating a Security Zone with a compartment replaces any existing Cloud Guard target there and applies to its subcompartments.

## Boundaries

- Use only `git::https://github.com/oci-landing-zones/terraform-oci-modules-security.git//security-zones?ref=<ref>`; default `<ref>` to `main` unless the user provides a release tag or commit SHA. Treat `https://github.com/oci-landing-zones/terraform-oci-modules-security/tree/main/security-zones` as the canonical upstream folder path.
- Support only Security Zone recipes and Security Zones defined by `security_zones_configuration`. Do not generate Cloud Guard targets, detector recipes, responder recipes, responders, problem remediation, IAM, networks, Vault keys, or raw `oci_*` substitutes.
- Do not run `terraform`, `tofu`, package-manager, provider-login, OCI write, or install commands.
- Do not create, modify, replace, move, delete, import, or unlock Terraform state; do not create a lock file or `.terraform` directory.
- Do not put private-key material, passwords, tokens, or other secrets in `terraform.tfvars`, examples, or repository files.

## Reference routing

| Need at this stage | Read |
| --- | --- |
| Confirm supported capabilities and side effects | [module.md](references/module.md) |
| Collect recipes, zones, and optional inputs | [input-collection.md](references/input-collection.md) |
| Update, remove, or destroy a resource | [lifecycle-safety.md](references/lifecycle-safety.md) |
| Create the source, provider, or minimal project baseline | [terraform-sources.md](references/terraform-sources.md) |
| Validate values and relationships | [validation.md](references/validation.md) |
| Map validated values to Terraform files | [main-tf-map.md](references/main-tf-map.md) |
