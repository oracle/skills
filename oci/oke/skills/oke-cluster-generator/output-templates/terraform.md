# Terraform Templates

Use these as the base structure during Phase 3 code generation. Populate all variable
bindings from the user's answers using the mapping table in `reference.md`.
Never leave `# ...` placeholder comments or stub values that would cause `terraform plan`
to fail.

## Contents
- provider.tf
- main.tf — Module Call
- outputs.tf

---

## provider.tf

```hcl
terraform {
  required_version = ">= 1.3.0"
  required_providers {
    oci = {
      source  = "oracle/oci"
      version = ">= 5.0.0"
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

---

## main.tf — Module Call

```hcl
module "oke" {
  source  = "oracle-terraform-modules/oke/oci"
  version = "~> 5.0"

  # ── Cluster Fundamentals (Domain 1) ─────────────────────────────────────
  tenancy_id              = var.tenancy_ocid
  compartment_id          = var.compartment_ocid
  region                  = var.region
  cluster_name            = var.cluster_name
  kubernetes_version      = var.kubernetes_version
  cluster_type            = var.cluster_type
  control_plane_is_public = var.control_plane_is_public

  # ── Networking (Domain 2) ────────────────────────────────────────────────
  create_vcn              = var.create_vcn
  vcn_cidrs               = var.vcn_cidrs               # new VCN only
  vcn_id                  = var.existing_vcn_ocid       # existing VCN only
  pods_cidr               = var.pods_cidr
  services_cidr           = var.services_cidr
  cni_type                = var.cni_type
  create_bastion          = var.create_bastion
  create_operator         = var.create_operator
  create_nat_gateway      = var.create_nat_gateway
  create_service_gateway  = var.create_service_gateway
  create_internet_gateway = var.create_internet_gateway

  # ── Node Pools (Domain 3) ────────────────────────────────────────────────
  # Expand this map for each pool defined during the questionnaire.
  # See reference.md § Variable Mapping for per-pool variable structure.
  node_pools = var.node_pools

  # ── Storage (Domain 4) ──────────────────────────────────────────────────
  block_volume_csi_enabled = var.block_volume_csi_enabled
  fss_enabled              = var.fss_enabled

  # ── Security & Access (Domain 5) ────────────────────────────────────────
  create_policies           = var.create_policies
  kms_key_id                = var.kms_key_id
  workload_identity_enabled = var.workload_identity_enabled

  # ── Add-ons (Domain 6) ──────────────────────────────────────────────────
  cluster_addons = var.cluster_addons
}
```

TODO(live validation): Before using this template for an operator-ready bundle,
confirm the current `terraform-oci-oke` module major version and variable names
against the approved module source. If a variable has changed, update
`reference.md` and this template together instead of guessing.

Remove lines for variables not applicable to this deployment (e.g., remove `kms_key_id`
if Oracle-managed encryption was chosen, remove `vcn_id` if creating a new VCN, etc.).

---

## outputs.tf

```hcl
output "cluster_id" {
  description = "OCID of the OKE cluster"
  value       = module.oke.cluster_id
}

output "kubeconfig_cmd" {
  description = "Command to generate kubeconfig for this cluster"
  value       = "oci ce cluster create-kubeconfig --cluster-id ${module.oke.cluster_id} --region ${var.region} --token-version 2.0.0"
}

output "node_pool_ids" {
  description = "Map of node pool name to OCID"
  value       = module.oke.node_pool_ids
}

output "vcn_id" {
  description = "OCID of the VCN (created or existing)"
  value       = module.oke.vcn_id
}

output "bastion_public_ip" {
  description = "Public IP of the bastion host (null if not created)"
  value       = try(module.oke.bastion_public_ip, null)
}

output "operator_private_ip" {
  description = "Private IP of the operator instance (null if not created)"
  value       = try(module.oke.operator_private_ip, null)
}
```

Omit `bastion_public_ip` and `operator_private_ip` if neither was created (both
`create_bastion` and `create_operator` are false).

## Sources

- https://github.com/oracle-terraform-modules/terraform-oci-oke
- https://registry.terraform.io/providers/oracle/oci/latest/docs
- https://docs.oracle.com/en-us/iaas/Content/ContEng/home.htm
