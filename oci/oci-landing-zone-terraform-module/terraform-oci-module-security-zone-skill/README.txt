Build OCI Security Zones Terraform Skill
========================================

This skill safely generates or updates Terraform root configuration for OCI
Security Zones by using only the supported module folder:
https://github.com/oci-landing-zones/terraform-oci-modules-security/tree/main/security-zones

It supports Cloud Guard Security Zone recipes and Security Zones. It does not
generate Cloud Guard targets, detector or responder recipes, responders,
problem remediation, IAM, network, or other security-service resources. For
unsupported requests, it reports that the Terraform module is not supported
instead of inventing an alternative.

How this skill works
--------------------

1. Inspects the target Terraform project before making changes.
2. Checks module.md to confirm the requested capability is a supported recipe
   or Security Zone resource.
3. Collects tenancy, authorized group, recipe, and Security Zone inputs from
   input-collection.md, preserving literal OCIDs and stable logical map keys.
4. Asks whether the user wants documented optional parameters, then validates
   the completed inputs and required Cloud Guard authorization with OCI MCP.
5. Uses terraform-sources.md and main-tf-map.md to generate the smallest safe
   configuration change.
6. Does not run or install Terraform. It hands off terraform init, validate,
   plan, and apply for the user to run; Terraform 1.3.0 or later is required,
   and the plan must be reviewed before applying.


How to use
----------

Unzip this folder and put the /references and SKILL.md in a folder named
`build-oci-security-zones-main-tf`.

Load this skill into an agent whenever the use case is to create or update OCI
Security Zones Terraform using the
`oci-landing-zones/terraform-oci-modules-security` repository's
`security-zones` folder. Typical requests include creating Security Zone
recipes and associating Security Zones with compartments.

After loading, the agent reads `SKILL.md` first and follows its
reference-routing workflow: confirm support, inspect the target, collect
inputs, ask about optional parameters, validate the values and required IAM
policy through OCI MCP, then generate the smallest safe Terraform change. The
agent must not run or install Terraform, create adjacent Cloud Guard, IAM, or
network resources, or place private keys, passwords, tokens, or other secrets
in repository files.

The skill is additive by default. It preserves existing project layout and
does not modify Terraform state. Updates, moves, removals, recovery, and
deletion requests require the extra lifecycle checks in lifecycle-safety.md.
The module enables Cloud Guard if it is disabled, but does not disable it. A
Security Zone applies to its compartment and subcompartments and replaces any
existing Cloud Guard target for that compartment, so the user must review the
Terraform plan before applying it.


Reference files
---------------

module.md
  The upstream support allowlist for Security Zone recipes and Security Zones,
  unsupported-capability response, Cloud Guard side effects, CIS levels, and
  tenancy-root safeguards.

input-collection.md
  Module-specific input checklist and structural checks. It covers tenancy
  resolution, authorized IAM group validation metadata, recipe and zone maps,
  compartment dependencies, optional inputs, and stable logical keys.

terraform-sources.md
  The canonical Git module source format, Terraform version requirement, and
  integration rules for existing repositories or a new minimal Terraform
  workspace.

validation.md
  The validation contract: mandatory OCI MCP policy verification for
  `manage cloud-guard-family in tenancy`, tenancy and compartment OCID checks,
  recipe-to-zone relationships, root-compartment safety, and lifecycle gates.

main-tf-map.md
  Rules for mapping validated values into main.tf, variables.tf, and
  terraform.tfvars. It explains the required nested recipes and Security Zones
  object shape while preserving repository conventions.

lifecycle-safety.md
  Additional guardrails for updates, map-key changes, remove-from-
  configuration, and deletes. It covers Terraform state ownership, dependent
  recipe references, compartment scope, potential target replacement, and the
  required plan-review warning.

Quick reference flow
--------------------

request -> module.md -> input-collection.md + terraform-sources.md ->
validation.md -> main-tf-map.md -> generate safely

For lifecycle changes, read lifecycle-safety.md before collecting inputs and
apply its state-ownership requirements together with validation.md before
proposing a configuration change.
