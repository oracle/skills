# File mapping

## Module block

Use one block, with only the requested configuration inputs and dependency maps. Keep the Exadata Infrastructure input as the full top-level object, not a flattened map:

```hcl
module "exadata_database" {
  source = "git::https://github.com/oci-landing-zones/terraform-oci-modules-oracle-database.git//exadata-database?ref=main"

  default_compartment_id                      = var.default_compartment_id
  compartments_dependency                     = var.compartments_dependency
  network_dependency                          = var.network_dependency
  subscription_dependency                     = var.subscription_dependency
  cloud_exadata_infrastructures_configuration = var.cloud_exadata_infrastructures_configuration
  cloud_vm_clusters_configuration             = var.cloud_vm_clusters_configuration
  cloud_db_homes_configuration                = var.cloud_db_homes_configuration
  databases_configuration                     = var.databases_configuration
  pluggable_databases_configuration           = var.pluggable_databases_configuration
}
```

Confirm every selected argument against the approved revision's `variables.tf`; the example is a wiring pattern, not permission to include unavailable values.

For `cloud_exadata_infrastructures_configuration`, preserve the nested object shape from the upstream module contract:

```hcl
cloud_exadata_infrastructures_configuration = {
  cloud_exadata_infrastructures = {
    EXAINFRA = {
      display_name = "..."
      shape        = "Exadata.X11M"
    }
  }
}
```

For the full Exadata chain, preserve the nested object and map structure for each layer:

```hcl
cloud_vm_clusters_configuration = {
  EXAVM = {
    exadata_infrastructure_id = "EXAINFRA"
    backup_subnet_id          = "ocid1.subnet..."
    cpu_core_count            = 8
    display_name              = "..."
    gi_version                = "..."
    hostname                  = "..."
    ssh_public_keys           = ["<literal-public-key>"]
    subnet_id                 = "ocid1.subnet..."
  }
}

cloud_db_homes_configuration = {
  EXADBHOME = {
    vm_cluster_id = "EXAVM"
    source        = "VM_CLUSTER_NEW"
  }
}

databases_configuration = {
  EXACDB = {
    db_home_id = "EXADBHOME"
    source     = "NONE"
    database = {
      admin_password = "<secret>"
      db_name        = "..."
    }
  }
}

pluggable_databases_configuration = {
  EXAPDB = {
    container_database_id = "EXACDB"
    pdb_name              = "..."
  }
}
```

## Files

- `main.tf`: Terraform and OCI provider blocks, the module source/wiring, and no secret values.
- `variables.tf`: typed module inputs copied from the approved upstream `variables.tf` only as needed. Mark secret variables `sensitive = true`.
- `terraform.tfvars`: validated non-secret literal OCIDs, map keys, region, topology, shapes, tags, and optionally literal public keys. Never include Terraform expressions or functions such as `file()`, `${...}`, `path.module`, or `templatefile()`, or include private-key contents, passwords, TDE wallet values, or tokens.

## Repository-local SSH public-key files

When resolving a repo-local SSH public-key file, keep the expression in `main.tf`, not `terraform.tfvars`. If the input variable otherwise requires `ssh_public_keys`, declare it optional with an empty-list default and merge the resolved key into the matching VM-cluster object at module wiring:

```hcl
cloud_vm_clusters_configuration = {
  for key, cluster in var.cloud_vm_clusters_configuration :
  key => key == "VM_CLUSTER_KEY" ? merge(cluster, {
    ssh_public_keys = [trimspace(file("${path.module}/ssh-keys/example_public.pem"))]
  }) : cluster
}
```

Use the actual stable VM-cluster key and verified repository-relative path; do not invent either value.

For the Exadata dependency chain, retain stable local keys from Exadata Infrastructure to VM Cluster to DB Home to CDB to PDB. Do not hardcode a guessed OCID. Do not generate the prerequisite network or IAM resources; the client/backup subnets and associated connectivity must already satisfy `reference.md`.
