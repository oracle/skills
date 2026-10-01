# Security Zones input collection

Use this reference only after `module.md` confirms the request is supported. Map values exactly to `security_zones_configuration`.

## Required inputs

- `tenancy_ocid`, or a literal `scope_compartment_ocid` from which OCI MCP can resolve the tenancy root. Keep the resolved tenancy OCID as `tenancy_ocid` for module wiring; `scope_compartment_ocid` is validation metadata only and must not be emitted as a module input;
- `authorized_group_name`: the exact OCI IAM group name expected to apply the configuration. It is validation metadata only and must not be emitted as a module input;
- at least one `security_zones` entry, each with a stable logical key, `name`, `compartment_id`, and `recipe_key`;
- a `recipes` entry with the exact matching `recipe_key`, a stable logical key, `name`, and `compartment_id`.

`compartment_id` may be a literal compartment OCID or a key that resolves through `compartments_dependency`. Do not accept a display name as either one.

## Optional configuration

- Top-level: `default_cis_level` (`"1"` or `"2"`), `default_security_policies_ocids`, default tags, `reporting_region`, `self_manage_resources`, and `enable_obp_checks`.
- Recipe: `description`, `cis_level` (`"1"` or `"2"`), `security_policies_ocids`, and tags.
- Security Zone: `description` and tags.
- Module: `compartments_dependency`, `enable_output` (default `true`), and `module_name` (default `security-zones`).

## Required CIS and additional-policy conversation

For each recipe, before asking about any other optional inputs, state:

| Choice | Included Security Zone policies |
| --- | --- |
| Omit `cis_level` / choose `"1"` | `deny public_buckets`; `deny db_instance_public_access` (module default unless `default_cis_level` is supplied) |
| Choose `"2"` | All Level 1 policies, plus `deny block_volume_without_vault_key`, `deny boot_volume_without_vault_key`, `deny buckets_without_vault_key`, and `deny file_system_without_vault_key` |

Ask: `Do you want CIS Level 1 (the module default, unless you set default_cis_level) or CIS Level 2 for each recipe?` Do not infer the selection. The user may explicitly accept the applicable default; then omit `cis_level` or emit the chosen value consistently with the repository's style.

After the CIS selection, ask: `Do you have specific Oracle Security Zone policies to add beyond this CIS baseline, or do you want to choose from the complete available-policy catalog?`

- If the user declines, omit `security_policies_ocids`.
- If the user supplies specific policy names or OCIDs, use OCI MCP read-only commands to validate each requested policy. Do not list or tabulate the catalog unless they explicitly ask to choose from it.
- If the user asks to choose from the catalog, first call `get_oci_command_help` for `cloud-guard security-policy-collection list-security-policies`; then call `run_oci_command` with `cloud-guard security-policy-collection list-security-policies --compartment-id <TENANCY_OCID> --all`. Present every active returned policy in a Markdown table with columns `Name`, `Description`, `Services`, `Category`, and `OCID`; do not fabricate, abbreviate, substitute OCIDs, select policies on the user's behalf, or omit entries based on the authorized group or apparent relevance. Ask the user which listed policies to add. Add only their selected OCIDs as the recipe's `security_policies_ocids`.
- Security Zone policies are Oracle-defined. Do not offer to create a new policy or confuse them with IAM policies.

## Mandatory optional-input question

After collecting required values and before reading `validation.md`, ask:

> After choosing the CIS baseline and whether to add extra Security Zone policies, do you want to provide any other documented optional Security Zones inputs—descriptions, tags, reporting region, Cloud Guard self-management, root-compartment override, compartment dependencies, outputs, or module name?

If the user declines, use upstream defaults only.

## Structural checks before validation

- Require unique recipe and Security Zone logical keys and names.
- Require every `security_zones[*].recipe_key` to resolve to a declared recipe key in the same configuration.
- Require each reference-style `compartment_id` to resolve to a `compartments_dependency` entry with a non-empty `id`.
- Preserve the map keys: they identify created recipes and zones and must not be casually renamed.
- Treat a Security Zone targeting the root compartment as a high-impact exception requiring explicit `enable_obp_checks = false`.

## Output discipline

Put non-secret topology data in the repository's established variable-data location, normally `terraform.tfvars`; pass `var.security_zones_configuration`, `var.tenancy_ocid`, and selected documented module inputs into one module block.
