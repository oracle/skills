# OKE Cluster Generator Questionnaire

Use this reference when running the full OKE cluster-generation workflow. Keep `SKILL.md` focused and load this file only when the user needs the full questionnaire rather than Fast Path Mode.

## Contents
- Session State
- Preflight
- Domain 1 - Cluster Fundamentals
- Domain 2 - Networking
- Domain 3 - Node Pools
- Domain 4 - Storage
- Domain 5 - Security and Access
- Domain 6 - Add-ons and Observability
- Domain 7 - ORM Schema Preferences
- Architecture Summary
- Code Generation Notes

## Session State

Track these values across all phases:

| Variable | Purpose |
|----------|---------|
| `WORKLOAD_TYPE` | `AI / ML`, `HPC`, `Microservices`, or `General Purpose` |
| `KUBERNETES_VERSION` | OKE Kubernetes version string |
| `CLUSTER_TYPE` | `Enhanced` or `Basic` |
| `TARGET_REGION` | OCI region for all OCI CLI calls |
| `TENANCY_OCID` | Root tenancy compartment OCID |
| `HOME_REGION` | Tenancy home region |
| `COMPARTMENT_OCID` | Target compartment OCID |
| `VCN_SOURCE` | `new` or `existing` |
| `EXISTING_VCN_OCID` | Existing VCN when `VCN_SOURCE=existing` |
| `CNI_TYPE` | `npn` or `flannel` |
| `RDMA_ROCE_SELECTED` | True when RDMA/RoCE is selected |
| `NODE_POOL_COUNT` | Number of node pools |
| `POOL_NAME_i` | Node pool name per pool |
| `POOL_SHAPE_i` | Shape per pool |
| `VAULT_MANAGEMENT_ENDPOINT` | KMS vault endpoint |
| `KMS_KEY_ID` | Customer-managed key OCID |
| `WORKLOAD_IDENTITY_ENABLED` | Enhanced cluster workload identity setting |

## Preflight

Run:

```bash
bash ../../scripts/preflight-check.sh
```

On success, parse:
- `.tenancy_ocid` -> `TENANCY_OCID`
- `.home_region` -> `HOME_REGION`
- `.regions[]` -> region options
- `.compartments[]` -> compartment options

If the OCI CLI is missing or unauthenticated, offer:
- Continue without CLI and enter OCIDs manually.
- Abort.

Never abort because one live discovery command fails. Set a `CLI_*_FALLBACK` flag and continue with static options or manual prompts.

## Domain 1 - Cluster Fundamentals

Fetch supported Kubernetes versions:

```bash
oci ce cluster-options get --cluster-option-id all \
  --query 'data."kubernetes-versions"' \
  --output json
```

Ask:

| Question | Options |
|----------|---------|
| Workload type | General Purpose, AI / ML, HPC, Microservices |
| Kubernetes version | Latest supported versions from CLI; fallback to `reference.md` |
| API endpoint | Private, Public |
| Cluster type | Enhanced, Basic |

If the user chooses a custom Kubernetes version, ask for the exact version string.

## Domain 2 - Networking

Ask:

| Question | Options |
|----------|---------|
| VCN source | Create new VCN, Use existing VCN |
| CNI plugin | VCN-native pod networking (`npn`), Flannel |
| Bastion/operator access | Bastion + Operator, Bastion only, Operator only, None |

If using an existing VCN, list VCNs:

```bash
oci network vcn list \
  --compartment-id "$COMPARTMENT_OCID" \
  --lifecycle-state AVAILABLE \
  --query 'data[*].{Name:"display-name",OCID:id,CIDR:"cidr-block"}' \
  --output json
```

Always collect:
- VCN CIDR or existing VCN CIDR.
- Pod CIDR.
- Service CIDR.

Validate CIDRs:

```bash
bash ../../scripts/validate-cidr.sh "<vcn_cidr>" "<pods_cidr>" "<services_cidr>"
```

If overlaps are detected, show the conflicting ranges and ask the user to revise before continuing.

Ask for gateways:
- NAT gateway.
- Service gateway.
- Internet gateway.

For AI / ML or HPC workloads, ask about additional network interfaces:
- RDMA / RoCE.
- SR-IOV.
- Multus multi-homed.
- None.

Set `RDMA_ROCE_SELECTED=true` when RDMA/RoCE is selected.

## Domain 3 - Node Pools

Ask for `NODE_POOL_COUNT`, then repeat this section for each node pool.

Fetch shape context before the loop:

```bash
oci compute shape list \
  --compartment-id "$COMPARTMENT_OCID" \
  --query 'data[*].shape' \
  --output json

oci limits value list \
  --compartment-id "$TENANCY_OCID" \
  --service-name compute \
  --all \
  --query 'data[?contains(name, `gpu`) || contains(name, `hpc`) || contains(name, `rdma`)]' \
  --output json
```

