# Validation contract

Read only after all required inputs and optional choices are collected. Never generate usable configuration with a missing, `null`, empty, malformed, unresolved, or known-invalid supplied value.

## Contents

- OCI MCP is mandatory
- Common input rules and identifier validation matrix
- Dependency readiness
- Baseline prerequisite gate
- DB Home
- Container Database
- Pluggable Database
- Lifecycle gate

## OCI MCP is mandatory

Before any OCI-dependent validation, inspect the available tool inventory for both OCI MCP tools: `get_oci_command_help` and `run_oci_command`. If either tool is absent or cannot be invoked, stop and tell the user that OCI MCP validation is required for this skill and is unavailable. Do not fall back to the local OCI CLI, shell commands, provider data sources, guesses, or unverified configuration.

For every OCI API call:

1. Call `get_oci_command_help` for the exact command before its first use in the request.
2. Call `run_oci_command` with only the text after `oci`; never pass `oci`, `--profile`, `--auth`, credentials, or write flags.
3. Treat a successful response for the exact supplied ID as valid. Treat not found, forbidden, authentication failure, a different returned ID, or a service error as a validation failure. Stop and ask for corrected ID/access.
4. Preserve map-key references. Validate an internal map key structurally; validate an external dependency key's resolved literal `id` through OCI MCP.

## Common input rules

- Validate every required attribute for every supplied map entry: it must be present and non-null. String values must also be non-empty; lists must be non-empty where required.
- Validate every optional attribute that is supplied: it must be non-null and match its declared type, enum, format, and source-specific constraints. Do not silently omit an invalid optional value.
- Require an effective compartment for every resource: `default_compartment_id` or a supplied resource-level `compartment_id`. A tenancy is the root compartment; validate its OCID and every other compartment OCID with `iam compartment get --compartment-id <OCID>`.
- Validate literal OCIDs with the resource-specific OCI MCP command. Validate a dependency key by confirming it exists, has a non-empty `id`, and then validating that resolved ID with the same command.
- Validate module-local DB Home → CDB → PDB references against the corresponding declared configuration map. Do not call OCI MCP for a resource that this database-layer configuration will create in the same apply.
- Treat passwords and credentials as secrets. Never request their plaintext, put them in files, or send them to OCI MCP. Confirm only secure injection and validate their policy constraints without exposing their value.

## OCI identifier validation matrix

| Supplied value | Required OCI MCP read |
| --- | --- |
| Tenancy, `default_compartment_id`, `compartment_id`, `compartments_dependency[*].id` | `iam compartment get --compartment-id <OCID>` |
| Client/backup subnet, `network_dependency.subnets[*].id` | `network subnet get --subnet-id <OCID>` |
| NSG IDs, `network_dependency.network_security_groups[*].id` | `network nsg get --network-security-group-id <OCID>` |
| Literal existing Exadata Infrastructure ID | `db cloud-exa-infra get --cloud-exa-infra-id <OCID>` |
| Literal existing VM Cluster ID | Confirm current syntax with `get_oci_command_help` for `db vm-cluster get`, then read that exact ID. |
| Literal existing DB Home ID | Confirm current syntax with `get_oci_command_help` for `db home get`, then read that exact ID. |
| Literal existing Container Database ID | Confirm current syntax with `get_oci_command_help` for `db database get`, then read that exact ID. |
| Literal existing Pluggable Database ID | Confirm current syntax with `get_oci_command_help` for `db pluggable-database get`, then read that exact ID. |
| KMS key/key-version, Vault, backup, source database, or clone source ID | Confirm the resource's current OCI CLI get command through `get_oci_command_help`, then read the exact ID. |
| Subscription ID or dependency ID | Confirm the currently supported subscription read/list command with `get_oci_command_help`; validate that the exact supplied ID belongs to the authenticated tenancy/region. |

## Dependency readiness

A successful get call proves only that an ID exists. Before a resource can be used by a downstream resource, its OCI MCP get response must also show that it is usable.

| Downstream configuration | Referenced resource | Required validation |
| --- | --- | --- |
| Existing VM Cluster used by a DB Home | Its existing Cloud Exadata Infrastructure | `db cloud-exa-infra get` must return the exact ID with `lifecycle_state` (or `lifecycleState`) equal to `AVAILABLE`. |
| Existing VM Cluster used by a DB Home | Existing Cloud Exadata Infrastructure | Resolve the VM Cluster through OCI MCP; its referenced Exadata Infrastructure must also resolve and be `AVAILABLE`. |
| `cloud_db_homes_configuration[*].vm_cluster_id` or `db_system_id` | Existing VM Cluster | Its OCI MCP get response must return the exact ID in `AVAILABLE`. |
| `databases_configuration[*].db_home_id` | Existing DB Home | Its OCI MCP get response must return the exact ID in `AVAILABLE`. |
| `pluggable_databases_configuration[*].container_database_id` | Existing Container Database | Its OCI MCP get response must return the exact ID in `AVAILABLE`. |
| Clone, backup, Vault, KMS, subscription, or network reference | Existing external resource | Use its documented read response to confirm the exact ID and its service-specific ready/usable state before using it. |

