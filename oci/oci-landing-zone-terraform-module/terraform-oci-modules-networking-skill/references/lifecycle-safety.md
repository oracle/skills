# OCI networking lifecycle safety

Read this for update, removal, replacement, or deletion. Treat configuration changes as infrastructure changes, not source cleanup.

## Common gate

Require the exact logical key, OCI OCID, state address/ownership confirmation, desired action, current OCI read result, dependency analysis, and customer confirmation. Avoid assuming configuration presence means Terraform owns the resource.

## Update and replacement

- Distinguish metadata/tag changes from association, route, CIDR, security, or public-access changes. Surface any expected replacement or destroy/create action clearly.
- Preserve map keys, names, provider settings, source pin, and unrelated values. Avoid renaming keys; the upstream module warns that it can recreate resources.
- Before changing routes/gateways, identify affected subnets and egress/ingress paths. Before security changes, identify affected workloads and management access. Before ZPR attributes, identify permitted flows and recovery.

## Default resources

Default route tables and default security lists are existing VCN resources managed as complete rule/table configurations. Require explicit identification of the default resource, current rules, all affected associations, replacement/full-ruleset effect, and a recovery plan before generation.

## Remove and delete

- Treat removing a configuration entry as an intended Terraform destroy.
- Require explicit current-conversation confirmation for the exact target, dependency impact, expected destroy/replacement, and customer-approved maintenance/recovery plan.
- Avoid deleting a VCN until all child subnets, gateways, route tables, security lists, NSGs, attachments/workloads, and external references are addressed.
- Avoid deleting/widening/narrowing a rule until its traffic impact is confirmed. Never attempt state imports, removals, recovery, or OCI mutations.

## Ownership ambiguity

If pipeline state cannot establish ownership or the resource is absent from state, stop. Direct the customer to their approved state-inspection, adoption/import, or stale-configuration reconciliation process. Avoid creating a replacement as an implicit recovery.

## Required handoff

For every lifecycle change, summarize the exact target, expected Terraform action, dependencies, public/security impact, confirmation, rollback/recovery consideration, and requirement to review the customer pipeline plan before apply.
