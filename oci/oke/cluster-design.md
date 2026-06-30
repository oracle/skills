# OKE Cluster Design and Terraform Planning

## Overview

Use this skill to design an OCI Kubernetes Engine (OKE) cluster and translate the design into Terraform or an OCI Resource Manager stack. It is intended for cluster creation, cluster modernization, and review of OKE infrastructure plans before deployment.

Start from official OKE requirements, then map the chosen architecture to Terraform variables, Resource Manager schema inputs, and validation checks.

For full operational behavior, load `oci/oke/skills/oke-cluster-generator/SKILL.md` and its supporting files before generating artifacts. That skill preserves the OKE generator workflow, including live preflight discovery, CIDR validation, Terraform output templates, and OCI Resource Manager schema guidance.

Supporting tools and references:

- `oci/oke/scripts/preflight-check.sh`
- `oci/oke/scripts/validate-cidr.sh`
- `oci/oke/skills/oke-cluster-generator/references/questionnaire.md`
- `oci/oke/skills/oke-cluster-generator/reference.md`
- `oci/oke/skills/oke-cluster-generator/output-templates/terraform.md`
- `oci/oke/skills/oke-cluster-generator/output-templates/schema.md`

## Tool Use

Use the included tools during the design workflow:

| Phase | Tool | When to use |
|-------|------|-------------|
| Preflight | `oci/oke/scripts/preflight-check.sh` | Run before asking detailed design questions when OCI CLI is available. Use the output to identify tenancy OCID, home region, subscribed regions, and active compartments. |
| Networking | `oci/oke/scripts/validate-cidr.sh` | Run before finalizing VCN, pod, and service CIDRs. Re-run if the user revises any CIDR late in the flow. |

Example preflight:

```bash
bash oci/oke/scripts/preflight-check.sh
```

Example CIDR validation:

```bash
bash oci/oke/scripts/validate-cidr.sh 10.0.0.0/16 10.244.0.0/16 10.96.0.0/16
```

If a tool fails because local OCI access is unavailable, continue with explicit manual prompts and record that generated artifacts rely on manually supplied values.

## Design Sequence

1. Confirm tenancy context:
   - Region
   - Compartment
   - Existing VCN or new VCN
   - Required environments such as dev, test, prod, or regulated workloads

2. Choose cluster model:
   - Enhanced cluster when using enhanced-cluster features such as managed add-ons and Workload Identity.
   - Basic cluster only when the workload does not need enhanced-cluster features.
   - Kubernetes version aligned with OKE-supported versions and node image compatibility.

3. Choose API endpoint access:
   - Private endpoint for restricted administration paths.
   - Public endpoint only when external access is required and NSG/security-list rules are tightly scoped.
   - Separate API endpoint, worker, pod, and load balancer subnets where practical.

4. Choose pod networking:
   - VCN-native pod networking when pods need VCN-routable IPs, virtual nodes, or multiple secondary VNIC pod networking.
   - Flannel overlay only when VCN-routable pod IPs and VCN-native features are not required.
   - Check pod CIDR and service CIDR overlap before finalizing the network plan.

5. Design node pools:
   - Use separate node pools for materially different workload profiles.
   - Capture shape, OCPU, memory, node count, autoscaling boundaries, image source, labels, taints, boot volume, and placement subnets.
   - Confirm shape availability, quota, and VNIC/pod capacity in the target region and availability domains.

6. Select add-ons and integrations:
   - CoreDNS and kube-proxy are baseline cluster components.
   - Consider Cluster Autoscaler, OCI Native Ingress Controller, CSI drivers, monitoring, and logging based on workload needs.
   - For OCI API access from pods, use Workload Identity on enhanced clusters.

7. Define security and operations:
   - Prefer private worker nodes.
   - Use NSGs where possible for API endpoint, worker, pod, and load balancer traffic.
   - Use least-privilege IAM policies.
   - Decide whether to use Oracle-managed encryption or customer-managed keys.
   - Define tagging, backup, upgrade, observability, and incident response expectations.

## Fast Path Starter Design

When the user asks for a quick starter stack, use conservative defaults and ask only for values that cannot be inferred:

| Area | Starter value |
|------|---------------|
| Cluster type | Enhanced |
| API endpoint | Private |
| VCN | New VCN |
| VCN CIDR | `10.0.0.0/16` |
| CNI | VCN-native pod networking |
| Worker nodes | Private managed nodes |
| Node pool | 3 nodes, flexible general-purpose shape where available |
| Gateways | NAT gateway and service gateway |
| Add-ons | CoreDNS and kube-proxy, plus autoscaler when autoscaling is enabled |
| IAM | Create required policies or document manual policies |
| Workload Identity | Enabled when pods need OCI API access |
| Encryption | Oracle-managed unless a customer key is required |

Before generating Terraform, show the starter design back to the user and ask whether they want to revise networking, node pools, access, add-ons, or security.

## Terraform and Resource Manager Guidance

When generating Terraform:

- Prefer the official Oracle Terraform OKE module when it meets the design requirements.
- Pin or record the module version used for variable mapping.
- Keep required values explicit: region, tenancy OCID, compartment OCID, cluster name, Kubernetes version, network settings, and node pools.
- Do not guess module variable names. Verify them against the selected module version.
- Generate `terraform.tfvars.example` with placeholder OCIDs rather than real secrets.
- Include outputs for cluster OCID, node pool OCIDs, kubeconfig guidance, VCN/subnet IDs, and any created policy or key resources.
- If building an OCI Resource Manager stack, include a `schema.yaml` that groups inputs by audience and hides irrelevant fields when possible.

## Validation Checklist

Before presenting the final stack, check:

- No CIDR overlap among VCN, pods, services, and connected networks.
- Kubernetes control plane and node versions are compatible.
- Chosen node images match the node Kubernetes version and shape architecture.
- Quotas and service limits are called out for node shapes, GPUs, load balancers, block volumes, and public IPs.
- Private nodes have egress through NAT and service gateway paths when needed.
- API endpoint access rules match the intended administration path.
- NSG and route-table assumptions are documented.
- Add-ons are valid for the selected cluster type.
- Workload Identity is only recommended for enhanced clusters.
- Customer-managed keys include required KMS permissions.
- Generated Terraform has clear validation steps such as `terraform fmt`, `terraform validate`, and `terraform plan`.

## Common Mistakes

- Selecting Flannel when the design requires VCN-routable pod IPs, virtual nodes, or multiple secondary VNIC pod networking.
- Using a public API endpoint without tightly scoped source CIDRs.
- Reusing one node pool for workloads with different security, cost, GPU, RDMA, or scaling requirements.
- Assuming shape availability or quota without checking the target region.
- Enabling autoscaling without confirming Cluster Autoscaler installation and node-pool min/max values.
- Mixing real tenancy-specific OCIDs into examples that will be committed to source control.
- Claiming a Terraform plan has been validated when only static generation was performed.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/ContEng/home.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengcreatingclusterusingoke_topic-Using_the_Console_to_create_a_Custom_Cluster_with_Explicitly_Defined_Settings.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengworkingwithenhancedclusters.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengintroducingclusteraddons.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Concepts/contengpodnetworking.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contenggrantingworkloadaccesstoresources.htm
- https://github.com/oracle-terraform-modules/terraform-oci-oke