TODO(live validation): confirm the exact OCI Limits command and limit-name mapping for GPU/HPC/RDMA shape families in the target tenancy before treating a zero or missing value as conclusive.

Per pool, ask:
- Pool name.
- Shape family: VM Standard, VM GPU, BM GPU, BM HPC.
- Scaling strategy: fixed count or autoscaling.
- Exact shape name.
- OCPUs and memory for Flex shapes.
- Node count or min/max values.
- Boot volume performance: Higher Performance or Balanced.
- OS image: OKE-optimized or custom image OCID.
- Cloud-init: none, inline script, or file path.

Cross-checks:
- If RDMA/RoCE was selected, require a BM GPU or BM HPC shape unless the user explicitly revises the network choice or accepts the warning.
- If a GPU shape is selected for a non-AI/HPC workload, call out the cost and workload mismatch.
- Repeat service-limit warnings for selected GPU/HPC/RDMA families.

## Domain 4 - Storage

Ask for persistent storage backends:
- OCI Block Volume CSI.
- OCI File Storage.
- Object Storage.
- None.

If a DenseIO or BM.HPC shape was selected, ask whether to configure an NVMe StorageClass.

## Domain 5 - Security and Access

Ask:

| Question | Options |
|----------|---------|
| Node identity | Instance Principals, User credentials |
| IAM policies | Auto-generate, Manual |
| Pod security | Kubernetes Pod Security Admission, OCI Security Zones, Both, None |
| Volume encryption | Customer-managed key, Oracle-managed key |

If customer-managed keys are selected, list vaults:

```bash
oci kms management vault list \
  --compartment-id "$COMPARTMENT_OCID" \
  --lifecycle-state ACTIVE \
  --query 'data[*].{Name:"display-name",OCID:id,Endpoint:"management-endpoint"}' \
  --output json
```

Store the selected vault management endpoint, then list AES keys:

```bash
oci kms management key list \
  --compartment-id "$COMPARTMENT_OCID" \
  --endpoint "$VAULT_MANAGEMENT_ENDPOINT" \
  --protection-mode HSM \
  --algorithm AES \
  --lifecycle-state ENABLED \
  --query 'data[*].{Name:"display-name",OCID:id}' \
  --output json
```

If `CLUSTER_TYPE=Enhanced`, ask whether to enable Workload Identity.

## Domain 6 - Add-ons and Observability

If `CLUSTER_TYPE=Basic`, skip OKE managed add-ons and explain that managed add-ons require Enhanced clusters.

For Enhanced clusters, discover add-ons:

```bash
oci ce addon-option list \
  --kubernetes-version "$KUBERNETES_VERSION" \
  --query 'data[*].{Name:name,Description:description}' \
  --output json
```

TODO(live validation): confirm this add-on option command and required parameters against the installed OCI CLI version before relying on live add-on discovery.

Ask:
- OKE managed add-ons, multi-select, from CLI output or `reference.md`.
- Observability: OCI Logging, OCI Monitoring, Container Insights, None.
- GPU metrics, only if a GPU shape was selected: DCGM Exporter, OCI GPU Scanner, Both, None.

## Domain 7 - ORM Schema Preferences

Ask:

| Question | Options |
|----------|---------|
| Target audience | Expert, App team, Ops team, Minimal |
| Schema features | Variable groups, Help text and descriptions, Input validation rules, Conditional visibility |

## Architecture Summary

After all domains are confirmed, summarize:
- Cluster topology.
- Key design decisions and rationale.
- Cost and service-limit warnings.
- Known constraints.
- CLI fallback flags.

Ask the user to confirm or revise before code generation.

## Code Generation Notes

Generate artifacts only after confirmation:
- Read `reference.md` for exact variable mapping.
- Read `output-templates/terraform.md` for Terraform file shapes.
- Read `output-templates/schema.md` for ORM schema shape.
- Remove irrelevant template lines.
- Do not leave placeholders that would cause `terraform plan` to fail.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/ContEng/home.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengcreatingclusterusingoke_topic-Using_the_Console_to_create_a_Custom_Cluster_with_Explicitly_Defined_Settings.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengworkingwithenhancedclusters.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Concepts/contengpodnetworking.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengintroducingclusteraddons.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengconfiguringclusteraddons.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contenggrantingworkloadaccesstoresources.htm
- https://docs.oracle.com/en-us/iaas/Content/ResourceManager/Concepts/terraformconfigresourcemanager_topic-schema.htm
- https://docs.oracle.com/en-us/iaas/tools/oci-cli/latest/oci_cli_docs/
- https://github.com/oracle-terraform-modules/terraform-oci-oke
