# BaseDB Terraform Reference

## Table of Contents

- [Purpose](#purpose)
- [Absolute Rules](#absolute-rules)
- [Scope Decision Rules](#scope-decision-rules)
- [Required Input Collection](#required-input-collection)
- [Parent Resource Choices](#parent-resource-choices)
- [Live Value Resolution Rules](#live-value-resolution-rules)
- [Terraform Generation Rules](#terraform-generation-rules)
- [Resource Recipes](#resource-recipes)
- [Validation Rules](#validation-rules)
- [Outputs](#outputs)
- [Execution Rules](#execution-rules)

## Purpose

Read this file only when the user wants Terraform files for a new BaseDB virtual machine DB system.

Generate only requested BaseDB resources. Do not auto-expand scope beyond the request.

If the user does not provide a target directory, create it under:

```text
generated/terraform/basedb/<deployment-name>/
```

Generate these files when producing new Terraform:

- `main.tf`
- `variables.tf`
- `terraform.tfvars`

Never create a `.tfvars.example`, state, lock, saved-plan, log, README, script, or any other Terraform-related file.

## Absolute Rules

1. Ask every mandatory question in this file before writing `terraform.tfvars`.
2. Never invent an availability domain, database version, shape, subnet OCID, NSG OCID, parent OCID, hostname, database name, or display name.
3. Resolve live values before generation whenever the environment allows it. If live lookup is not available, ask the user for the value.
4. Do not write placeholder OCIDs or fake non-secret strings.
5. The only allowed intentionally empty required value is `admin_password = ""` in `terraform.tfvars`.
6. Scope generated resources to BaseDB virtual machine DB systems.
7. Use `oci_database_db_system` for a new VM DB system and put its initial DB home/database in the resource's nested `db_home` and `database` blocks.
8. Do not use resource patterns belonging to another OCI database service.
9. Do not auto-create compartments, VCNs, subnets, route tables, gateways, security lists, NSGs, IAM policies, or keys.
10. Use an existing subnet and existing optional NSGs for provisioning.
11. Create exactly `main.tf`, `variables.tf`, and `terraform.tfvars`.
12. Never invoke Terraform or run `init`, `fmt`, `validate`, `plan`, `apply`, `import`, `destroy`, or any other Terraform command.
13. Never create `.terraform/`, `.terraform.lock.hcl`, state files, saved plans, logs, scripts, READMEs, or backend artifacts.
14. For patch, upgrade, Data Guard role, subscription-change, or any other unsupported Terraform action, explain the three-file limitation and ask whether the user wants to switch to OCI MCP.
15. Require RSA SSH public keys with at least 2048-bit strength. Never generate or accept ED25519 keys for BaseDB.

## Scope Decision Rules

Follow this resource map:

```text
existing compartment
         |
existing VCN -> existing subnet + optional existing NSGs
         |                         |
         +-------------------------+--> oci_database_db_system
                                                |
                                                +--> inline db_home
                                                        |
                                                        +--> inline initial database / CDB
                                                                |
                                                                +--> optional initial PDB
```

Follow the hierarchy strictly:

```text
compartment -> VCN -> subnet -> VM DB system -> initial DB home -> initial database
```

Apply these rules:

- If the user wants a new BaseDB VM DB system, generate one `oci_database_db_system` with exactly one initial DB home/database inline.
- If the user chose Terraform for inspecting existing DB systems, explain that the three-file Terraform path cannot perform inventory and ask whether they want to switch to OCI MCP.
- If the user asks to import or update an existing Terraform-managed DB system, explain that this skill only generates the three creation files.
- If the user wants a standalone additional database or DB home on a VM DB system, do not reuse another service's recipes. Explain the provider limitation and route the operation through OCI MCP unless the currently pinned OCI provider explicitly documents VM support.
- If the user chose Terraform for PDB, backup, patch, upgrade, Data Guard, compartment move, subscription change, termination, or another action not represented by the three creation files, explain the limitation and ask whether they want to switch to OCI MCP.
- If the user wants a full network stack, stop and clarify that this skill intentionally requires existing networking.

## Required Input Collection

Ask these questions before writing Terraform. Do not skip a parent-layer choice.

### Provider And Global Scope

| Variable | Required | Ask if not provided |
| --- | --- | --- |
| `tenancy_ocid` | Yes | `What tenancy OCID should this Terraform use?` |
| `user_ocid` | Yes | `What user OCID should this Terraform use?` |
| `fingerprint` | Yes | `What API-key fingerprint should this Terraform use?` |
| `private_key_path` | Yes | `What local path contains the OCI API private key?` |
| `region` | Yes | `Which OCI region should this deployment target?` |
| `compartment_ocid` | Yes | `What compartment OCID should contain the BaseDB VM DB system?` |
| `availability_domain` | Yes for create | Resolve live ADs, then ask `Which availability domain should be used?` |

Do not put API private-key contents in Terraform. Accept only a local file path.

### Existing Network

Ask this first:

`Which existing VCN and subnet should the BaseDB VM DB system use?`

| Variable | Required | Ask if not provided |
| --- | --- | --- |
| `vcn_ocid` | For discovery only | `What is the existing VCN OCID, or should I list VCNs in the compartment?` |
| `subnet_ocid` | Yes | `What existing subnet OCID should the DB system use?` |
| `nsg_ids` | No | `What existing NSG OCIDs should be attached?` |

Use the VCN OCID only to resolve or validate the subnet. The DB-system resource uses `subnet_id`.

Do not create networking. If the user has no suitable subnet, report the missing prerequisite and stop generation until one is supplied.

### VM DB System

Ask this first:

`Should I generate the three Terraform files for a new BaseDB VM DB system?`

#### If Creating A New VM DB System

| Variable | Required | Ask if not provided |
| --- | --- | --- |
| `db_system_display_name` | Yes | `What display name should the VM DB system have?` |
| `hostname` | Yes | `What hostname should the VM DB system use?` |
| `shape` | Yes | Resolve supported VM shapes, then ask `Which BaseDB VM shape should be used?` |
| `database_edition` | Yes | `Which supported database edition should be used?` |
| `db_version` | Yes | Resolve supported versions, then ask `Which database version should be used?` |
| `node_count` | Yes | `Should this be a one-node VM DB system or a supported two-node RAC VM DB system?` |
| `compute_model` | When supported | `Should compute use ECPU or OCPU?` |
| `compute_count` | For ECPU | `How many ECPUs should be enabled?` |
| `cpu_core_count` | For OCPU | `How many OCPUs should be enabled?` |
| `data_storage_size_in_gb` | Yes | `What initial data storage size in GiB should be allocated?` |
| `storage_performance` | When supported | `Which supported storage-performance tier should be used?` |
| `license_model` | Yes | `Should licensing be LICENSE_INCLUDED or BRING_YOUR_OWN_LICENSE?` |
| `ssh_public_keys` | Yes | `Provide one or more RSA SSH public keys with at least 2048-bit strength for the DB system.` |
| `fault_domains` | No | `Should specific fault domains be used?` |
| `time_zone` | No | `Should a specific time zone be configured?` |
| `freeform_tags` / `defined_tags` | No | `Any tags to apply to the VM DB system?` |

Never generate an SSH private key unless the user explicitly asks. Prefer supplied RSA public keys for BaseDB. If generation is explicitly requested, generate RSA with `algorithm = "RSA"` and `rsa_bits = 2048` or stronger; never use ED25519.

### Initial DB Home And Database

The first DB home and database are nested inside `oci_database_db_system`.

| Variable | Required | Ask if not provided |
| --- | --- | --- |
| `db_home_display_name` | No | `What display name should the initial DB home have?` |
| `database_name` | Yes | `What should the initial database name be?` |
| `admin_password` | Yes | `Please provide the initial database admin password securely.` Never echo it back. |
| `pdb_name` | No | `What initial PDB name should be created?` |
| `character_set` | No | `Which supported database character set should be used?` |
| `ncharacter_set` | No | `Which supported national character set should be used?` |
| `db_workload` | No | `Which supported database workload should be used?` |
| backup configuration | No | `Should automatic backup be enabled, and which supported backup settings should be used?` |
| encryption inputs | No | `Should OCI Vault-managed encryption be configured?` |
| `freeform_tags` / `defined_tags` | No | `Any tags to apply to the initial database?` |

Do not assume a password, PDB name, character set, backup policy, or encryption key.

## Parent Resource Choices

For each existing parent:

1. ask whether the user has a specific OCID, exact display name, or wants resources listed
2. resolve an exact display name to a real OCID
3. show all matching OCIDs if names are ambiguous
4. validate that the subnet belongs to the selected VCN, compartment, and region
5. validate that optional NSGs belong to the selected VCN
6. collect full DB-system inputs only after the compartment, VCN, and subnet are settled

Do not descend into DB-system or database questions until existing infrastructure is fully resolved.

## Live Value Resolution Rules

Resolve live OCI values before generation whenever possible:

- tenancy and compartment OCIDs
- subscribed region
- availability domain
- supported BaseDB VM shapes
- database versions
- VCN, subnet, and NSG OCIDs

Use OCI MCP, not local shell OCI CLI, for live resolution in this skill:

```text
iam availability-domain list --compartment-id <TENANCY_OCID>
```

```text
db system-shape list --compartment-id <COMPARTMENT_OCID> --availability-domain <AD_NAME> --region <REGION>
```

```text
db version list --compartment-id <COMPARTMENT_OCID> --db-system-shape <SHAPE> --region <REGION>
```

```text
network vcn list --compartment-id <COMPARTMENT_OCID> --region <REGION> --all
```

```text
network subnet list --compartment-id <COMPARTMENT_OCID> --vcn-id <VCN_OCID> --region <REGION> --all
```

Before generating a new VM DB system, confirm:

- compartment OCID and region
- availability domain
- existing VCN, subnet, and optional NSGs
- supported VM shape and compute model
- node count
- storage size and performance
- database edition and version
- initial DB home/database values
- SSH public keys
- license model

If live lookup is unavailable, ask for the resolved value rather than guessing.

## Terraform Generation Rules

Put provider requirements, the provider block, selected data/resource blocks, locals, and outputs in `main.tf`.

Use this provider block:

```hcl
provider "oci" {
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
  region           = var.region
}
```

For `variables.tf`:

- declare only variables used by generated resources
- always declare the five OCI provider inputs
- mark `admin_password` as `sensitive = true`
- validate non-empty required identifiers and names
- validate positive compute, node, and storage values
- validate `compute_model` and `license_model` against values documented by the pinned provider
- declare `ssh_public_keys` and `nsg_ids` as `list(string)`
- validate every supplied SSH public key uses the OpenSSH RSA format
- never set a default for an OCID, password, shape, version, or availability domain

For `terraform.tfvars`:

- write only concrete non-secret values and real OCIDs
- write `admin_password = ""`
- tell the user to set the real admin password through an uncommitted tfvars file or `TF_VAR_admin_password`
- never commit a real admin password or private key
- never place fake OCIDs in the file

Pin a provider version only when the repository or user supplies a required version. Otherwise declare the source without inventing a version constraint.

The provider does not return the nested database admin password. Add a narrow lifecycle ignore for only that write-only field when the provider documentation requires it to avoid perpetual replacement.

## Resource Recipes

Use these patterns only after checking the currently selected OCI provider schema. Omit optional attributes the user did not request.

### Provider

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    oci = {
      source = "oracle/oci"
    }
  }
}

provider "oci" {
  tenancy_ocid     = var.tenancy_ocid
  user_ocid        = var.user_ocid
  fingerprint      = var.fingerprint
  private_key_path = var.private_key_path
  region           = var.region
}
```

Do not add `tls`, `local`, or other providers unless the requested configuration actually needs them.

### Existing Network Data Sources

Use supplied OCIDs directly in the resource. Add data sources only when the user asks Terraform to validate or expose existing network metadata.

```hcl
data "oci_core_subnet" "selected" {
  subnet_id = var.subnet_ocid
}
```

Do not create `oci_core_vcn`, `oci_core_subnet`, gateways, route tables, security lists, or NSGs.

### New VM DB System With Initial Database

```hcl
resource "oci_database_db_system" "this" {
  availability_domain = var.availability_domain
  compartment_id      = var.compartment_ocid
  database_edition    = var.database_edition
  display_name        = var.db_system_display_name
  hostname            = var.hostname
  shape               = var.shape
  subnet_id           = var.subnet_ocid
  node_count           = var.node_count
  data_storage_size_in_gb = var.data_storage_size_in_gb
  license_model           = var.license_model
  ssh_public_keys         = var.ssh_public_keys

  db_home {
    db_version   = var.db_version
    display_name = var.db_home_display_name

    database {
      admin_password = var.admin_password
      db_name        = var.database_name
      pdb_name       = var.pdb_name
    }
  }

  lifecycle {
    ignore_changes = [
      db_home[0].database[0].admin_password
    ]
  }
}
```

Add `compute_model`, `compute_count`, `cpu_core_count`, `storage_performance`, `nsg_ids`, backup configuration, encryption, maintenance, fault-domain, time-zone, and tag attributes only when requested and documented by the pinned provider.

Never include both ECPU and OCPU sizing fields unless the provider schema explicitly requires them. Choose the fields that correspond to the selected `compute_model`.

### ECPU VM DB System

When `compute_model = "ECPU"` is documented for the selected shape/provider:

```hcl
resource "oci_database_db_system" "this" {
  # Common required arguments omitted here.
  compute_model = "ECPU"
  compute_count = var.compute_count
}
```

Do not also set `cpu_core_count`.

### OCPU VM DB System

When `compute_model = "OCPU"` or legacy OCPU sizing is documented:

```hcl
resource "oci_database_db_system" "this" {
  # Common required arguments omitted here.
  compute_model  = "OCPU"
  cpu_core_count = var.cpu_core_count
}
```

Do not also set `compute_count` unless current provider documentation requires it.

### Unsupported Terraform Lifecycle Operations

Do not invent Terraform resources, provisioners, `local-exec`, or shell wrappers for:

- DB-system patch or upgrade actions
- Data Guard failover, switchover, or reinstate
- cloud DB-system subscription changes
- operational work-request polling
- ad hoc backup restore workflows not represented by the selected resource schema
- standalone DB-home or database resources that the provider does not support for BaseDB VM DB systems

Route these operations to `references/oci-api-mcp-server.md`.

## Validation Rules

Use variable validation when relevant:

```hcl
variable "node_count" {
  type = number

  validation {
    condition     = var.node_count > 0
    error_message = "node_count must be greater than 0."
  }
}

variable "data_storage_size_in_gb" {
  type = number

  validation {
    condition     = var.data_storage_size_in_gb > 0
    error_message = "data_storage_size_in_gb must be greater than 0."
  }
}

variable "ssh_public_keys" {
  type = list(string)

  validation {
    condition = (
      length(var.ssh_public_keys) > 0 &&
      alltrue([
        for key in var.ssh_public_keys :
        startswith(trimspace(key), "ssh-rsa ")
      ])
    )
    error_message = "ssh_public_keys must contain at least one RSA public key; ED25519 keys are not supported."
  }
}

variable "admin_password" {
  type      = string
  sensitive = true

  validation {
    condition     = length(var.admin_password) > 0
    error_message = "admin_password must be supplied securely before the generated configuration is used."
  }
}
```

Also validate:

- required OCIDs and names are non-empty
- `compute_count` or `cpu_core_count` is positive for the selected compute model
- `license_model` uses a documented value
- `nsg_ids` is a list of OCIDs
- a storage update does not decrease the current value

Do not encode password complexity text that may drift. Let the OCI service validate the supplied secret.

Generate syntactically careful HCL, but do not invoke Terraform to format or validate it.

## Outputs

Output only identifiers created by generated Terraform:

- `db_system_id`
- `db_system_state`
- `db_system_private_ip`
- `db_home_id` when exported by the nested resource state
- `database_id` when exported by the nested resource state

Use stable top-level attributes:

```hcl
output "db_system_id" {
  value = oci_database_db_system.this.id
}

output "db_system_state" {
  value = oci_database_db_system.this.state
}
```

Use `try(..., null)` for optional nested attributes only after confirming their current provider paths:

```hcl
output "db_home_id" {
  value = try(oci_database_db_system.this.db_home[0].id, null)
}
```

Do not emit outputs for existing infrastructure unless the user requests them.

## Execution Rules

This skill is generation-only.

- Create exactly `main.tf`, `variables.tf`, and `terraform.tfvars`.
- Never invoke the Terraform binary.
- Never run formatting, initialization, validation, planning, application, import, destruction, or state commands.
- Never create execution artifacts or additional helper files.
- If the user asks for Terraform execution, state that the skill stops after generating the three files.
