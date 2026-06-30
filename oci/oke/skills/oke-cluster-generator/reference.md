# OKE Terraform Stack Builder — Reference Data

This file contains static fallback lists and the authoritative variable mapping table.
Read this file during the questionnaire when a CLI call fails, and at the start of Phase 3
code generation to ensure correct `terraform-oci-oke` module variable names.

## Contents
- Static Kubernetes Versions
- Static OKE Managed Add-ons
- Variable Mapping: User Selection → terraform-oci-oke Module Variables

---

## Static Kubernetes Versions

Use this list when `oci ce cluster-options get` fails or returns empty output.
Mark the first entry as "Latest GA (Recommended)".

| Label | Description |
|-------|-------------|
| `v1.32` (Latest GA) | Recommended — newest OKE-supported release with the longest support window. |
| `v1.31` | Previous GA release; stable and widely tested on OKE. |
| `v1.30` | Older GA release; choose only if a specific dependency requires it. |
| `Other (specify)` | Enter a custom version string in the follow-up free-text prompt. |

---

## Static OKE Managed Add-ons

Use this list when live add-on discovery fails or returns empty output. TODO(live validation):
confirm the exact `oci ce addon-option` command and required parameters for the installed
OCI CLI version before relying on live discovery.
These add-ons apply to Enhanced clusters only.

| Name | Description |
|------|-------------|
| `CoreDNS` | Cluster DNS — always required; managed version receives automatic patch updates. |
| `Kube-proxy` | Network proxy — always required; managed version receives automatic patch updates. |
| `Cluster Autoscaler` | Automatically scales node pools based on pending pod demand. |
| `OCI Native Ingress Controller` | Provisions OCI Load Balancers directly from Ingress resources; no NGINX required. |
| `DCGM Exporter` | NVIDIA DCGM exporter DaemonSet for GPU metrics (AI/ML workloads). |
| `Multus` | Multiple network interfaces per pod via the Multus CNI meta-plugin. |

---

## Variable Mapping: User Selection → terraform-oci-oke Module Variables

Read this table during Phase 3 code generation. Use the exact variable names shown in the
"Terraform Variable" column — do not guess or infer variable names from the module README.
TODO(live validation): Reconcile this mapping with the currently approved
`terraform-oci-oke` module version before claiming generated Terraform has been
plan-verified. If live validation is unavailable, call out the mapping as a
module-version assumption in the generated summary.

| Domain | User Selection / Answer | Terraform Variable | Type | Notes |
|--------|------------------------|-------------------|------|-------|
| D1 | Kubernetes version (e.g. `v1.32`) | `kubernetes_version` | string | Quote the string: `"v1.32.1"` |
| D1 | API visibility: Private | `control_plane_is_public = false` | bool | |
| D1 | API visibility: Public | `control_plane_is_public = true` | bool | |
| D1 | Cluster type: Enhanced | `cluster_type = "enhanced"` | string | |
| D1 | Cluster type: Basic | `cluster_type = "basic"` | string | |
| D2 | Create new VCN | `create_vcn = true` | bool | |
| D2 | Use existing VCN | `create_vcn = false`, `vcn_id = var.existing_vcn_ocid` | bool + string | |
| D2 | VCN CIDR | `vcn_cidrs = ["<cidr>"]` | list(string) | New VCN only |
| D2 | Pod CIDR | `pods_cidr = "<cidr>"` | string | Always required |
| D2 | Service CIDR | `services_cidr = "<cidr>"` | string | Always required |
| D2 | CNI: VCN-Native Pod Networking | `cni_type = "npn"` | string | |
| D2 | CNI: Flannel | `cni_type = "flannel"` | string | |
| D2 | Bastion + Operator | `create_bastion = true`, `create_operator = true` | bool | |
| D2 | Bastion only | `create_bastion = true`, `create_operator = false` | bool | |
| D2 | Operator only | `create_bastion = false`, `create_operator = true` | bool | |
| D2 | No access infra | `create_bastion = false`, `create_operator = false` | bool | |
| D2 | NAT Gateway | `create_nat_gateway = true` | bool | |
| D2 | Service Gateway | `create_service_gateway = true` | bool | |
| D2 | Internet Gateway | `create_internet_gateway = true` | bool | |
| D3 | Shape name (per pool) | `node_pools.<name>.shape` | string | e.g. `"VM.Standard.E4.Flex"` |
| D3 | Flex OCPUs (per pool) | `node_pools.<name>.ocpus` | number | Flex shapes only |
| D3 | Flex memory GB (per pool) | `node_pools.<name>.memory` | number | Flex shapes only |
| D3 | Fixed count (per pool) | `node_pools.<name>.node_pool_size` | number | |
| D3 | Autoscaling enabled | `node_pools.<name>.autoscale = true` | bool | |
| D3 | Autoscaling min | `node_pools.<name>.min_node_count` | number | |
| D3 | Autoscaling max | `node_pools.<name>.max_node_count` | number | |
| D3 | Boot: Higher Performance | `node_pools.<name>.boot_volume_vpus_per_gb = 20` | number | |
| D3 | Boot: Balanced | `node_pools.<name>.boot_volume_vpus_per_gb = 10` | number | |
| D3 | OS: OKE-optimised | (no override — use OKE default image) | — | |
| D3 | OS: Custom image OCID | `node_pools.<name>.image_id = "<ocid>"` | string | |
| D4 | Block Volume CSI | `block_volume_csi_enabled = true` | bool | |
| D4 | OCI File Storage (FSS) | `fss_enabled = true` | bool | |
| D5 | Instance Principals | (default — no extra variable) | — | |
| D5 | Auto-generate IAM policies | `create_policies = true` | bool | |
| D5 | Manual IAM policies | `create_policies = false` | bool | |
| D5 | Kubernetes PSA | `psp_enabled = false` (use native K8s PSA) | bool | |
| D5 | BYOK encryption key | `kms_key_id = var.kms_key_id` | string | |
| D5 | Oracle-managed encryption | (no variable — OCI default) | — | |
| D5 | Workload Identity enabled | `workload_identity_enabled = true` | bool | Enhanced only |
| D6 | CoreDNS managed add-on | `cluster_addons = { coredns = { remove = false } }` | map | Enhanced only |
| D6 | Cluster Autoscaler add-on | `cluster_addons = { cluster-autoscaler = { remove = false } }` | map | Enhanced only |
| D6 | OCI Native Ingress add-on | `cluster_addons = { oci-native-ingress-controller = { remove = false } }` | map | Enhanced only |
| D6 | OCI Logging | `oke_logging_enabled = true` | bool | |
| D6 | OCI Monitoring | `oke_monitoring_enabled = true` | bool | |

## Sources

- https://docs.oracle.com/en-us/iaas/Content/ContEng/home.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengworkingwithenhancedclusters.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengintroducingclusteraddons.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengconfiguringclusteraddons.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Concepts/contengpodnetworking.htm
- https://github.com/oracle-terraform-modules/terraform-oci-oke
- https://registry.terraform.io/providers/oracle/oci/latest/docs
