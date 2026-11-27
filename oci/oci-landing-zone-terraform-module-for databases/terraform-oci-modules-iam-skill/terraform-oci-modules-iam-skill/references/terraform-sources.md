# Terraform sources, repository integration, and minimal-workspace baseline

Read this reference after module support has been confirmed and before creating a module block. It applies both when updating an existing repository and when creating a minimal Terraform workspace.

## Canonical upstream source

Use this exact source form for every supported module:

```hcl
source = "git::https://github.com/oci-landing-zones/terraform-oci-modules-iam.git//<submodule>?ref=<ref>"
```

Replace `<submodule>` only with `compartments`, `groups`, `dynamic-groups`, `policies`, or `identity-domains`, for a resource type and operation admitted by the [fixed skill allowlist](module-support.md). Discovering a new module or a new resource family inside an allowed module does not authorize generating it. Replace `<ref>` with the exact selected ref; default to `main` unless the user or an existing module source specifies another ref.

- In an existing project, preserve and use the ref already present in that module's source unless the user asks to change it. If no ref is present and the user has not selected one, use `ref=main` by default. Use a user-selected release tag or commit SHA whenever provided.
- When `main` is selected, inspect its files at generation time because the branch can change. For another selected ref, inspect that exact ref; never substitute `main` when checking a tag or commit.
- Establish the exact ref before collecting module-specific inputs. At that ref, verify that the requested submodule exists and inspect its `variables.tf`, `README.md`, and `SPEC.md`.
- Check every module-block argument name and required input against that ref's `variables.tf`; check configuration object names, fields, and types against its `SPEC.md` and `README.md`.
- Treat examples in this file and other references as wiring patterns only. Resolve every illustrative marker, including source-ref markers, before generating configuration; do not emit an incomplete scaffold. If examples disagree with the selected ref, use the selected ref and correct the generated arguments and types before writing configuration.
- Follow `module-support.md` for distinct scope-exclusion, verified-upstream-absence, and unverified-support responses. A capability outside the fixed allowlist stays outside scope even if upstream implements it. Do not substitute a direct provider resource or a custom module.

## Existing repository mode

Before editing, inspect the repository's root/module layout, Terraform version constraints, required providers, provider aliases, backend, variable naming, locals, existing module names, environment conventions, and `.gitignore` policy.

### Integrate without disrupting existing setup

- Match the repository's existing Terraform style and layout when adding or changing a resource, including file placement, formatting, indentation, naming, comments, and variable-data convention.
- Reuse an existing compatible OCI provider and `required_providers` block; do not add a duplicate provider or overwrite an existing version constraint.
- Preserve provider aliases. Pass an alias to a module only if the module's documentation supports it and the current project needs that tenancy/region/account context.
- Reuse established variable files and configuration-object conventions. Add `main.tf`, `variables.tf`, or `terraform.tfvars` only when they fit the repository's structure; otherwise add the smallest compatible change to its existing layout.
- Select non-conflicting module, variable, local, and map-key names. Do not rename existing objects solely for consistency.
- Preserve the existing backend and state model. Never add, remove, or reconfigure a backend unless the user explicitly requests it.
- Put user-supplied topology and policy data in the project's existing variable-data convention. If `terraform.tfvars` is used, keep it non-secret and avoid overwriting existing values.
- Do not write environment credentials, private-key contents, tokens, or passwords into repository files.

### Existing-repository module pattern

Adapt this pattern to the project's names and provider configuration:

```hcl
module "groups" {
  source = "git::https://github.com/oci-landing-zones/terraform-oci-modules-iam.git//groups?ref=<selected-ref>"

  tenancy_ocid         = var.tenancy_ocid
  groups_configuration = var.groups_configuration
}
```

This is an illustrative pattern, not a schema guarantee for every ref. Verify both arguments against the `groups` module at the selected source ref before using it; module argument names are module- and revision-specific.

## Minimal workspace mode

Use this mode only when no project is in scope. Ask the user for the target directory; do not assume or hardcode one. Create only these files unless the user asks for more:

```text
main.tf
variables.tf
terraform.tfvars
```

### `main.tf` baseline

The provider and variable blocks below illustrate API-key authentication. Adapt them to the selected authentication method, reusing established external credential handling. Collect required non-secret settings through [required-input resolution](input-collection.md#required-input-resolution-all-modules); never collect or embed private-key contents or tokens.

```hcl
terraform {
  required_version = ">= 1.3.0"

  required_providers {
    oci = {
      source = "oracle/oci"
    }
  }
}

provider "oci" {
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
  region           = var.region
}

# Add only supported, validated module blocks below this line.
```

### `variables.tf` baseline

```hcl
variable "tenancy_ocid" {
  description = "OCI tenancy OCID."
  type        = string
}

variable "user_ocid" {
  description = "OCI user OCID for API-key authentication."
  type        = string
}

variable "fingerprint" {
  description = "OCI API-key fingerprint."
  type        = string
}

variable "private_key_path" {
  description = "Local path to the OCI API private key; do not store private-key contents in Terraform files."
  type        = string
}

variable "region" {
  description = "OCI region identifier."
  type        = string
}
```

Add the selected module's typed configuration variable after consulting that module's `SPEC.md`. Do not use `any` merely to avoid modeling the documented object.

### `terraform.tfvars` contents

Write actual resolved non-secret provider settings and module data that satisfy the applicable validation rules. For the API-key wiring above, these include the tenancy OCID, user OCID, fingerprint, private-key file path (not its contents), and region. Preserve existing input sources when integrating with a project instead of duplicating them into this file. Use only settings relevant to the selected authentication method.

If a required non-secret value is still unresolved, ask and wait before generating the affected configuration; do not write a placeholder assignment or leave a newly introduced variable unpopulated as a workaround. Supported references to requested new resources and approved external secret wiring follow the resolution rules in `input-collection.md`. Do not place private-key contents, tokens, passwords, or other secrets in this file. Identify required external credential/secret supply in the handoff. Suggest a `.gitignore` entry when appropriate, but do not change unrelated files unless asked.

## Execution handoff

Do not install Terraform and do not execute commands. After generating the configuration, tell the user to install Terraform 1.3.0 or later if it is unavailable, then provide:

```bash
terraform init
terraform validate
terraform plan
terraform apply
```

Ask the user to review the plan before applying it.
