---
name: oci-networking-landing-zones
description: "Generate or update safe OCI network Terraform configuration using only `oci-landing-zones/terraform-oci-modules-networking`. Use for VCNs, subnets, route tables, internet/NAT/service gateways, security lists and rules, NSGs and rules, and ZPR security-attribute assignments when inputs must be collected and validated through read-only OCI API MCP checks, then integrated without disrupting an existing Terraform pipeline or provider setup."
---

# Build OCI Networking Landing Zones Terraform

Generate only configuration supported by the upstream networking module. Preserve the customer's existing Terraform and pipeline behavior. Use the OCI API MCP server only for read-only validation; avoid using it to create, update, delete, or otherwise mutate OCI resources. Never install or execute Terraform locally.

## Required workflow

1. Inspect the target before writing.
   - Inspect the Terraform repository, provider aliases, backend, module source pins, variable-data convention, and existing `network_configuration` values.
   - For every lifecycle request, inspect accessible state only read-only. If pipeline state is not accessible, require the customer to supply the exact pipeline state address and ownership confirmation.
   - Read [module support](references/module-support.md). If the requested capability is unavailable, report it using the required response and stop that portion.
   - Read [lifecycle safety](references/lifecycle-safety.md) for update, removal, replacement, or deletion.

2. Collect supported inputs.
   - Read the shared section plus only the matching resource sections of [input collection](references/input-collection.md). Read its existing-VCN injection section whenever the target VCN already exists.
   - Ask for missing required values and the customer-approved traffic purpose for any gateway, route, public access, or security rule. Avoid inferring topology, OCIDs, CIDRs, or access scope.
   - After required values are complete, ask whether the customer wants documented optional parameters. Use documented defaults when declined.

3. Validate before generating configuration.
   - Read [validation](references/validation.md) after all requested inputs are collected.
   - Use OCI API MCP read commands only to validate supplied and referenced OCI resources. Use a dry-run flag only when current MCP command help confirms it is supported and non-mutating.
   - Pause for corrected input if a value is missing or known invalid. If OCI API MCP is unavailable, state that MCP validation was skipped and continue only with the documented non-MCP checks.

4. Generate the smallest compatible change.
   - Read [terraform sources](references/terraform-sources.md) and [configuration map](references/main-tf-map.md). The configuration map decides whether to extend an existing root module, add one supported root module, or reject an unsupported request.
   - Reuse the existing compatible OCI provider, aliases, backend, module source pin, variables, and module block. Avoid adding duplicate providers, changing credentials, or disrupting the existing setup.
   - Create VCNs under `vcns`; add new resources to an existing VCN only through `inject_into_existing_vcns`. Preserve stable map keys and existing values.

5. Hand off to the customer pipeline.
   - Avoid running local Terraform operations. State that the customer pipeline must run the approved Terraform validation, plan, and apply stages and that the plan must be reviewed before apply.

## Boundaries

- Use only `oci-landing-zones/terraform-oci-modules-networking`; avoid direct `oci_*` resource substitutes, other landing-zone repositories, or custom modules.
- Avoid creating or changing ZPR policies. The upstream networking module supports security-attribute assignment but not ZPR policy management.
- Avoid replacing, deleting, moving, renaming, or modifying an existing resource unless the customer explicitly identifies it, confirms state ownership, and approves the exact action.
- Avoid changing providers, aliases, backend, authentication, Terraform version constraints, or module pins unless the customer explicitly requests that change.
- Avoid executing `terraform`, `tofu`, Terraform state commands, provider login, installations, or pipeline commands.

## Reference routing

```text
request
  -> module-support.md
       -> unsupported: report and stop that portion
       -> supported: relevant input section + terraform-sources.md
            -> lifecycle-safety.md when lifecycle change
            -> validation.md
                 -> main-tf-map.md
                      -> generate configuration for pipeline review
```

| Need | Read |
| --- | --- |
| Confirm support or reject the capability | [module-support.md](references/module-support.md) |
| Collect VCN, subnet, route, gateway, security, or ZPR inputs | [input-collection.md](references/input-collection.md) |
| Apply OCI API MCP and structural validation | [validation.md](references/validation.md) |
| Preserve provider, source, backend, and pipeline behavior | [terraform-sources.md](references/terraform-sources.md) |
| Handle update, removal, replacement, or delete | [lifecycle-safety.md](references/lifecycle-safety.md) |
| Place data in `vcns` or `inject_into_existing_vcns` | [main-tf-map.md](references/main-tf-map.md) |