Apply this distinction to every reference:

- **Literal OCID or external dependency key:** resolve it through OCI MCP and require the listed usable state. Reject `CREATING`, `PROVISIONING`, `UPDATING`, `TERMINATING`, `TERMINATED`, `FAILED`, `INACTIVE`, or any state other than the required ready state. If the response does not contain a lifecycle/availability field, do not assume readiness; obtain the resource's current documented readiness signal through OCI MCP or stop.
- **Module-local map key:** permit it for the Exadata Infrastructure → VM Cluster → DB Home → CDB → PDB chain. Require the producer key to exist in the current configuration, retain the module's built-in key reference (never replace it with an OCID), and ensure it precedes the consumer. Terraform will then create the ordering edge in the same apply.
- **External module or remote Terraform output:** resolve the resulting literal ID and apply the same OCI MCP existence-and-readiness check as for a literal OCID.
- **Mismatch:** if the resource exists but is not usable, stop and tell the user which reference is not ready. Do not generate a workaround, bypass the dependency, or promise a retry will succeed.

## Configuration validation scope

- Before generating a standalone `cloud_exadata_infrastructures_configuration`, validate its supplied tenancy/IAM authentication, compartment, availability domain, and requested service shape/capacity where OCI exposes a read-only validation. Do not require, collect, or validate VCN, subnet, route, NSG, or Object Storage identifiers: they are not inputs to the infrastructure object.
- Before generating `cloud_vm_clusters_configuration`, validate its required and supplied configuration inputs, including client/backup subnet and NSG IDs where supplied. Do not require route, gateway, security-control, or Object Storage readiness evidence beyond the IDs represented in the object.
- Before creating a DB Home, require a VM Cluster reference. For a literal OCID or external dependency key, OCI MCP must confirm the resolved VM Cluster is `AVAILABLE`; for a module-local VM Cluster map key, require the producer key to exist in the current configuration.
- Before creating database-layer resources, validate their supplied configuration inputs and references. Do not request or validate operational identifiers that are not inputs to the requested object.
- Treat deployment prerequisites described in `reference.md` as informational only; do not block configuration generation on them.

## DB Home

For every `cloud_db_homes_configuration` entry:

- Validate every supplied optional field as non-null and type-correct. For the normal `VM_CLUSTER_NEW` path, accept `vm_cluster_id` as a module-local VM Cluster map key or as a literal/external dependency reference. Require the producer map key to exist in the current configuration; for a literal or external dependency reference, require OCI MCP to confirm the resolved VM Cluster is `AVAILABLE`.
- Validate supplied `compartment_id`, `db_system_id`, `database_software_image_id`, `kms_key_id`, `kms_key_version_id`, backup IDs, Vault IDs, and every other literal OCI reference through their dynamically confirmed OCI MCP get command.
- Validate `source` as `NONE`, `DB_BACKUP`, or `VM_CLUSTER_NEW`; enforce source-specific input combinations using the approved upstream `SPEC.md` and provider help.
- When `database` is supplied, require its `admin_password` to be securely injected. Validate supplied DB names, versions, character sets, backup settings, KMS/encryption references, and all nested optional fields against the approved module/provider contract.

## Container Database

For every `databases_configuration` entry:

- Require non-null, non-empty `db_home_id`, `source`, `database.admin_password`, and `database.db_name`. Do not expose the password; confirm secure injection and the documented password-policy compliance.
- Validate `db_home_id` as an internal DB-home key or an OCI MCP-validated literal DB Home ID in `AVAILABLE` state. Validate `source` and all source-specific restore/Data Guard combinations through the approved module/provider contract.
- Require `database.db_name` to start with a letter, contain only letters, digits, or underscores, and be at most 8 characters.
- Validate all supplied optional top-level and nested values. In particular, validate literal backup, source-database, KMS, key-version, key-store, Vault, and encryption-location identifiers with OCI MCP; validate booleans, backup-policy enums, character sets, tags, and names locally against the documented contract.

## Pluggable Database

For every `pluggable_databases_configuration` entry:

- Require non-null, non-empty `container_database_id` and `pdb_name`.
- Validate `container_database_id` as an internal database key or an OCI MCP-validated literal Container Database ID in `AVAILABLE` state. Validate every supplied `kms_key_version_id` and clone-source ID through OCI MCP.
- Validate `pdb_name` against the provider's current naming rule through approved documentation/help before generation. Reject a PDB name that equals its container database name when both are known.
- When `pdb_creation_type_details` is supplied, require non-null `creation_type` and `source_pluggable_database_id`; validate the source PDB through OCI MCP and validate all clone/refresh options against the approved contract.
- Do not expose `container_database_admin_password`, `pdb_admin_password`, TDE-wallet, or database-link secrets. Confirm secure injection and documented password policy instead.

## Lifecycle gate

For an update, deletion, recovery, or replacement, inspect accessible local Terraform state read-only and require the exact address to exist. Then validate the resource's literal OCI ID using the matching OCI MCP get command before proposing the change. If state ownership or the OCI read cannot be confirmed, stop. Do not import, adopt, replace, or alter state.
