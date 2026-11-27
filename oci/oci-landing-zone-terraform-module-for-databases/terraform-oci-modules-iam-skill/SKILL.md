---
name: build-oci-iam-main-tf
description: "Generate or update safe Terraform root configurations for OCI IAM with the upstream `oci-landing-zones/terraform-oci-modules-iam` repository. Use for OCI compartments and hierarchy, classic IAM groups (including member assignment), dynamic groups, IAM policies, and OCI Identity Domains resources when the request must be mapped to a supported upstream module, inputs collected and validated, and `main.tf`, `variables.tf`, and `terraform.tfvars` produced. Also use to determine support: clearly report 'the Terraform module for the requested capability is not supported' for requests outside the repository's documented modules, including standalone classic users or memberships and Cloud Guard security zones."
---

# Build OCI IAM Terraform

Generate only configurations that the upstream repository supports. Default to additive-only changes. Never invent a module path, input name, or resource model, never mutate, replace, rename, move, or re-parent an existing resource unless the user explicitly and unambiguously asks for that exact resource change, and never install or execute Terraform.

## Required workflow

1. Inspect the target before writing.
   - Inspect the project root, its Terraform files, repository documentation, provider/backend setup, and established file layout. A `.tf` file is only one signal; do not assume its presence or absence alone defines the project.
   - For an update, move, recovery, removal, or deletion, inspect any accessible local Terraform state file read-only to establish the exact state address. Never modify a state file or run a Terraform state command.
   - Treat it as an existing project when the user has placed a project in scope or an established configuration is present. Otherwise, create a minimal configuration in a user-selected target directory; ask for the target if none is available. Do not hardcode or assume a local path, and do not overwrite unrelated files.
   - If the request would change an existing resource, proceed only when the user explicitly names that existing resource and the intended mutation; otherwise stop and ask for confirmation or a narrower request.
   - Read [references/module-support.md](references/module-support.md) first. Resolve every requested capability to an exact supported subdirectory.
   - If any requested capability has no supported module, do not produce an alternative implementation. Tell the user: **"The Terraform module for `<capability>` is not supported by `oci-landing-zones/terraform-oci-modules-iam`."** Name the supported alternatives only when relevant.
   - For any update, move, recovery, removal, or deletion request, read [references/lifecycle-safety.md](references/lifecycle-safety.md) before collecting inputs or proposing a change.

2. Collect inputs by module.
   - Read only the relevant section in [input collection](references/input-collection.md): compartments, groups, dynamic groups, policies, or Identity Domains.
   - Ask concise follow-up questions for required values that are not present. Preserve literal OCIDs and parent-child relationships; do not fabricate them.
   - After required inputs are complete and before reading `validation.md`, you must ask whether the user wants to provide any documented optional parameters for the selected module. Do not read `validation.md` until the user has either provided those optional values or explicitly declined them. If they decline, use documented defaults only; never invent optional values.
   - Read [references/terraform-sources.md](references/terraform-sources.md) before creating any module block. It defines the canonical Git source format.

3. Validate before generating usable configuration.
   - Read [references/validation.md](references/validation.md) after all requested inputs are collected.
   - Apply every non-placeholder rule. If an input is missing or known invalid, pause and ask for its corrected value; never proceed with known invalid inputs. If OCI MCP is unavailable, tell the user that MCP validation was skipped and continue only with non-MCP validation rules.
   - For update, move, recovery, removal, or destroy requests, require Terraform-state existence before proposing the mutation. If a dedicated validation section is not yet defined for the selected resource family, apply the common rules and its collection-reference structural checks only; do not invent additional rules.

4. Generate after validation succeeds.
   - Read [references/main-tf-map.md](references/main-tf-map.md) and the relevant source snippets.
   - In an existing project, always preserve the repository's established style and layout when adding or mutating a resource: file placement, formatting, naming, variable-data convention, provider/backend configuration, module organization, and Terraform version constraints. Only mutate an existing resource when the user explicitly asks for that exact resource change. Prefer the smallest additive change possible. Update or add `main.tf`, `variables.tf`, and `terraform.tfvars` only when compatible with that setup.
   - In a new project, create exactly `main.tf`, `variables.tf`, and `terraform.tfvars`. Include an OCI provider block and required-provider constraint. Keep authentication values as variables and do not put private keys, API keys, tokens, or passwords in `terraform.tfvars`.
   - Put module source, module wiring, and provider configuration in `main.tf`; declarations and types in `variables.tf`; validated non-secret example values in `terraform.tfvars`.

5. Hand off without running commands.
   - Tell the user Terraform 1.3.0 or later is required by the upstream modules and must be installed before use.
   - Provide, but never run: `terraform init`, `terraform validate`, `terraform plan`, and `terraform apply`.
   - State that `terraform plan` must be reviewed before `terraform apply`.

## Boundaries

- Use only the source repository and subdirectories listed in `module-support.md`.
- Do not silently substitute direct `oci_*` resources for an unavailable submodule.
- A classic IAM **group** can assign existing user names as members. There is no separate `users` or `memberships` top-level module; reject requests that require creating users or managing memberships independently.
- Do not claim Cloud Guard support. It belongs to other OCI landing-zone module collections, not this repository.
- Do not run `terraform`, `tofu`, package-manager, provider-login, or install commands.
- Do not create, modify, replace, move, or delete a state file. Do not create a lock file or `.terraform` directory.

## Reference routing

Read references only along this path; do not load every file for every request.

```text
request
  -> module-support.md
       -> unsupported: report "Terraform module is not supported" and stop
       -> supported: relevant input reference + terraform-sources.md
            -> validation.md
                 -> main-tf-map.md
                      -> generate or update the project files
```

| Need at this stage | Read |
| --- | --- |
| Confirm an exact submodule or reject a request | [module-support.md](references/module-support.md) |
| Update, move, recover, remove, or delete a resource | [lifecycle-safety.md](references/lifecycle-safety.md) |
| Build exact Git sources and provider baseline | [terraform-sources.md](references/terraform-sources.md) |
| Collect OCI IAM groups | [input-collection.md — Groups](references/input-collection.md#groups) |
| Collect OCI IAM dynamic groups | [input-collection.md — Dynamic groups](references/input-collection.md#dynamic-groups) |
| Collect OCI IAM policies | [input-collection.md — Policies](references/input-collection.md#policies) |
| Collect compartment hierarchy data | [input-collection.md — Compartments](references/input-collection.md#compartments) |
| Collect Identity Domains data | [input-collection.md — Identity Domains](references/input-collection.md#identity-domains) |
| Map validated values to files | [main-tf-map.md](references/main-tf-map.md) |
| Apply the future validation contract | [validation.md](references/validation.md) |
