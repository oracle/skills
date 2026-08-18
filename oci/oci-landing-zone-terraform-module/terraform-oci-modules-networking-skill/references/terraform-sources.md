# Terraform source, dependencies, and pipeline integration

## Canonical source

Use only the upstream root module:

```hcl
source = "git::https://github.com/oci-landing-zones/terraform-oci-modules-networking.git?ref=<release-tag-or-commit-sha>"
```

Reuse the existing approved pin. If no pin exists, require a customer-approved release tag or immutable commit SHA for production. Use `ref=main` only for an explicitly approved evaluation draft. Confirm the selected version's `README.md` and `SPEC.md` before emitting arguments.

## Documented dependency shapes

`compartments_dependency` is a map whose objects contain an `id` compartment OCID. `network_dependency` is a map organized by supported resource family; for this scope, use `network_dependency.vcns.<key>.id` for an externally managed VCN. Avoid inventing dependency shapes or using an external key where the SPEC requires an OCID.

## Existing repository integration

- Inspect provider blocks, aliases, required-provider constraints, backend, Terraform version, module source pins, variable/local conventions, and `.gitignore` before editing.
- Reuse the compatible provider and aliases. Pass a provider alias to the module only when the module documentation supports it and the existing project requires the same tenancy/region context.
- Preserve backend/state model, module source pin, authentication, file layout, formatting, naming, and variable-data convention. Avoid adding a provider, backend, lock file, or `.terraform` directory.
- Extend an existing root networking module's data rather than adding a duplicate. Choose non-conflicting names only when a new root module is required.
- Keep private keys, secrets, tokens, and credentials out of generated configuration and chat examples.

## Empty starting point: minimal workspace mode

Use this mode only when no Terraform project, compatible networking module, provider block, or established configuration convention is in scope. Ask for the target directory, customer-approved module pin, and approved pipeline authentication mechanism; avoid assuming any of them. Create exactly these files unless the customer asks for more:

```text
main.tf
variables.tf
terraform.tfvars
```

Avoid creating a backend configuration, lock file, `.terraform` directory, or pipeline files. The customer's pipeline remains responsible for backend and state configuration.

### `main.tf` baseline

Include Terraform `>= 1.3.0`, the OCI required provider, one OCI provider block using variables for the selected approved authentication model, and one root networking module invocation:

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

module "networking" {
  source = "git::https://github.com/oci-landing-zones/terraform-oci-modules-networking.git?ref=<customer-approved-release-or-commit>"

  network_configuration = var.network_configuration
}
```

Use this API-key provider example only when it matches the customer's approved pipeline authentication. For instance principals, resource principals, security-token, or environment-variable authentication, model only the documented provider settings the customer approves. Avoid guessing aliases, credentials, tenancy, region, or a source pin.

### `variables.tf` baseline

For the API-key baseline, declare `tenancy_ocid`, `user_ocid`, `fingerprint`, `private_key_path`, and `region` as strings. Add a typed `network_configuration` variable copied from the selected upstream release's `SPEC.md`; avoid weakening it to `any`. Add `compartments_dependency` or `network_dependency` declarations only when the approved topology uses them.

### `terraform.tfvars` baseline

Put validated, non-secret topology values in the established variable-data file. Use placeholders for unsupplied provider values and preserve private-key contents, tokens, passwords, and pipeline credentials outside the file. For an API-key pipeline, `private_key_path` may be a pipeline-managed path but must never contain the key itself.

### Empty-workspace output discipline

- Create one `network_configuration` object and one root networking module block, covering only supported requested components.
- Keep new VCNs under `vcns`; use `inject_into_existing_vcns` only when the customer supplies and validates an existing VCN OCID/dependency.
- State the approved source pin, authentication assumption, absence of a backend configuration, and required pipeline validation/plan/apply handoff.

## Pipeline handoff

Never run local Terraform operations. Direct the customer to their pipeline's approved init, validation, plan, approval, and apply process. Require plan review, especially for public exposure, routing, security-rule, replacement, and destroy actions.
