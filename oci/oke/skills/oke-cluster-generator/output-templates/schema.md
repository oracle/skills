# ORM Schema Templates

Use these structures and patterns during Phase 3 when generating `schema.yaml`.
Apply audience filtering rules from Domain 7 to decide which variable groups to surface.

## Contents
- schema.yaml Top-Level Structure
- Audience Filtering (from Domain 7)
- Conditional Visibility Patterns
- Input Validation Patterns
- Per-Variable Schema Entry Example

---

## schema.yaml Top-Level Structure

```yaml
title: "OKE Terraform Stack"
description: "Deploy an OKE cluster with customizable networking, node pools, and security."
schemaVersion: "1.1.0"
version: "1.0.0"
locale: "en"
logoUrl: ""

variableGroups:
  - title: "Cluster Fundamentals"
    variables:
      - tenancy_ocid
      - compartment_ocid
      - region
      - cluster_name
      - kubernetes_version
      - cluster_type
      - control_plane_is_public

  - title: "Networking"
    variables:
      - create_vcn
      - vcn_cidrs
      - existing_vcn_ocid
      - pods_cidr
      - services_cidr
      - cni_type
      - create_bastion
      - create_operator
      - create_nat_gateway
      - create_service_gateway
      - create_internet_gateway

  - title: "Node Pools"
    variables:
      - node_pools

  - title: "Storage"
    variables:
      - block_volume_csi_enabled
      - fss_enabled

  - title: "Security & Access"
    variables:
      - create_policies
      - kms_key_id
      - workload_identity_enabled

  - title: "Add-ons & Observability"
    variables:
      - cluster_addons
      - oke_logging_enabled
      - oke_monitoring_enabled
```

---

## Audience Filtering (from Domain 7)

| Audience | Expose these groups | Hide these groups |
|----------|--------------------|--------------------|
| Expert — all variables | All 6 groups | None |
| App team — simplified | Cluster Fundamentals only | Networking, Storage, Security, Add-ons |
| Ops team — operational | Cluster Fundamentals, Add-ons & Observability | Networking, Storage, Security |
| Minimal — required only | Cluster Fundamentals (tenancy_ocid, compartment_ocid, region only) | All others; set everything else to `required: false` with a sensible default |

---

## Conditional Visibility Patterns

### Show field only for private control plane:

```yaml
visible:
  and:
    - eq:
      - ${control_plane_is_public}
      - false
```

### Show field only for Enhanced cluster:

```yaml
visible:
  and:
    - eq:
      - ${cluster_type}
      - "enhanced"
```

### Show field only when creating a new VCN:

```yaml
visible:
  and:
    - eq:
      - ${create_vcn}
      - true
```

### Show field only when using an existing VCN:

```yaml
visible:
  and:
    - eq:
      - ${create_vcn}
      - false
```

### Show GPU-specific fields (any node pool shape contains "GPU"):

```yaml
visible:
  or:
    - contains:
      - ${node_pool_shape}
      - "GPU"
    - contains:
      - ${node_pool_shape}
      - "H100"
    - contains:
      - ${node_pool_shape}
      - "A100"
```

### Show KMS key field only when BYOK is enabled:

```yaml
visible:
  and:
    - eq:
      - ${byok_enabled}
      - true
```

---

## Input Validation Patterns

### CIDR block validation:

```yaml
pattern: "^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$"
```

### Kubernetes version validation:

```yaml
pattern: "^v[0-9]+\.[0-9]+(\.[0-9]+)?$"
```

### OCI region identifier validation:

```yaml
pattern: "^[a-z]{2}-[a-z]+-[0-9]$"
```

### OCID validation:

```yaml
pattern: "^ocid1\.[a-z]+\.oc[0-9]+\.[a-z0-9]*\.[a-z0-9]+"
```

---

## Per-Variable Schema Entry Example

```yaml
variables:
  kubernetes_version:
    title: "Kubernetes Version"
    description: "OKE Kubernetes version to deploy. Use the latest GA release unless a specific version is required."
    type: string
    required: true
    default: "v1.32"
    pattern: "^v[0-9]+\.[0-9]+(\.[0-9]+)?$"

  cni_type:
    title: "CNI Plugin"
    description: "Container network interface plugin. VCN-Native (npn) is recommended for production."
    type: enum
    required: true
    default: "npn"
    enum:
      - npn
      - flannel

  control_plane_is_public:
    title: "API Endpoint Visibility"
    description: "Whether the Kubernetes API server endpoint is publicly accessible."
    type: boolean
    required: true
    default: false
```

## Sources

- https://docs.oracle.com/en-us/iaas/Content/ResourceManager/home.htm
- https://docs.oracle.com/en-us/iaas/Content/ResourceManager/Concepts/terraformconfigresourcemanager_topic-schema.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/home.htm
