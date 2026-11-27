---
name: build-oci-security-zones-main-tf
description: "Generate or update OCI Security Zones Terraform with the upstream `oci-landing-zones/terraform-oci-modules-security/tree/main/security-zones` module only when the user explicitly intends to perform a specific OCI Database Service operation after applying the configuration. Use only for a database-focused recipe and a zone scoped to the compartment for that operation. Ask for the database resource type only when needed to clarify the operation or assess policy applicability; it is not a Security Zone or module input. Do not use for standalone or general-purpose Security Zone work. Never deploy, run Terraform, or generate other security services, Cloud Guard targets, detectors, responders, IAM, or network resources."
---

# Build OCI Security Zones Terraform for Database Operations

Generate only the upstream Security Zones module configuration. Default to additive-only changes. Never invent a module path, input name, resource model, policy OCID, compartment relationship, or prerequisite value. Never mutate, replace, rename, move, or delete an existing resource unless the user explicitly and unambiguously requests that exact change. Never install or execute Terraform.

## Applicability gate: database operation required

Use this skill only when the user explicitly says that, after this Security Zone configuration is applied, they intend to perform a specific OCI Database Service operation. A Security Zone request, a general security goal, or a possible future database use is not sufficient. Before inspecting or editing Terraform, confirm the intended operation and the compartment where it will occur. If either is unclear or missing, ask for it and pause. Ask for the database resource type only when it is needed to clarify the operation or assess whether a selected policy applies; it is not a required Security Zone or Terraform module input.

The configured recipe must be database-focused: user-selected additional policies must have a documented Database service/resource scope. Explain before collecting inputs that this module creates custom recipes, not the Oracle-managed Maximum Security Recipe, and that it always adds at least CIS Level 1 policies, including `deny public_buckets`; Level 2 adds further non-Database policies. If the user requires a recipe containing only Database-scoped policies, stop because this module cannot produce that configuration. Continue only after the user acknowledges the applicable CIS baseline and the compartment-wide policy effects. This acknowledgement is a skill workflow safeguard, not an OCI API prerequisite. Do not use Maximum Security Recipe compatibility lists or exclusions as compatibility rules for custom recipes; those statements apply only to the Oracle-managed Maximum Security Recipe. Do not claim custom-recipe compatibility unless the selected policies' documented scope supports that claim.

## Required workflow

1. Confirm applicability, then inspect the target before writing.
   - Read [references/module.md](references/module.md) first. Apply the database-operation gate above before any project inspection. If the intended operation or target compartment is missing or unclear, ask for it and pause. Ask for a resource type only if needed to clarify the operation or determine a selected policy's documented applicability. If the user requires Oracle's Maximum Security Recipe or a strictly Database-only policy set, explain that this module cannot provide it and stop.
   - Explain that Security Zone policies apply to every resource in the target compartment and its subcompartments, not only the database. Obtain the user's acknowledgement as a skill workflow safeguard; do not describe it as an OCI API prerequisite.
   - Inspect the project root, Terraform files, provider/backend setup, established layout, and existing module blocks.
   - For an update, removal, or deletion, inspect accessible local Terraform state read-only for the exact state address. Never modify state or run Terraform state commands.
   - Treat it as an existing project when a project or configuration is in scope. Otherwise ask for a target directory; do not hardcode one or overwrite unrelated files.
   - If the requested capability is outside the module allowlist in `module.md`, say: **"The Terraform module for `<capability>` is not supported by `oci-landing-zones/terraform-oci-modules-security/tree/main/security-zones`."**
   - Read [references/lifecycle-safety.md](references/lifecycle-safety.md) for any non-additive request.

2. Collect exact inputs.
   - Read [references/input-collection.md](references/input-collection.md). Collect `tenancy_ocid` or a supplied compartment OCID from which to resolve it through OCI MCP, the named OCI group authorized to apply this configuration, at least one Security Zone definition, its recipe key, and the matching recipe definition first.
   - For every recipe, explain that the module cannot create an exclusively Database-scoped recipe: its minimum CIS Level 1 baseline includes `deny public_buckets`, and Level 2 also adds `deny block_volume_without_vault_key`, `deny boot_volume_without_vault_key`, `deny buckets_without_vault_key`, and `deny file_system_without_vault_key`. Require the user's explicit acceptance of these non-Database baseline policies before proceeding. Then collect `cis_level`: the module default is `"1"` unless a supplied top-level `default_cis_level` overrides it. Ask the user to select Level 1 or Level 2, or explicitly accept the applicable default. If the user requires only Database-scoped policies, stop because this module cannot meet that requirement.
   - For each recipe, ask whether the user wants specific additional Database-scoped Oracle Security Zone policies, wants to review the complete active policy catalog, or wants no additional policies. Validate only the policies the user selects through OCI MCP and add only selected returned OCIDs to the specified recipe. If they request the full catalog, present every active returned policy with its name, description, services, category, and OCID, and make clear which entries have a documented Database scope; do not imply non-Database policies are part of the database-focused selection. Never choose policies on the user's behalf. If the user declines extra policies for a recipe, omit that recipe's `security_policies_ocids`.
   - Preserve literal OCIDs and stable logical map keys. Do not infer a compartment OCID, policy OCID, reporting region, CIS level, or a recipe-to-zone association from a name.
   - Collect `compartments_dependency` only when a recipe or Security Zone uses a compartment-reference key instead of a literal compartment OCID.
   - Ask whether the user wants documented optional inputs only after all required values are present. If declined, use documented defaults; never invent optional values.
   - Read the upstream `SPEC.md` before writing configuration so the generated object matches the approved module revision's exact shape.
   - Read [references/terraform-sources.md](references/terraform-sources.md) before writing a module block.

3. Validate before producing usable configuration.
   - Read [references/validation.md](references/validation.md) only after input collection.
   - Apply every non-placeholder rule. Pause for a corrected value when a required or supplied optional input is missing or known invalid.
   - Use OCI MCP read-only commands to verify that the supplied group has an active tenancy policy granting either `manage cloud-guard-family in tenancy` or `manage all-resources in tenancy`. Resolve group OCIDs and evaluate supported multiple-group subjects as described in `references/validation.md`. This policy check is mandatory: generate usable configuration only after a grant is verified. If the overall result is not found or inconclusive, stop as described in `references/validation.md`; do not claim a grant is missing when the result is inconclusive. Required tenancy, group, and compartment lookups must succeed before generating usable configuration. Only an optional `security_policies_ocids` read may be skipped when OCI MCP has no documented read operation for it. Never use local OCI CLI or claim OCI-side validation that was skipped.
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
- Support this module only for an explicitly stated follow-on Database Service operation. Do not use it for standalone Security Zone setup or general-purpose recipes. The module creates custom recipes and cannot configure the Oracle-managed Maximum Security Recipe. Do not apply Maximum Security Recipe compatibility lists or exclusions to a custom recipe. Its minimum CIS Level 1 baseline includes a non-Database policy, so it cannot produce a strictly Database-only recipe. Additional user-selected policies must have a documented Database scope.
- Security Zone policies apply to every resource in the assigned compartment and subcompartments. Confirm the user intends that scope for the database operation before generating configuration.
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
