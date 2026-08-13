# Exadata input collection

Read the section for every requested resource family, in order. Confirm the approved upstream pin and consult `SPEC.md` for the full object type before generating advanced options.

All top-level module inputs are optional (`null` or a documented default). The tables below distinguish the attributes Terraform requires *when a corresponding configuration object is supplied*. “Conditional” means required by the workflow or relevant source mode, rather than by the static object type alone.

## Top-level module inputs

| Input | Required | Default | Purpose |
| --- | --- | --- | --- |
| `cloud_exadata_infrastructures_configuration` | No | `null` | Cloud Exadata Infrastructure configuration object containing the `cloud_exadata_infrastructures` map. |
| `cloud_vm_clusters_configuration` | No | `null` | Cloud VM Cluster map. |
| `cloud_db_homes_configuration` | No | `null` | DB Home map. |
| `databases_configuration` | No | `null` | Container Database map. |
| `pluggable_databases_configuration` | No | `null` | Pluggable Database map. |
| `default_compartment_id` | Conditional | `null` | Default compartment; provide it or a resource-level `compartment_id`. |
| `compartments_dependency` | No | `null` | Map of externally managed compartment objects containing `id`. |
| `network_dependency` | Conditional | `null` | Supply when using subnet or NSG keys instead of literal OCIDs. |
| `subscription_dependency` | Conditional | `null` | Supply when using subscription keys instead of literal IDs. |
| `default_defined_tags` / `default_freeform_tags` | No | `{}` | Default tags. |
| `module_name` | No | `"exadata-cloud-service"` | Module identifier. |
| `enable_output` | No | `true` | Enable outputs. |

## Shared prerequisites

Use the OCI provider authentication variables used by the existing project. For a new API-key-authenticated project: `tenancy_ocid`, `user_ocid`, `fingerprint`, `private_key_path`, and `region`. Never collect private-key contents.

Collect one of `default_compartment_id` or a per-resource `compartment_id`, as a literal OCID or `compartments_dependency` key. For Exadata resources, prefer an actual `ocid1.compartment...` value for `compartment_id`; a tenancy OCID does not satisfy the module's compartment check for Exadata infrastructure or VM clusters. For VM clusters, collect a client `subnet_id` and `backup_subnet_id` as literal OCIDs or `network_dependency.subnets` keys. `ssh_public_keys` must be a non-empty `list(string)`. A `.tfvars` file may contain a literal public-key string, but never `file()`, `${path.module}`, or any other Terraform expression. When a user supplies a key outside the repository, copy the public key into a distinct repo-local file and resolve it with `file("${path.module}/...")` in `main.tf` through a local value or module-argument merge; make the raw variable attribute optional if it is omitted from `.tfvars`. Do not reference external absolute paths such as `Downloads`, because the Terraform execution environment may not be permitted to read them. A dependency object must contain its literal `id`.

Ask for tags only after the required topology is known. `subscription_id` may be a literal or a `subscription_dependency` key when the documented resource supports it.

## Required object shape

Generate each configuration object in the module's dependency order and keep the nested structure intact:

- `cloud_exadata_infrastructures_configuration.cloud_exadata_infrastructures`
- `cloud_vm_clusters_configuration`
- `cloud_db_homes_configuration`
- `databases_configuration`
- `pluggable_databases_configuration`

Do not flatten a top-level object into a bare map when generating Terraform.

## Cloud Exadata Infrastructure

Collect one top-level `cloud_exadata_infrastructures_configuration` object containing a `cloud_exadata_infrastructures` map. For each map key inside `cloud_exadata_infrastructures`, require `display_name` and `shape`. Current allowed shapes: `Exadata.X11M`, `Exadata.X9M`, and `Exadata.X8M`. Collect compartment, availability domain, compute/storage counts, customer contact, server types, subscription, tags, and maintenance window only when requested.

| Required attributes | Optional attributes |
| --- | --- |
| `display_name`, `shape` | `compartment_id`, `availability_domain`, `compute_count`, `customer_contacts.email`, `database_server_type`, `storage_count`, `storage_server_type`, `subscription_id`, `defined_tags`, `freeform_tags`, `maintenance_window`, `default_maintenance_window` |

## Cloud VM Cluster

For each map key, require `backup_subnet_id`, `cpu_core_count`, `display_name`, `gi_version`, `hostname`, `ssh_public_keys`, and `subnet_id`. Collect an Exadata Infrastructure OCID or local map key, sizing, storage/server selection, NSGs, version, license, backup, filesystem, automation, tags, and subscription inputs only when requested. The client and backup subnets are baseline prerequisites and must already be OCI MCP-validated before this resource is generated.

