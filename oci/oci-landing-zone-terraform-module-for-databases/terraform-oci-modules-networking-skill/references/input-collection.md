# OCI networking input collection

Use this reference only after `module-support.md` confirms support. Map values exactly to the selected upstream `network_configuration` shape; re-check the selected release's `SPEC.md` before using any field not listed here. Preserve stable logical keys: changing an applied key can recreate its resource.

## Shared topology and dependency inputs

Collect for every request:

- target repository and environment, approved source pin, intended OCI region, and whether the request creates a VCN or injects components into an existing VCN;
- `default_compartment_id` or a category/resource-level `compartment_id`; use a literal OCID or a documented `compartments_dependency` key only;
- category logical key; optional category compartment override, tags, `category_enable_cis_checks`, and `category_ssh_ports_to_check`;
- optional global defaults: defined/freeform tags, `default_enable_cis_checks` (defaults to `true`), and `default_ssh_ports_to_check` (defaults to `[22, 3389]`);
- for injection: a literal `vcn_id` or `network_dependency.vcns.<key>.id`. Avoid using a display name as a VCN identifier.

After required data for each selected family is complete, ask:

> Do you want to provide documented optional parameters for the selected networking components, including tags, DNS or IPv6 settings, CIS controls, associations, and gateway-specific options?

If declined, use upstream defaults only. Avoid inventing optional values.

## VCNs

Use `network_configuration_categories.<category>.vcns` only to create a VCN.

### Required inputs

- stable VCN map key;
- `cidr_blocks`: approved IPv4 CIDR list;
- effective compartment context, inherited or explicit;
- customer-approved display name when the customer naming policy requires one.

### Documented optional inputs

- `display_name`, `dns_label`, `compartment_id`, `defined_tags`, `freeform_tags`, and `enable_cis_checks`;
- IPv6 controls: `is_ipv6enabled`, `is_oracle_gua_allocation_enabled`, `ipv6private_cidr_blocks`, and documented BYOIPv6 details;
- `block_nat_traffic`;
- VCN default security list/default route table, DHCP options, subnets, NSGs, gateways, and `security.zpr_attributes` as separately collected below.

### Structural checks and output discipline

Require non-overlapping VCN CIDRs and a valid DNS label when supplied. Put the VCN and child topology beneath its stable key; avoid using `inject_into_existing_vcns` to recreate it.

## Existing VCN injection

Use `inject_into_existing_vcns` only for additive components in an existing VCN. It does not create the VCN.

### Required inputs

- stable injection map key;
- `vcn_id`, either literal or supported network-dependency key;
- requested child resource family and all its required inputs.

### Important differences from new VCNs

- subnet associations may accept existing external `dhcp_options_id`, `route_table_id`, and `security_list_ids`, in addition to same-configuration keys;
- gateway route-table association may accept `route_table_id` or `route_table_key`;
- use external resource IDs only after OCI MCP parentage validation; use a same-configuration key only where the upstream schema permits it;
- ZPR security attributes are supported in the new-VCN schema only. Treat assigning attributes to an existing VCN as unsupported by this module and direct the customer to OCI support.

## Subnets

### Required inputs

For every `subnets` map entry collect stable key, `cidr_block`, effective compartment, and intended VCN. For each subnet collect whether it is regional or availability-domain-specific and whether it is private or requires approved public exposure.

### Documented optional inputs

- `availability_domain`, `display_name`, `dns_label`, `compartment_id`, defined/freeform tags;
- `ipv6cidr_block` or `ipv6cidr_blocks` where supported by the selected VCN form;
- `prohibit_internet_ingress` and `prohibit_public_ip_on_vnic`; default new subnets to private with public-IP assignment prohibited;
- `dhcp_options_key`, plus `dhcp_options_id` for existing-VCN injection;
- `route_table_key`, plus `route_table_id` for existing-VCN injection;
- `security_list_keys`, plus `security_list_ids` for existing-VCN injection.

### Structural checks and output discipline

Require a subnet CIDR within its VCN and non-overlapping with all existing/requested subnets. Avoid mixing a key and OCID for the same association unless upstream documentation explicitly permits precedence. Require business purpose and confirmation before allowing public IPs or internet ingress.

## Route tables and route rules

Use `route_tables` for dedicated tables and `default_route_table` only when the customer explicitly asks to alter the VCN default table.

### Required inputs

