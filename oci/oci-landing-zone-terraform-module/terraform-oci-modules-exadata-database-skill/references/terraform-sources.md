# Terraform source and project integration

## Canonical source

Use this exact module source:

```hcl
source = "git::https://github.com/oci-landing-zones/terraform-oci-modules-oracle-database.git//exadata-database?ref=<release-tag-or-commit-sha>"
```

Default to `ref=main`. Use a release tag or immutable commit SHA only when the user explicitly provides one; do not request approval for `main`. The upstream module currently requires Terraform `>= 1.5.0`.

Canonical upstream folder path for this skill: `https://github.com/oci-landing-zones/terraform-oci-modules-oracle-database/tree/main/exadata-database`.

## Existing project

Reuse compatible existing OCI providers, aliases, required-provider constraints, backend, variables, module naming, and secret-injection approach. Do not add a duplicate provider, backend, or Exadata module block. Extend the existing module's configuration object when it already manages the requested resource family.

## New project baseline

Create only `main.tf`, `variables.tf`, and `terraform.tfvars` in the user-selected directory. Use the existing project's authentication method where available; otherwise use an API-key provider baseline. Keep private key paths—not contents—in variables. Omit `private_key_password` and all database, wallet, or clone secrets from `terraform.tfvars`; declare them sensitive and document the chosen secure injection path.