| Required attributes | Optional attributes |
| --- | --- |
| `backup_subnet_id`, `cpu_core_count`, `display_name`, `gi_version`, `hostname`, `ssh_public_keys`, `subnet_id` | `exadata_infrastructure_id`, `compartment_id`, `backup_network_nsg_ids`, `cloud_automation_update_details`, `cluster_name`, `data_collection_options`, `data_storage_percentage`, `data_storage_size_in_tbs`, `db_node_storage_size_in_gbs`, `db_servers`, `defined_tags`, `freeform_tags`, `domain`, `file_system_configuration_details`, `is_local_backup_enabled`, `is_sparse_diskgroup_enabled`, `license_model`, `memory_size_in_gbs`, `nsg_ids`, `ocpu_count`, `private_zone_id`, `scan_listener_port_tcp`, `scan_listener_port_tcp_ssl`, `security.zpr_attributes`, `subscription_id`, `system_version`, `time_zone`, `vm_cluster_type` |

## DB Home

For every DB-home map key, collect the VM-cluster OCID or map key and the DB-home source. The documented default source is `VM_CLUSTER_NEW`; allowed values include `NONE`, `DB_BACKUP`, and `VM_CLUSTER_NEW`. Collect DB version, display name, software image, KMS settings, backup/restore details, tags, and auditing options only when needed. If the nested `database` object is used, its `admin_password` is required and secret.

| Required attributes | Optional attributes |
| --- | --- |
| None at the DB-home object level | `compartment_id`, `database_software_image_id`, `db_system_id`, `db_version`, `defined_tags`, `display_name`, `enable_database_delete`, `freeform_tags`, `is_desupported_version`, `is_unified_auditing_enabled`, `kms_key_id`, `kms_key_version_id`, `source` (default `VM_CLUSTER_NEW`), `vm_cluster_id`, `database` |

When `database` is supplied, require `database[*].admin_password` through secure injection. Its optional fields are `backup_id`, `backup_tde_password`, `character_set`, `database_id`, `database_software_image_id`, `db_backup_config`, `db_name`, `db_workload`, tags, encryption-key details, key-store/KMS values, `ncharacter_set`, `pdb_name`, `pluggable_databases`, `sid_prefix`, source encryption-key details, `tde_wallet_password`, point-in-time recovery timestamp, and `vault_id`.

## Container Database

For each database map key, require `db_home_id`, `source`, and a `database` object with `admin_password` and `db_name`. The upstream `SPEC.md` declares `databases_configuration[*].source` as a required string; the upstream `README.md` specifies `NONE`, `DB_BACKUP`, and `DATAGUARD`, with `NONE` as the default for a new container database. Do not use the DB Home-specific `VM_CLUSTER_NEW` value for a CDB. For `cloud_db_homes_configuration[*].source`, the upstream spec documents `NONE`, `DB_BACKUP`, and `VM_CLUSTER_NEW`, with a default of `VM_CLUSTER_NEW`. Collect source-specific restore or Data Guard fields only for the selected source. Collect backup policy, character sets, KMS/Vault, initial PDB, and tags only when relevant.

| Required attributes | Optional attributes |
| --- | --- |
| `db_home_id`, `source`, `database.admin_password` (secret), `database.db_name` | Top-level: `key_store_id`, `db_version`, `kms_key_id`, `kms_key_version_id`. Database: `backup_id`, `backup_tde_password`, `character_set`, `database_admin_password`, `database_software_image_id`, `db_backup_config`, `db_unique_name`, `db_workload`, tags, encryption-key details, `freeform_tags`, `is_active_data_guard_enabled`, KMS/key-store values, `ncharacter_set`, `pdb_name`, `pluggable_databases`, `protection_mode`, `sid_prefix`, source-database/encryption/wallet values, `tde_wallet_password`, `transport_type`, `vault_id` |

## Pluggable Database

For each PDB map key, require `container_database_id` and `pdb_name`. Collect PDB creation details only for clone/refresh workflows. `pdb_admin_password`, container admin password, and TDE wallet password are secrets and must use secure injection.

| Required attributes | Optional attributes |
| --- | --- |
| `container_database_id`, `pdb_name` | `container_database_admin_password`, `defined_tags`, `freeform_tags`, `kms_key_version_id`, `pdb_admin_password`, `pdb_creation_type_details`, `should_create_pdb_backup`, `should_pdb_admin_account_be_locked`, `tde_wallet_password` |

When `pdb_creation_type_details` is supplied, require its `creation_type` and `source_pluggable_database_id`; its remaining clone and refresh attributes are optional.
