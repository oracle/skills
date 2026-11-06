Build OCI Networking Landing Zones Terraform Skill
===================================================

This skill safely generates or updates Terraform network configuration for OCI
by using only the supported module from:
https://github.com/oci-landing-zones/terraform-oci-modules-networking

It supports VCNs, subnets, route tables, internet/NAT/service gateways,
security lists and rules, network security groups and rules, and ZPR security
attribute assignments. It does not manage ZPR policies or use direct OCI
provider resources as substitutes for unsupported module features.

How this skill works
--------------------

1. Inspects the target Terraform project before making changes.
2. Checks module-support.md to confirm the requested capability is supported.
3. Collects required inputs from the matching input-collection.md section.
4. Asks whether the user wants documented optional parameters, then validates
   the completed inputs with validation.md.
5. Uses terraform-sources.md and main-tf-map.md to make the smallest safe
   configuration change.
6. Does not install or run Terraform. It hands off Terraform validation, plan,
   and apply to the customer pipeline for review and execution.

How to use
----------

Load this skill whenever the use case is to create or update OCI networking
Terraform using `oci-landing-zones/terraform-oci-modules-networking`.

After loading, the agent reads `SKILL.md` first and follows its reference-routing
workflow: confirm support, collect inputs, ask about optional parameters,
validate supplied resources through read-only OCI API MCP commands when
available, then generate the smallest compatible change. The agent must not
run or install Terraform; the customer pipeline must review and run Terraform
validation, plan, and apply stages.

The skill is additive by default. It preserves existing project layout and
pipeline behavior. Updates, removals, replacements, and deletion requests
require the extra lifecycle checks in lifecycle-safety.md.

Reference files
---------------

module-support.md
  The upstream support allowlist and rejection wording for unsupported requests.

input-collection.md
  Required and optional input checklists for VCNs, subnets, routes, gateways,
  security lists, NSGs, and ZPR security-attribute assignment.

terraform-sources.md
  The canonical Git module source, pinning guidance, and safe existing-project
  integration rules.

validation.md
  The read-only OCI API MCP and structural validation contract.

main-tf-map.md
  Rules for placing new VCNs under `vcns` and injecting resources into an
  existing VCN through `inject_into_existing_vcns`.

lifecycle-safety.md
  Additional guardrails for updates, removals, replacements, and deletion.

Quick reference flow
--------------------

request -> module-support.md -> relevant input-collection.md section +
terraform-sources.md -> validation.md -> main-tf-map.md -> generate safely

For lifecycle changes, read lifecycle-safety.md before collecting inputs and
apply the state checks in validation.md before proposing a configuration change.
