# Terraform source and project integration

## Canonical module source

Use exactly:

```hcl
source = "git::https://github.com/oci-landing-zones/terraform-oci-modules-security.git//security-zones?ref=<ref>"
```

Default `<ref>` to `main`; use a release tag or commit SHA only when the user supplies one. Confirm current upstream `SPEC.md` and `variables.tf` before emitting arguments.

## Existing project

Inspect and preserve provider aliases, required-provider constraints, backend, naming, file layout, and variable-data convention. Reuse a compatible OCI provider. Add to the existing Security Zones module when present; do not add a duplicate module, provider, or backend.

Do not write API private-key contents, tokens, or other secrets into source or variable files.

## New project baseline

Only after the user provides a target directory, create `main.tf`, `variables.tf`, and `terraform.tfvars`. Require Terraform `>= 1.3.0`, declare OCI provider authentication variables without embedding secrets, and use the typed Security Zones configuration in `variables.tf`.

The executing OCI principal requires `manage cloud-guard-family in tenancy`; explain it as an apply-time requirement, not a reason to generate configuration.
