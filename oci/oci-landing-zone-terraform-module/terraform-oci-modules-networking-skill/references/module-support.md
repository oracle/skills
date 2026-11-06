# Upstream module support matrix

Source repository: `https://github.com/oci-landing-zones/terraform-oci-modules-networking`. Verify the selected release's `README.md` and `SPEC.md` before generation. This is an allowlist for the customer's requested scope.

| Capability | Status | Exact configuration location | Customer boundary |
| --- | --- | --- | --- |
| Create VCN | Supported | `network_configuration_categories.*.vcns` | Supports VCN plus declared components. |
| Inject components into existing VCN | Supported | `network_configuration_categories.*.inject_into_existing_vcns` | Requires VCN OCID or documented external dependency key; does not create the VCN. |
| Subnet | Supported | `subnets` | Supports documented CIDR, AD, IPv6, public-IP, DHCP, route, and security-list fields. |
| Route table/rules | Supported | `route_tables`, `default_route_table` | Default-table changes are lifecycle-sensitive. |
| Internet/NAT/service gateway | Supported | `vcn_specific_gateways` | SGW services limited to documented values. |
| Security list/rules | Supported | `security_lists`, `default_security_list` | Default-list changes are lifecycle-sensitive. |
| NSG/rules | Supported | `network_security_groups` | This module does not attach NSGs to VNICs. |
| ZPR security-attribute assignment | Supported | New VCN `security.zpr_attributes` | Requires existing policy evidence; not available for existing-VCN injection. |
| ZPR policy management | Not supported | — | Contact OCI support for an approved implementation. |

## Required unsupported response

> The Terraform module for `<capability>` is not supported by `oci-landing-zones/terraform-oci-modules-networking`. Contact OCI support if you need an approved implementation.

For an out-of-skill capability that the upstream repository could support, state that it is outside this customer skill's supported scope and ask whether the customer wants a separately approved skill/workflow. If a request combines supported and unsupported portions, ask whether to continue only with the supported portion.
