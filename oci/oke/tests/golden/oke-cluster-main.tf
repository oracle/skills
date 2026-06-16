module "oke" {
  source  = "oracle-terraform-modules/oke/oci"
  version = "~> 5.0"

  tenancy_id              = var.tenancy_ocid
  compartment_id          = var.compartment_ocid
  region                  = var.region
  cluster_name            = "demo-private-oke"
  kubernetes_version      = var.kubernetes_version
  cluster_type            = "enhanced"
  control_plane_is_public = false

  create_vcn              = true
  vcn_cidrs               = ["10.0.0.0/16"]
  pods_cidr               = "10.244.0.0/16"
  services_cidr           = "10.96.0.0/16"
  cni_type                = "npn"
  create_bastion          = false
  create_operator         = false
  create_nat_gateway      = true
  create_service_gateway  = true
  create_internet_gateway = false

  node_pools = {
    general = {
      shape         = "VM.Standard.E5.Flex"
      ocpus         = 2
      memory        = 16
      node_pool_size = 3
    }
  }

  block_volume_csi_enabled = true
  fss_enabled              = false
  create_policies          = true
  workload_identity_enabled = true

  cluster_addons = {
    coredns    = { remove = false }
    kube-proxy = { remove = false }
  }
}
