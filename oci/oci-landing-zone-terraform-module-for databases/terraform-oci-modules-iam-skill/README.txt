Build OCI IAM Terraform Skill
===============================

This skill safely generates or updates Terraform root configuration for OCI IAM
by using only the supported modules from:
https://github.com/oci-landing-zones/terraform-oci-modules-iam

It supports compartment hierarchies, classic IAM groups (including assigning
existing users), dynamic groups, IAM policies, and Identity Domains resources.
It does not create classic IAM users, manage standalone memberships, or manage
Cloud Guard security zones/recipes. For unsupported requests, it reports that
the Terraform module is not supported instead of inventing an alternative.

How this skill works
---------------------

1. Inspects the target Terraform project before making changes.
2. Checks module-support.md to confirm the requested capability has an upstream
   submodule.
3. Collects required inputs from the matching input-collection.md section.
4. Ask whether the user wants documented optional parameters, then validate the
   completed inputs with validation.md.
5. Uses terraform-sources.md and main-tf-map.md to generate the smallest safe
   configuration change.
6. This skill not run or install Terraform. It Hands off terraform init, validate, plan,
   and apply for the user to run; Terraform 1.3.0 or later is required and the
   plan must be reviewed before applying.


How to use
----------

Unzip this folder and put the /references and SKILL.md in a folder named `build-oci-iam-main-tf`

Load this skill into an agent whenever the use case is to create or update OCI IAM
Terraform using the `oci-landing-zones/terraform-oci-modules-iam` repository.
Typical requests include compartments, IAM groups, dynamic groups, IAM policies,
and Identity Domains resources.

After loading, the agent reads `SKILL.md` first and follows its reference-routing
workflow: confirm support, collect inputs, ask about optional parameters,
validate the values, then generate the smallest safe Terraform change. The agent
must not run or install Terraform, and it must hand off `terraform init`,
`terraform validate`, `terraform plan`, and `terraform apply` for the user to
run. Terraform 1.3.0 or later is required, and the user must review the plan
before applying it.

The skill is additive by default. It preserves existing project layout and does
not modify Terraform state. Updates, moves, removals, recovery, and deletion
requests require the extra lifecycle checks in lifecycle-safety.md.


Reference files
---------------

module-support.md
  The upstream support allowlist: exact module directories for compartments,
  groups, dynamic-groups, policies, and identity-domains. It also identifies
  unsupported capabilities and provides the required rejection wording.

input-collection.md
  Module-specific input checklist and structural checks. Its sections cover
  compartments, groups, dynamic groups, policies, and Identity Domains. It
  distinguishes required data from optional parameters, handles secrets safely,
  and requires an optional-input question before validation.

terraform-sources.md
  The canonical Git module source format, approved module paths, version-pin
  guidance, and integration rules for existing repositories or a new minimal
  Terraform workspace.

validation.md
  The validation contract: tenancy OCID checks through the OCI MCP interface,
  lifecycle state requirements, compartment hierarchy checks, and safe behavior
  when validation is missing or fails.

main-tf-map.md
  Rules for mapping validated data into main.tf, variables.tf, and
  terraform.tfvars. It explains when to extend an existing module versus add a
  supported module block, while preserving repository conventions.

lifecycle-safety.md
  Additional guardrails for updates, moves, recovery, remove-from-configuration,
  and deletes. It covers state ownership, dependencies, compartment deletion
  staging, and the required user-facing plan review warning.

Quick reference flow
--------------------

request -> module-support.md -> relevant input-collection.md section +
terraform-sources.md -> validation.md -> main-tf-map.md -> generate safely

For lifecycle changes, read lifecycle-safety.md before collecting inputs and
apply the state checks in validation.md before proposing a configuration change.
