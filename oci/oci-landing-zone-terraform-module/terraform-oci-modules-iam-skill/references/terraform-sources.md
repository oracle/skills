# Terraform sources, repository integration, and minimal-workspace baseline

Read this reference after module support has been confirmed and before creating a module block. It applies both when updating an existing repository and when creating a minimal Terraform workspace.

## Canonical upstream source

Use this exact source form for every supported module:

```hcl
source = "git::https://github.com/oci-landing-zones/terraform-oci-modules-iam.git//<submodule>?ref=<ref>"
```

Replace `<submodule>` only with `compartments`, `groups`, `dynamic-groups`, `policies`, or `identity-domains`. Replace `<ref>` with a user-approved release tag or immutable commit SHA.

- Ask the user for a pin if one is not supplied for production use.
- Use `ref=main` only for a clearly marked evaluation draft with the user's approval.
- Confirm each module's current `README.md` and `SPEC.md` before emitting its input arguments.
- If the requested capability has no listed submodule, report that the Terraform module is not supported. Do not substitute a direct provider resource or a custom module.

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
  source = "git::https://github.com/oci-landing-zones/terraform-oci-modules-iam.git//groups?ref=<release-tag-or-commit-sha>"

  tenancy_id           = var.tenancy_ocid
  groups_configuration = var.groups_configuration
}
```

The argument names are module-specific. Do not copy `tenancy_id` or `groups_configuration` into another module without confirming its current specification.

## Minimal workspace mode

Use this mode only when no project is in scope. Ask the user for the target directory; do not assume or hardcode one. Create only these files unless the user asks for more:

```text
main.tf
variables.tf
terraform.tfvars
```

### `main.tf` baseline

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

### `terraform.tfvars` baseline

```hcl
tenancy_ocid     = "<tenancy-ocid>"
user_ocid        = "<user-ocid>"
fingerprint      = "<api-key-fingerprint>"
private_key_path = "<local-private-key-path>"
region           = "<oci-region>"
```

Replace placeholders only with validated, non-secret values. Do not place private-key contents, tokens, passwords, or other secrets in this file. Suggest a `.gitignore` entry when appropriate, but do not change unrelated files unless asked.

## Execution handoff

Do not install Terraform and do not execute commands. After generating the configuration, tell the user to install Terraform 1.3.0 or later if it is unavailable, then provide:

```bash
terraform init
terraform validate
terraform plan
terraform apply
```

Ask the user to review the plan before applying it.