- stable table key or explicit default-table target;
- for every `route_rules` entry: stable rule key, `destination`, `destination_type`, and exactly one validated next-hop reference (`network_entity_id` or `network_entity_key`), plus business purpose.

### Documented optional inputs

- table `compartment_id`, `display_name`, defined/freeform tags;
- rule `description`;
- `destination_type` of `CIDR_BLOCK`, or `SERVICE_CIDR_BLOCK` only for a service-gateway path. The documented service destinations are `objectstorage` and `all-services`.

### Structural checks and output discipline

Require destinations to be valid CIDRs or documented service names. Verify the target is the appropriate gateway/resource and belongs to the VCN when applicable. Avoid modifying default route tables, adding a default route, or replacing complete route-rule sets without explicit impact confirmation.

## Internet, NAT, and service gateways

Place these in `vcn_specific_gateways`.

### Internet gateway

Collect stable key and traffic purpose. Optional inputs are `compartment_id`, `display_name`, `enabled`, tags, and `route_table_key` for a new VCN or `route_table_id`/`route_table_key` for injection. Require an explicit public-access purpose and matching route/security design before creation or enablement.

### NAT gateway

Collect stable key and private-egress purpose. Optional inputs are `compartment_id`, `display_name`, `block_traffic`, `public_ip_id`, tags, and route-table association (`route_table_key`, or ID/key for injection). Avoid inferring public-IP reuse; validate a supplied public-IP OCID and require explicit approval before changing `block_traffic`.

### Service gateway

Collect stable key and required `services`: `objectstorage` or `all-services`. Optional inputs are `compartment_id`, `display_name`, tags, and route-table association. Require the required OCI-service path and a route using the matching `SERVICE_CIDR_BLOCK` destination.

## Security lists and security-list rules

Use `security_lists` for a dedicated list. Use `default_security_list` only when the customer explicitly identifies the VCN default security list and approves changing its complete ruleset.

### Required inputs

For the list, collect stable key where applicable, effective compartment, intended VCN, and any requested rule list. For every ingress rule collect `protocol`, `src`, and `src_type`; for every egress rule collect `protocol`, `dst`, and `dst_type`. Collect direction, traffic purpose, and rule description for customer review.

### Documented optional rule inputs

- `stateless`, `description`, `src_port_min`, `src_port_max`, `dst_port_min`, `dst_port_max`, `icmp_type`, and `icmp_code`;
- list `display_name`, `compartment_id`, defined/freeform tags.

### Structural checks and output discipline

Require port fields only when applicable to the protocol; ensure min ≤ max. Require ICMP type/code only for ICMP. Require explicit approval and recovery considerations for `0.0.0.0/0`, `::/0`, unrestricted egress, SSH/RDP ports, stateless rules, or a default-list change. Attach only validated same-configuration security-list keys or validated external IDs supported by the selected VCN form.

## Network security groups and rules

Use `network_security_groups`; ingress and egress rules are maps keyed by stable rule keys.

### Required inputs

For each NSG collect stable key, effective compartment, intended VCN, and display name if required by policy. For every ingress rule collect `protocol`, `src`, and `src_type`; for every egress rule collect `protocol`, `dst`, and `dst_type`. Collect business purpose, direction, and the intended protected workload.

### Documented optional inputs

- NSG `compartment_id`, `display_name`, defined/freeform tags;
- rule `description`, `stateless`, source/destination port bounds, and ICMP type/code.

### Structural checks and output discipline

Apply the same protocol, port, ICMP, broad-exposure, and duplicate-rule checks as security lists. Avoid assuming that declaring an NSG attaches it to a VNIC; record that attachment is outside the requested module scope unless the customer has an independently managed attachment path.

## ZPR security attributes

Use `security.zpr_attributes` only beneath a newly created VCN and only after policy evidence is validated.

### Required inputs

- `attr_name`, `attr_value`, application and management traffic flows, existing approved ZPR policy evidence, and recovery path.

### Documented optional inputs

- `namespace`, defaulting upstream to `oracle-zpr` only if the customer accepts it;
- `mode`, defaulting upstream to `enforce` only if the customer accepts it.

### Structural checks and output discipline

Avoid inventing namespaces, attributes, values, or policies. Confirm ZPR policy, routing, and security-list/NSG controls jointly allow the required flows before assignment. ZPR policy creation, update, and deletion are unsupported: direct the customer to OCI support.
