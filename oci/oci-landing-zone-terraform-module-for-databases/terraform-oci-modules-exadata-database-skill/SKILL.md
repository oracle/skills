---
name: build-oci-exadata-database-main-tf
description: "Generate or update Terraform configuration only for OCI Exadata Database Service on Dedicated Infrastructure with the upstream `oci-landing-zones/terraform-oci-modules-oracle-database/tree/main/exadata-database` folder. Use for Cloud Exadata Infrastructure, Cloud VM Clusters, DB Homes, Container Databases, and Pluggable Databases. Validate only required and supplied inputs of the requested module objects through OCI MCP; never deploy, run Terraform, or gate configuration generation on operational deployment prerequisites. Explain relevant VCN, subnet, route, security-control, and Object Storage requirements as non-blocking deployment context only. Never create IAM or network prerequisite resources."
---

# Build OCI Exadata Database Terraform

Generate Exadata resource configurations only. Default to additive-only changes. Never invent a module path, input name, resource model, or prerequisite value. Never create or remediate IAM, API keys, VCNs, subnets, route tables, gateways, NSGs, or Object Storage connectivity. Do create only the Exadata resource families supported by the module: Cloud Exadata Infrastructure, Cloud VM Clusters, DB Homes, Container Databases, and Pluggable Databases. Never mutate, replace, rename, move, or delete an existing resource unless the user explicitly and unambiguously requests that exact change. Never install or execute Terraform.

## Required workflow

1. Inspect the target before writing.
   - Inspect the project root, Terraform files, provider/backend setup, established layout, and any existing module blocks.
   - For an update, recovery, removal, or deletion, inspect accessible local Terraform state read-only for the exact state address. Never modify state or run Terraform state commands.
   - Treat it as an existing project when a project or configuration is in scope. Otherwise ask for a target directory; do not hardcode one or overwrite unrelated files.
   - Read [references/module.md](references/module.md) first. If the request is outside the module's five resource families, say: **"The Terraform module for `<capability>` is not supported by `oci-landing-zones/terraform-oci-modules-oracle-database/tree/main/exadata-database`."**
   - Read [references/lifecycle-safety.md](references/lifecycle-safety.md) for any non-additive request.

2. Collect inputs in dependency order.
   - Read [references/reference.md](references/reference.md) before collecting inputs. Treat it as informational deployment context, not a generation gate.
   - Validate only values supplied by, or required in, the requested module object. Never request VCN, subnet, route, NSG, or Object Storage values for a standalone `cloud_exadata_infrastructures_configuration`. Do not block generation for any operational deployment prerequisite that is not a requested-object input.
   - Read the applicable sections in [references/input-collection.md](references/input-collection.md). Collect shared tenancy and compartment values first; collect VCN/subnet, subscription, and SSH-key values only for the resource families that use them, in infrastructure → VM cluster → DB home → database → PDB order.
   - Read the upstream `SPEC.md` before writing any resource objects so the generated configuration matches the module's exact structure and nested attributes.
   - Preserve literal OCIDs and map-key references. Do not infer an OCID, availability domain, database/GI/system version, capacity, or network topology.
   - Ask whether the user wants documented optional inputs only after all required inputs are present. If declined, use documented defaults; never invent optional values.
   - Treat database passwords, TDE wallet passwords, API private-key passwords, and remote-clone credentials as secrets. Do not place them in tracked files or echo them back; use a secure secret-injection mechanism already established by the project.
   - Read [references/terraform-sources.md](references/terraform-sources.md) before writing a module block.

3. Validate before producing usable configuration.
   - Read [references/validation.md](references/validation.md) only after inputs are collected.
   - Apply every non-placeholder rule. OCI MCP validation is mandatory: pause if the `get_oci_command_help` and `run_oci_command` OCI MCP tools are unavailable or cannot be invoked. Pause for a corrected value when an input is missing or known invalid. Do not claim OCI-side availability, quota, capacity, version compatibility, or IAM access has been verified unless it was actually verified through the required OCI MCP read.
   - For an existing-resource mutation, require confirmed Terraform-state ownership before proposing it.
4. Generate after validation succeeds.
   - Read [references/main-tf-map.md](references/main-tf-map.md).
   - In an existing project, preserve its layout, provider/backend blocks, naming, variables, and secret-handling approach. Make the smallest scoped change; do not add a duplicate module block.
   - In a new project, create exactly `main.tf`, `variables.tf`, and `terraform.tfvars`. Include the OCI provider baseline and module block in `main.tf`; typed declarations in `variables.tf`; only validated non-secret literal values in `terraform.tfvars`. Never place Terraform functions, interpolations, traversals, or dynamic expressions (including `file()`, `templatefile()`, `${...}`, or `path.module`) in a `.tfvars` file. Resolve repository-local public-key files in `main.tf` with a local value or module-argument merge; make the corresponding variable attribute optional when that expression supplies it.
   - Default the module source to `ref=main`. Use a release tag or commit SHA only when the user explicitly provides one; do not ask the user to approve the default.

5. Hand off without execution.
   - Tell the user this upstream module requires Terraform 1.5.0 or later.
   - Provide, but never run: `terraform init`, `terraform validate`, `terraform plan`, and `terraform apply`.
   - Explain that an Exadata operation can take many hours, and the plan must be reviewed before apply. The upstream documentation notes that a later apply may resume after certain transient provisioning conflicts; do not promise that it will.

## Boundaries

- Use only `git::https://github.com/oci-landing-zones/terraform-oci-modules-oracle-database.git//exadata-database?ref=<ref>` for the module source; default `<ref>` to `main` unless the user explicitly provides a release tag or commit SHA. Treat `https://github.com/oci-landing-zones/terraform-oci-modules-oracle-database/tree/main/exadata-database` as the canonical upstream folder path.
- Support only Cloud Exadata Infrastructure, Cloud VM Clusters, DB Homes, Container Databases, and Pluggable Databases. Do not generate IAM, VCN, subnet, route-table, gateway, NSG, or Object Storage prerequisite resources. Do not substitute direct `oci_*` resources or a different module.
- Do not run `terraform`, `tofu`, package-manager, provider-login, OCI write, or install commands.
- Do not create, modify, replace, move, delete, import, or unlock Terraform state; do not create a lock file or `.terraform` directory.
- Do not put private-key material, passwords, tokens, or wallet secrets in `terraform.tfvars`, examples, or repository files.

## Reference routing

| Need at this stage | Read |
| --- | --- |
| Confirm supported capabilities and module contract | [module.md](references/module.md) |
| Confirm deployment prerequisites and network baseline | [reference.md](references/reference.md) |
| Collect resource-family inputs | [input-collection.md](references/input-collection.md) |
| Update, remove, recover, or destroy a resource | [lifecycle-safety.md](references/lifecycle-safety.md) |
| Create the source, provider, or minimal project baseline | [terraform-sources.md](references/terraform-sources.md) |
| Validate values and dependencies | [validation.md](references/validation.md) |
| Map validated values to Terraform files | [main-tf-map.md](references/main-tf-map.md) |
