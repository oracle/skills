# Security Zones module contract

Canonical upstream folder: `oci-landing-zones/terraform-oci-modules-security/tree/main/security-zones`.

## Allowlist

| Capability | Status | Configuration location |
| --- | --- | --- |
| Security Zone recipes | Supported | `security_zones_configuration.recipes` |
| Security Zones | Supported | `security_zones_configuration.security_zones` |
| Cloud Guard enablement when currently disabled | Module side effect | Module-managed; never configure it separately |
| Cloud Guard targets, detector/responder recipes, responders, remediation, IAM, or networking | Not supported | — |

For an unsupported request, say:

> The Terraform module for `<capability>` is not supported by `oci-landing-zones/terraform-oci-modules-security/tree/main/security-zones`.

## Material module effects

- The module enables Cloud Guard if it is disabled. It does not disable Cloud Guard.
- A Security Zone is scoped to its compartment and subcompartments.
- Creating a Security Zone for a compartment replaces any existing Cloud Guard target for that compartment.
- CIS level `1` adds the upstream module's Level 1 policy set; CIS level `2` adds Level 1 plus Level 2 policies. Do not hardcode or guess policy OCIDs: the module resolves its CIS policies.
- With default `enable_obp_checks = true`, recipes and Security Zones cannot target the tenancy root. Set it to `false` only when the user explicitly authorizes root-compartment deployment.

Re-check upstream `README.md`, `SPEC.md`, and `variables.tf` before generation when a requested field is not covered here.
