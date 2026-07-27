# ExaDB-XS Terraform Reference

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
- [Terraform Boundary](#terraform-boundary)

## Purpose

Read this file when the user wants Terraform files for ExaDB-XS.

Generate only requested ExaDB-XS resources. Do not auto-expand scope beyond the request.

If the user does not provide a target directory, create it under:

```text
generated/terraform/exadb-xs/<deployment-name>/
```

Create exactly these files when producing Terraform:

- `main.tf`
- `variables.tf`
- `terraform.tfvars`

Never create any other file, including a `.tfvars.example`, script, Terraform state, lock file, plan file, or generated key file.

## Absolute Rules

1. Ask every mandatory question in this file before writing `terraform.tfvars`.
2. Never invent `availability_domain`, `grid_image_id`, `db_version`, shape, subnet OCIDs, NSG OCIDs, or parent OCIDs.
3. Resolve live values before generation whenever the environment allows it. If live lookup is not available, ask the user for the value instead of inventing it.
4. Do not write placeholder OCIDs or fake non-secret strings.
5. The only allowed intentionally empty required value is `admin_password = ""` in `terraform.tfvars`.
6. Generate only the layers the user requested.
7. Do not auto-create networking, compartments, or peer infrastructure unless the user explicitly asked for them in the same Terraform root.
8. Prefer existing private client and backup subnets for ExaDB VM Cluster provisioning.
9. Use ExaDB-XS resources. Do not use ExaDB-D resources such as `oci_database_cloud_vm_cluster`, or ExaCC resources.

## Scope Decision Rules

Follow this resource map:

```text
existing or new storage vault
             |
existing client subnet + client NSGs -------+
existing backup subnet + backup NSGs -------+--> oci_database_exadb_vm_cluster
             |                                         |
             v                                         +--> oci_database_db_home
oci_database_exascale_db_storage_vault                            |
             |                                                    v
             +------------------------------------------> initial Oracle database

existing DB home ---------------------------------------> oci_database_database
```

Follow the hierarchy strictly:

```text
exascale_db_storage_vault -> exadb_vm_cluster -> db_home -> database
```

Apply these rules:

- If the user wants a full ExaDB-XS stack, generate:
  - `oci_database_exascale_db_storage_vault`
  - `oci_database_exadb_vm_cluster`
  - `oci_database_db_home`
  - the initial database through the DB home `database` block
- If the user wants only an ExaDB VM cluster, require either an existing Exascale DB storage vault or explicit permission to create one first.
- If the user wants only a DB home, require an existing or newly-created ExaDB VM cluster.
- If the user wants an additional database, require an existing DB home and use `oci_database_database`.
- If the user wants to reuse an existing Exascale DB storage vault, ExaDB VM cluster, or DB home, reference the supplied OCID directly and omit the parent resource block from `main.tf`.

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
| `compartment_ocid` | Yes | `What compartment OCID should contain these ExaDB-XS resources?` |
| `availability_domain` | Yes for a new vault or VM cluster | Resolve live ADs for the chosen region, then ask `Which availability domain should be used?` |

### Exascale DB Storage Vault

Ask this first:

`Should the ExaDB VM cluster use an existing Exascale DB storage vault, or should Terraform create a new one?`

#### If Reusing An Existing Exascale DB Storage Vault

| Variable | Required | Ask if not provided |
| --- | --- | --- |
| `existing_exascale_db_storage_vault_id` | Yes | `What is the Exascale DB storage vault OCID?` |

#### If Creating A New Exascale DB Storage Vault

| Variable | Required | Ask if not provided |
| --- | --- | --- |
| `vault_display_name` | Yes | `What display name should the Exascale DB storage vault have?` |
| `vault_storage_size_gbs` | Yes | `What high-capacity database storage size in GiB should the vault have?` |
| `freeform_tags` / `defined_tags` | No | `Any tags to apply to the Exascale DB storage vault?` |

### ExaDB VM Cluster

Ask this first:

`Should Terraform create a new ExaDB VM cluster, or reuse an existing one?`

#### If Reusing An Existing ExaDB VM Cluster

| Variable | Required | Ask if not provided |
| --- | --- | --- |
| `existing_exadb_vm_cluster_id` | Yes | `What is the ExaDB VM cluster OCID?` |

#### If Creating A New ExaDB VM Cluster

| Variable | Required | Ask if not provided |
| --- | --- | --- |
| `cluster_display_name` | Yes | `What display name should the ExaDB VM cluster have?` |
| `cluster_hostname` | Yes | `What hostname should the ExaDB VM cluster use?` |
| `client_subnet_id` | Yes | `What private client subnet OCID should the VM cluster use?` |
| `backup_subnet_id` | Yes | `What private backup subnet OCID should the VM cluster use?` |
| `client_nsg_ids` | No | `What client NSG OCIDs should be attached?` |
| `backup_nsg_ids` | No | `What backup-network NSG OCIDs should be attached?` |
| `grid_image_id` | Yes | Resolve compatible Grid images, then ask `Which Grid image OCID should be used?` |
| `node_names` | Yes | `What node names should the ExaDB VM cluster use?` |
| `enabled_ecpu_count_per_node` | Yes | `How many ECPUs should be enabled per VM-cluster node?` |
| `total_ecpu_count_per_node` | Yes | `What is the total ECPU count per VM-cluster node?` |
| `vm_file_system_storage_size_gbs_per_node` | Yes | `What VM file-system storage size in GiB should each node use?` |
| `ssh_public_keys` | Yes unless generating | `Provide one or more SSH public keys, or confirm that Terraform should generate them.` |
| `generate_ssh_key` | Yes when keys are not supplied | `Should Terraform generate an RSA-2048 SSH keypair for this VM cluster?` |
| `generated_ssh_private_key_path` | Yes when generating | `Where should the generated private key be written?` |
| `freeform_tags` / `defined_tags` | No | `Any tags to apply to the ExaDB VM cluster?` |

### DB Home And Initial Database

Ask this first:

`Should Terraform create a new DB home, or reuse an existing DB home for additional databases only?`

#### If Creating A New DB Home

| Variable | Required | Ask if not provided |
| --- | --- | --- |
| `db_home_display_name` | Yes | `What display name should the DB home have?` |
| `db_version` | Yes | Resolve live database versions, then ask `Which database version should be used?` |
| `database_name` | Yes | `What should the initial database name be?` |
| `admin_password` | Yes | `Please provide the admin password for the initial database.` Never echo it back. |
| `pdb_name` | No | `What PDB name should be created with the initial database?` |
| `database_data_storage_size_gbs` | No | `What DATA storage size in GiB should the initial database use?` |
| `database_reco_storage_size_gbs` | No | `What RECO storage size in GiB should the initial database use?` |
| `freeform_tags` / `defined_tags` | No | `Any tags to apply to the DB home or initial database?` |

### Additional Database In Existing DB Home

Ask this first:

`Should Terraform create an additional database in an existing DB home?`

| Variable | Required | Ask if not provided |
| --- | --- | --- |
| `existing_db_home_id` | Yes | `What DB home OCID should contain the additional database?` |
| `existing_exadb_vm_cluster_id` | Yes when only the DB home is reused | `What ExaDB VM cluster OCID owns that DB home?` |
| `additional_database_name` | Yes | `What should the additional database name be?` |
| `admin_password` | Yes | `Please provide the admin password for the additional database.` Never echo it back. |
| `additional_pdb_name` | No | `What PDB name should be created with the additional database?` |
| `database_data_storage_size_gbs` | No | `What DATA storage size in GiB should the additional database use?` |
| `database_reco_storage_size_gbs` | No | `What RECO storage size in GiB should the additional database use?` |
| `freeform_tags` / `defined_tags` | No | `Any tags to apply to the additional database?` |

## Parent Resource Choices

For every existing-versus-new layer:

1. ask whether the user wants to reuse an existing parent or create a new parent
2. if the user chooses existing, ask whether they have:
   - a specific OCID
   - a specific display name
   - or want the available resources listed first
3. if the user chooses display name, resolve the real OCID before generation
4. if the user chooses new, collect the full set of required inputs for that layer before continuing

Do not descend into a child layer until the parent choice is fully resolved.

## Live Value Resolution Rules

Resolve live OCI values before generation whenever possible. Typical values that must be resolved live are:

- availability domain
- compatible Grid image ID
- database version
- reusable Exascale storage-vault OCIDs
- reusable ExaDB VM-cluster OCIDs
- reusable DB-home OCIDs

Use the region as the user-facing lookup input. Resolve a real availability domain from the target region before generation:

```bash
oci iam availability-domain list \
  --compartment-id "$(awk -F= '/^tenancy=/{gsub(/[[:space:]]/, "", $2); print $2; exit}' ~/.oci/config)" \
  --region <region>
```

Use one returned `data[].name` value as `availability_domain`.

Before generating a new Exascale storage vault or ExaDB VM cluster, confirm:

- compartment OCID
- availability domain
- whether the storage vault is existing or new
- whether the ExaDB VM cluster is existing or new
- compatible Grid image and database versions
- client and backup subnets and NSGs
- ECPU, node, and storage sizing

If live lookup is not available, ask the user for the resolved value rather than guessing.

## Terraform Generation Rules

Put provider requirements, the provider block, only selected resource blocks, locals, and outputs in `main.tf`.

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

- declare only variables actually used by generated resources
- always declare the five OCI provider inputs
- mark `admin_password` as `sensitive = true`
- validate positive numeric sizing values
- require non-empty `client_subnet_id` and `backup_subnet_id` when generating an ExaDB VM cluster
- require at least one `node_names` item when generating an ExaDB VM cluster
- validate enabled ECPUs do not exceed total ECPUs

For `terraform.tfvars`:

- write only concrete non-secret values and real OCIDs
- write `admin_password = ""`
- tell the user to set the real admin password before running Terraform locally
- never commit a real admin password to version control
- when reusing an existing parent, write its OCID in `terraform.tfvars` and omit the parent resource block from `main.tf`

When creating a new ExaDB VM cluster, generate a TLS RSA-2048 SSH key pair by default unless the user supplies one or more `ssh_public_keys`. If generating keys, require:

- `generate_ssh_key = true`
- a concrete `generated_ssh_private_key_path`
- a warning that Terraform state will still contain the private-key material even if the file is written with mode `0600`

## Resource Recipes

Use these patterns only for layers the user asked to create. Omit parent resource blocks when reusing existing OCIDs.

### Provider And Optional Providers

```hcl
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    oci = {
      source = "oracle/oci"
    }
    tls = {
      source = "hashicorp/tls"
    }
    local = {
      source = "hashicorp/local"
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

Keep `tls` and `local` only if Terraform is generating SSH keys.

### Parent Locals

```hcl
locals {
  storage_vault_id = var.existing_exascale_db_storage_vault_id != "" ? var.existing_exascale_db_storage_vault_id : oci_database_exascale_db_storage_vault.db[0].id
  vm_cluster_id    = var.existing_exadb_vm_cluster_id != "" ? var.existing_exadb_vm_cluster_id : oci_database_exadb_vm_cluster.db[0].id
  ssh_public_keys  = var.generate_ssh_key ? [tls_private_key.cluster[0].public_key_openssh] : var.ssh_public_keys
}
```

### New Exascale DB Storage Vault

```hcl
resource "oci_database_exascale_db_storage_vault" "db" {
  count               = var.existing_exascale_db_storage_vault_id == "" ? 1 : 0
  compartment_id      = var.compartment_ocid
  availability_domain = var.availability_domain
  display_name        = var.vault_display_name
  freeform_tags       = var.freeform_tags
  defined_tags        = var.defined_tags

  high_capacity_database_storage {
    total_size_in_gbs = var.vault_storage_size_gbs
  }
}
```

### SSH Key Generation

```hcl
resource "tls_private_key" "cluster" {
  count     = var.generate_ssh_key ? 1 : 0
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "local_sensitive_file" "cluster_private_key" {
  count           = var.generate_ssh_key ? 1 : 0
  content         = tls_private_key.cluster[0].private_key_openssh
  filename        = var.generated_ssh_private_key_path
  file_permission = "0600"
}
```

### New ExaDB VM Cluster

```hcl
resource "oci_database_exadb_vm_cluster" "db" {
  count                         = var.existing_exadb_vm_cluster_id == "" ? 1 : 0
  compartment_id                = var.compartment_ocid
  availability_domain           = var.availability_domain
  display_name                  = var.cluster_display_name
  hostname                      = var.cluster_hostname
  shape                         = "ExaDbXS"
  subnet_id                     = var.client_subnet_id
  backup_subnet_id              = var.backup_subnet_id
  exascale_db_storage_vault_id  = local.storage_vault_id
  grid_image_id                 = var.grid_image_id
  ssh_public_keys               = local.ssh_public_keys
  nsg_ids                       = var.client_nsg_ids
  backup_network_nsg_ids        = var.backup_nsg_ids
  freeform_tags                 = var.freeform_tags
  defined_tags                  = var.defined_tags

  node_config {
    enabled_ecpu_count_per_node              = var.enabled_ecpu_count_per_node
    total_ecpu_count_per_node                = var.total_ecpu_count_per_node
    vm_file_system_storage_size_gbs_per_node = var.vm_file_system_storage_size_gbs_per_node
  }

  dynamic "node_resource" {
    for_each = toset(var.node_names)

    content {
      node_name = node_resource.value
    }
  }
}
```

If the user did not ask for tags, omit tag arguments instead of writing empty values.

### New DB Home With Initial Database

```hcl
resource "oci_database_db_home" "initial" {
  count         = var.create_db_home ? 1 : 0
  source        = "VM_CLUSTER_NEW"
  vm_cluster_id = local.vm_cluster_id
  display_name  = var.db_home_display_name
  db_version    = var.db_version

  database {
    admin_password = var.admin_password
    db_name        = var.database_name
    pdb_name       = var.pdb_name
    vm_cluster_id  = local.vm_cluster_id

    storage_size_details {
      data_storage_size_in_gb  = var.database_data_storage_size_gbs
      reco_storage_size_in_gbs = var.database_reco_storage_size_gbs
    }
  }
}
```

If the installed OCI provider requires different nested attributes, adjust the `database` block to its documented schema rather than inventing fields.

### Additional Database In Existing DB Home

```hcl
resource "oci_database_database" "additional" {
  count      = var.existing_db_home_id != "" ? 1 : 0
  source     = "NONE"
  db_home_id = var.existing_db_home_id

  database {
    admin_password = var.admin_password
    db_name        = var.additional_database_name
    pdb_name       = var.additional_pdb_name
    vm_cluster_id  = local.vm_cluster_id

    storage_size_details {
      data_storage_size_in_gb  = var.database_data_storage_size_gbs
      reco_storage_size_in_gbs = var.database_reco_storage_size_gbs
    }
  }
}
```

## Validation Rules

Use these variable validations when relevant:

```hcl
variable "vault_storage_size_gbs" {
  type = number

  validation {
    condition     = var.vault_storage_size_gbs > 0
    error_message = "vault_storage_size_gbs must be greater than 0."
  }
}

variable "enabled_ecpu_count_per_node" {
  type = number

  validation {
    condition     = var.enabled_ecpu_count_per_node > 0 && var.enabled_ecpu_count_per_node <= var.total_ecpu_count_per_node
    error_message = "enabled_ecpu_count_per_node must be positive and not exceed total_ecpu_count_per_node."
  }
}

variable "node_names" {
  type = list(string)

  validation {
    condition     = length(var.node_names) > 0
    error_message = "node_names must contain at least one node name."
  }
}
```

Also declare:

- `admin_password` as `sensitive = true`
- `ssh_public_keys` as `list(string)` with default `[]`
- `client_nsg_ids` and `backup_nsg_ids` as `list(string)` with default `[]`
- `generate_ssh_key` as `bool` with default `true`

## Outputs

Output only identifiers created in generated Terraform:

- `storage_vault_id`
- `vm_cluster_id`
- `db_home_id`
- `database_id`

Use this pattern:

```hcl
output "storage_vault_id" {
  value = try(oci_database_exascale_db_storage_vault.db[0].id, null)
}

output "vm_cluster_id" {
  value = try(oci_database_exadb_vm_cluster.db[0].id, null)
}

output "db_home_id" {
  value = try(oci_database_db_home.initial[0].id, null)
}

output "database_id" {
  value = try(oci_database_database.additional[0].id, null)
}
```

Do not emit outputs for reused existing resources unless the module created them.

## Terraform Boundary

Create only `main.tf`, `variables.tf`, and `terraform.tfvars`. Never invoke `terraform`, `terraform init`, `terraform fmt`, `terraform validate`, `terraform plan`, or `terraform apply`.
