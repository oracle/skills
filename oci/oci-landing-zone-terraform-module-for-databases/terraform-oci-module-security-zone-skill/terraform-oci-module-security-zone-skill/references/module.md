# Security Zones module contract

Canonical upstream folder: `oci-landing-zones/terraform-oci-modules-security/tree/main/security-zones`.

## Database-operation gate

This skill is applicable only when the user explicitly intends to perform an OCI Database Service operation after applying the configuration. A request to create a Security Zone by itself does not qualify. Before collecting module inputs, identify the intended database operation and its target compartment. If either is unclear or missing, ask and pause. Ask for the database resource type only when it is needed to clarify the operation or assess whether a selected policy applies; it is not a required Security Zone or module input.

This Terraform module creates custom recipes; it cannot select or manage Oracle's Maximum Security Recipe. The Maximum Security Recipe is Oracle-managed, includes all available Security Zone policies, and has its own documented Database Service compatibility limits. Those Maximum-specific supported-resource lists and exclusions do not establish compatibility for custom recipes created by this module. Never apply them as custom-recipe rules or represent a custom recipe as equivalent to Maximum. If the user specifically requires the Maximum Security Recipe, this module does not meet the request. See [Database service integration](https://docs.oracle.com/en-us/iaas/Content/Database/Concepts/security_zones_topic-database_service_integration_overview.htm) and [Managing recipes](https://docs.oracle.com/en-us/iaas/Content/security-zone/using/managing-recipes.htm).

## Allowlist

| Capability | Status | Configuration location |
| --- | --- | --- |
| Security Zone recipes | Supported | `security_zones_configuration.recipes` |
| Security Zones | Supported | `security_zones_configuration.security_zones` |
| Standalone or general-purpose Security Zone work | Out of scope for this skill | — |
| Oracle-managed Maximum Security Recipe | Not configurable by this module; it creates custom recipes | — |
| Cloud Guard enablement when currently disabled | Module side effect | Module-managed; never configure it separately |
| Cloud Guard targets, detector/responder recipes, responders, remediation, IAM, or networking | Not supported | — |

For an unsupported request, say:

> The Terraform module for `<capability>` is not supported by `oci-landing-zones/terraform-oci-modules-security/tree/main/security-zones`.

## Material module effects

- The module enables Cloud Guard if it is disabled. It does not disable Cloud Guard.
- A Security Zone is scoped to its compartment and subcompartments.
- Creating a Security Zone for a compartment replaces any existing Cloud Guard target for that compartment.
- CIS level `1` adds the upstream module's Level 1 policy set; CIS level `2` adds Level 1 plus Level 2 policies. Do not hardcode or guess policy OCIDs: the module resolves its CIS policies.
- A database-focused custom recipe may add only user-selected policies whose documented service/resource scope includes Database. However, the module's minimum CIS Level 1 set also includes `deny public_buckets`, and Level 2 adds further non-Database policies. Explain this before proceeding. If the user requires an exclusively Database-scoped policy set, stop: this module cannot produce it.
- Security Zone enforcement follows compartment assignment. A zone applies to every resource in its compartment and subcompartments; it does not target only the database. Explain this scope and obtain the user's acknowledgement as a skill workflow safeguard, not an OCI API prerequisite.
- With default `enable_obp_checks = true`, recipes and Security Zones cannot target the tenancy root. Set it to `false` only when the user explicitly authorizes root-compartment deployment.

Re-check upstream `README.md`, `SPEC.md`, and `variables.tf` before generation when a requested field is not covered here.
