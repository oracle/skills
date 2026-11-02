Build OCI Exadata Database Terraform Skill
===========================================

This skill safely generates or updates Terraform root configuration for OCI
Exadata Database Service on Dedicated Infrastructure by using only:
https://github.com/oci-landing-zones/terraform-oci-modules-oracle-database/tree/main/exadata-database

It supports Cloud Exadata Infrastructure, Cloud VM Clusters, DB Homes,
Container Databases, and Pluggable Databases. It does not create IAM, VCN,
subnet, route-table, gateway, NSG, or Object Storage prerequisite resources.
For unsupported requests, it reports that the Terraform module is not
supported instead of inventing an alternative.

How this skill works
--------------------

1. Inspects the target Terraform project before making changes.
2. Checks module.md to confirm the requested resource family is supported.
3. Collects required inputs in infrastructure -> VM cluster -> DB home ->
   container database -> PDB order, using input-collection.md.
4. Treats network, security, and Object Storage requirements in reference.md
   as non-blocking deployment context; it never creates or remediates them.
5. Validates required and supplied configuration inputs with validation.md
   through OCI MCP before producing usable Terraform configuration.
6. Uses terraform-sources.md and main-tf-map.md to generate the smallest safe
   configuration change.
7. Does not run or install Terraform. It hands off terraform init, validate,
   plan, and apply for the user to run; Terraform 1.5.0 or later is required,
   and the plan must be reviewed before applying.


How to use
----------

Unzip this folder and put the /references and SKILL.md in a folder named
`build-oci-exadata-database-main-tf`.

Load this skill into an agent whenever the use case is to create or update OCI
Exadata Database Service on Dedicated Infrastructure Terraform using the
`oci-landing-zones/terraform-oci-modules-oracle-database` repository's
`exadata-database` folder. Typical requests include Cloud Exadata
Infrastructure, Cloud VM Clusters, DB Homes, Container Databases, and
Pluggable Databases.

After loading, the agent reads `SKILL.md` first and follows its
reference-routing workflow: confirm support, inspect the target, collect
resource-specific inputs, ask about documented optional inputs, validate with
OCI MCP, then generate the smallest safe Terraform change. The agent must not
run or install Terraform, create prerequisite IAM or network resources, or
place private keys, passwords, wallet secrets, or tokens in repository files.

The skill is additive by default. It preserves existing project layout and
does not modify Terraform state. Updates, moves, removals, recovery, and
deletion requests require the additional lifecycle checks in
lifecycle-safety.md. Exadata operations can take many hours; the user must
review the Terraform plan before applying it.


Reference files
---------------

module.md
  The upstream support allowlist, exact module folder, supported resource
  families, unsupported-capability response, and resource dependency model.

reference.md
  Informational deployment context for tenancy access, API-key authentication,
  VCNs, client and backup subnets, security controls, and Object Storage
  connectivity. These are not configuration-generation gates.

input-collection.md
  Module-specific input checklist and object-shape rules. Its sections cover
  Cloud Exadata Infrastructure, Cloud VM Clusters, DB Homes, Container
  Databases, and Pluggable Databases, including secret-handling requirements.

terraform-sources.md
  The canonical Git module source format, approved module folder, Terraform
  version requirement, and integration rules for existing repositories or a
  new minimal Terraform workspace.

validation.md
  The validation contract: mandatory OCI MCP checks, identifier validation,
  dependency readiness, configuration scope, lifecycle validation, and secure
  handling of credentials and passwords.

main-tf-map.md
  Rules for mapping validated values into main.tf, variables.tf, and
  terraform.tfvars. It explains how to retain the Exadata Infrastructure ->
  VM Cluster -> DB Home -> Container Database -> PDB dependency chain while
  preserving repository conventions.

lifecycle-safety.md
  Additional guardrails for updates, moves, recovery, remove-from-
  configuration, and deletes. It covers state ownership, dependencies,
  immutable fields, and the required two-stage DB Home/database deletion flow.

Quick reference flow
--------------------

request -> module.md -> relevant input-collection.md section + reference.md +
terraform-sources.md -> validation.md -> main-tf-map.md -> generate safely

For lifecycle changes, read lifecycle-safety.md before collecting inputs and
apply its state-ownership requirements together with validation.md before
proposing a configuration change.
