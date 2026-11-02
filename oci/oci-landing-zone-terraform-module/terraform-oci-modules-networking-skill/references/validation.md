# Validation contract

Read this after support confirmation and all required/optional inputs are collected. Never proceed with a known-invalid value. OCI API MCP is validation-only: use `get_oci_command_help` for current syntax and `run_oci_command` only with `list`/`get` reads or a help-confirmed non-mutating dry run. Avoid create, update, delete, attach, detach, rule-change, and policy-change commands.

## Validation outcomes

- **Pass:** generate the scoped Terraform configuration.
- **Missing/invalid:** pause and request the corrected value.
- **MCP unavailable:** state that OCI MCP validation was skipped and apply non-MCP structural validation only.
- **MCP available but read fails:** distinguish authentication, authorization, region, connectivity, and not-found failures from tool unavailability; request corrected access or identity and do not claim validation passed.
- **Dry run unavailable/ambiguous:** skip it; pipeline plan review is still mandatory.

## OCI MCP availability and command discipline

Before declaring MCP unavailable, inspect the tool inventory for `get_oci_command_help` and `run_oci_command`. If present, use help for the exact read family before the first live read. MCP command text begins with the OCI service group, such as `network vcn get`; avoid including `oci`, `--profile`, or `--auth`.

The MCP server region/profile is server-selected. Compare it with the customer's intended region; a mismatch is a validation failure requiring the correct configured server context.

## Common validations

- Confirm each OCID has the expected type, is accessible, and belongs to the supplied tenancy, region, compartment, and VCN where OCI exposes those fields.
- Confirm referenced compartments and VCNs are active/available. Resolve a display name to an OCID only within the narrowest relevant compartment and then validate the OCID.
- Parse all IPv4/IPv6 CIDRs; confirm syntax, address family, containment, and no overlap. For injection, read the target VCN plus existing subnets before accepting a subnet CIDR.
- Validate logical-key uniqueness, no duplicate display-name conflict within the requested parent scope, and no unresolved same-configuration or dependency references.
- Validate tags, names, and DNS labels against customer policy when supplied; do not fabricate policy values.

## OCI API MCP read matrix

| Subject | Read-only commands and checks |
| --- | --- |
| Compartment/VCN | `iam compartment get`, `network vcn get/list`: expected OCID, lifecycle state, compartment, VCN CIDRs, DNS/IPv6 and NAT-traffic intent. |
| Existing VCN injection | `network vcn get`, `network subnet list`, `network route-table list`, `network security-list list`, `network nsg list`, gateway lists: target VCN identity, its existing CIDRs/components, and collision/association context. |
| Subnet | `network subnet get/list`: VCN/compartment parentage, CIDR, AD/regional shape, public-IP and internet-ingress settings, route/security/DHCP associations. |
| Route table | `network route-table get/list`: VCN parentage, existing rules, and affected associations. Verify CIDR versus service destination and the target resource type. |
| IGW/NAT/SGW | `network internet-gateway`, `network nat-gateway`, `network service-gateway` get/list: VCN parentage, enabled/block state, route-table association, and service-gateway enabled services. Use `network service list` to resolve an Oracle service when required. |
| Security list | `network security-list get/list`: VCN parentage, complete ingress/egress rules, and associated subnets before rule/default-list changes. |
| NSG and rules | `network nsg get/list`, `network nsg rules list`: VCN parentage, exact current rule IDs, duplicate/equivalent rule scope, and affected workload attachment information if exposed. |
| ZPR prerequisites | Current `security-attribute security-attribute-namespace` and `security-attribute security-attribute` list/get reads, plus `zpr zpr-policy` list/get: provided namespace/attribute identity and existing policy evidence. |

## Resource-specific structural validation

### Routes and gateways

- Require exactly one next-hop ID/key per route rule. Resolve it to the correct same-configuration or existing-VPC resource.
- Require `CIDR_BLOCK` destinations to be valid CIDRs. Require `SERVICE_CIDR_BLOCK` only with a service gateway and documented `objectstorage`/`all-services` value.
- Check routes do not create duplicate destinations with ambiguous next hops in the same table. Flag a default route, public path, NAT path, and service path for explicit traffic-impact review.
- Verify a supplied NAT public-IP OCID and supplied route-table/security-list/DHCP IDs belong to the expected VCN before use.

### Security rules

- Validate protocol, direction, endpoint type, CIDR/NSG source/destination, ports, and stateless behavior. Require min ≤ max and valid protocol-specific range semantics.
- Accept ICMP type/code only with an ICMP protocol. Reject port fields that the selected protocol does not support.
- Detect identical, shadowing, or broader-than-requested rules in the proposed configuration. Require explicit approval for public ingress, unrestricted egress, administrative ports, and stateless traffic.
- Verify security lists are associated only with intended subnets. Record that this module creates NSGs/rules but does not attach an NSG to a VNIC.

### ZPR

- Validate the proposed namespace, attribute name/value, and policy evidence are already available through OCI reads.
- Require an approved traffic matrix and recovery path. Confirm routing and NSG/security-list rules still permit required flows; ZPR is an additional control, not a substitute.
- Avoid validating ZPR policy creation through a mutation or fabricating a policy; report it as unsupported by the module.

## Lifecycle-state gate

For update, removal, replacement, or deletion: inspect accessible state read-only and require the exact state address. If state is unavailable, require customer confirmation from the approved pipeline state-inspection process. Configuration presence is not state ownership.

If the target is absent from state or ownership is unclear, stop and direct the customer to their approved adoption/import or stale-configuration reconciliation process. Avoid Terraform state commands and OCI mutations. Retrieve the current OCI resource before generating a lifecycle change, identify dependencies, state the expected action, and require explicit destructive confirmation for removal/delete.

## Dry-run handling

Use `get_oci_command_help` to discover whether the exact proposed validation path accepts a dry-run parameter. Use it only if help confirms the operation is non-mutating and customer policy allows it; otherwise omit it. Never represent OCI dry-run output as a Terraform plan or a substitute for pipeline review.
