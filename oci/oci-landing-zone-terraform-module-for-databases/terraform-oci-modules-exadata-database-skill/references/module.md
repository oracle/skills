# Upstream Exadata Database module

Source repository: `https://github.com/oci-landing-zones/terraform-oci-modules-oracle-database`

Canonical upstream folder: `https://github.com/oci-landing-zones/terraform-oci-modules-oracle-database/tree/main/exadata-database`

Exact supported submodule: `exadata-database`.

Upstream revision used when this skill was created: `e587bbbaf0bcc3635d2789c965d4ec8d05e40877`. Re-check the current `README.md`, `SPEC.md`, and `variables.tf` at the user's approved pin before emitting any input not covered here.

## Supported resource families

| Capability | Module input | Dependency order |
| --- | --- | --- |
| Cloud Exadata Infrastructure | `cloud_exadata_infrastructures_configuration` | 1 |
| Cloud VM Cluster | `cloud_vm_clusters_configuration` | 2 |
| DB Home | `cloud_db_homes_configuration` | 3 |
| Container Database | `databases_configuration` | 4 |
| Pluggable Database | `pluggable_databases_configuration` | 5 |

The skill may use `compartments_dependency`, `subscription_dependency`, `network_dependency`, `default_compartment_id`, default tags, `module_name`, and `enable_output` as documented. It must not generate prerequisite IAM or network resources.

## Unsupported request handling

Reject a requested feature that cannot be expressed by these documented inputs or requires a separate upstream module. Use this exact pattern:

> The Terraform module for `<capability>` is not supported by `oci-landing-zones/terraform-oci-modules-oracle-database/tree/main/exadata-database`, so I cannot generate a module block for it.

If a request mixes supported and unsupported work, ask whether to continue with the supported portion only.

## Dependency model

OCID-valued inputs can be literal OCIDs or keys into dependency maps. A VM Cluster can refer to an Exadata Infrastructure key; a DB Home to a VM-cluster key; a database to a DB-home key; and a PDB to a database key. Preserve those keys exactly and do not replace a declared key with a guessed OCID.
