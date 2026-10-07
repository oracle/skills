# Terraform file and configuration map

Use this only after validation succeeds. Separate the upstream support decision from whether the customer repository already invokes the root networking module.

## Choose the change

| Customer request | Existing repository state | Required change |
| --- | --- | --- |
| Add a supported VCN/component or documented optional input | A compatible root networking module already exists | Trace the value passed to `network_configuration`; extend that object in its established location. Avoid adding a second module block. |
| Add a supported VCN/component | No compatible root networking module exists | Add one root module block using the approved pinned upstream source, a typed `network_configuration` variable, and the smallest compatible data change; reuse existing OCI provider/backend setup. |
| Unsupported capability, including ZPR policy management | Any state | Report it as unsupported and do not add direct `oci_*` resources, another landing-zone module, or a custom replacement. |

The absence of a module block in the current repository does not mean the capability is unsupported. `module-support.md` determines upstream support.

## Existing repository placement

- Inspect module blocks and trace the variable/local/source that supplies `network_configuration`. It may be in `*.tfvars`, environment JSON, locals, or another established configuration source.
- Extend the existing data source only; preserve existing categories, VCN/injection entries, keys, tags, dependencies, and unrelated values.
- Reuse the existing OCI provider, aliases, `required_providers`, backend, version constraints, module name, and source pin. Avoid duplicates or authentication changes.
- Add a typed declaration only when needed and compatible with the repository's established type strategy. Avoid weakening an existing type to `any` merely to add fields.
- Add validated non-secret values in the repository's current variable-data convention. Avoid writing private-key material, tokens, or passwords.

## Map request to `network_configuration`

| Request | Location |
| --- | --- |
| Create VCN and its child resources | `network_configuration.network_configuration_categories.<category>.vcns.<vcn-key>` |
| Inject child resources into an existing VCN | `network_configuration.network_configuration_categories.<category>.inject_into_existing_vcns.<injection-key>` with `vcn_id` |
| External compartment reference | `compartments_dependency.<key>.id`; use the key only in documented compartment fields |
| External VCN reference | `network_dependency.vcns.<key>.id`; use the key as documented `vcn_id` |
| Dedicated/default route table | `route_tables` / `default_route_table` under the selected VCN or injection |
| Dedicated/default security list | `security_lists` / `default_security_list` under the selected VCN or injection |
| NSG and rules | `network_security_groups` under the selected VCN or injection |
| Gateways | `vcn_specific_gateways.internet_gateways`, `.nat_gateways`, or `.service_gateways` |
| New-VCN ZPR attributes | `security.zpr_attributes` under the selected new VCN |

## New project mode

If no project, module, provider, or configuration convention exists, use the minimal-workspace mode in [terraform-sources.md](terraform-sources.md#empty-starting-point-minimal-workspace-mode). After the customer supplies a target directory, approved source pin, and authentication mechanism, create one root module invocation, typed variable declaration, and non-secret variable data. Require Terraform `>= 1.3.0`; avoid running Terraform or creating a backend/state configuration without explicit customer direction.

## Handoff

State the changed data source and module block, preserved provider/backend/source pin, expected pipeline plan impact, and required pipeline review. Avoid running local Terraform commands.
