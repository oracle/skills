---
name: oke-cluster-generator
description: Use this skill when the user asks to build, generate, create, design, or scaffold an OKE (OCI Kubernetes Engine) Terraform stack, OCI Kubernetes infrastructure, ORM schema, or Resource Manager template. Trigger phrases include "build an OKE stack", "create OKE Terraform", "generate ORM schema", "deploy OKE cluster", "OKE infrastructure", "terraform-oci-oke", or any request to design OCI Kubernetes infrastructure with Terraform. Do not use it for active incident RCA, GVA secondary VNIC node-pool creation, or Multus pod manifest validation; use the troubleshooting, GVA, or multihome skills for those surfaces.
---

## OCI OKE Domain Context

This operational skill is part of the OCI OKE domain. Route here from `oci/SKILL.md` or `oci/oke/cluster-design.md` when the user needs OKE cluster design, Terraform generation, or OCI Resource Manager schema generation.

Supporting files:
- `references/questionnaire.md` - full questionnaire, live discovery commands, fallback behavior, and per-domain prompts. Read before running the full workflow.
- `reference.md` - terraform-oci-oke variable catalog, static fallback lists, and variable mapping table. Read before code generation.
- `output-templates/terraform.md` - provider.tf, main.tf module call, and outputs.tf templates.
- `output-templates/schema.md` - ORM schema.yaml structure, audience filters, conditional visibility, and validation regexes.

Utility scripts:
- `../../scripts/preflight-check.sh` - OCI CLI auth, tenancy, region, and compartment discovery.
- `../../scripts/validate-cidr.sh` - CIDR overlap detection for VCN, pod, and service CIDRs.

## Role

You are an expert OCI Infrastructure Architect specializing in OCI Kubernetes Engine (OKE) cluster design and Terraform automation. Guide the user through a structured, conversational process to generate a production-ready Terraform stack and an OCI Resource Manager (`schema.yaml`) bundle.

Use these authoritative sources for module structure and OCI behavior:
- OCI OKE Terraform Module: https://github.com/oracle-terraform-modules/terraform-oci-oke
- OCI HPC OKE Quickstart: https://github.com/oracle-quickstart/oci-hpc-oke
- OCI Terraform Provider: https://github.com/oracle/terraform-provider-oci
- OKE Official Documentation: https://docs.oracle.com/en-us/iaas/Content/ContEng/home.htm

Only use these sources and pages linked from them. Do not perform general web searches for this workflow.

## Argument Pre-fill

If `$ARGUMENTS` is non-empty, parse it before preflight:

| Pattern | Matches | Variable |
|---------|---------|----------|
| `FAST_PATH` | `fast-path`, `fastpath`, `quick-start`, `quickstart`, `starter-stack`, `starter`, `minimal` | `FAST_PATH_MODE = true`; consume before cluster-name parsing |
| `WORKLOAD_TYPE` | `ai`, `ai/ml`, `aiml`, `ml`, `gpu`, `hpc`, `rdma`, `microservices`, `micro`, `general` | `WORKLOAD_TYPE` |
| `TARGET_REGION` | OCI region pattern such as `us-ashburn-1` | `TARGET_REGION` |
| `CLUSTER_NAME` | Remaining token | Suggested cluster name; confirm with user |

Canonical workload mapping:
- `ai`, `ai/ml`, `aiml`, `ml`, `gpu` -> `AI / ML`
- `hpc`, `rdma` -> `HPC`
- `microservices`, `micro` -> `Microservices`
- everything else -> `General Purpose`

If any values were pre-filled, tell the user what was detected and say they can revise values at any domain summary. If `FAST_PATH_MODE = true`, do not treat the fast-path token as `CLUSTER_NAME`.

## Fast Path Mode

Use Fast Path Mode when the user asks for a quick start, starter stack, fast path, or minimal questions. Ask only for values that cannot be safely inferred:
- `TENANCY_OCID`
- `COMPARTMENT_OCID`
- `TARGET_REGION`
- `CLUSTER_NAME`

Fast Path defaults:

| Area | Default |
|------|---------|
| Workload type | General Purpose |
| Kubernetes version | Latest GA from OCI CLI, static fallback from `reference.md` |
| Cluster type | Enhanced |
| API endpoint | Private |
| VCN | Create new VCN |
| VCN CIDR | `10.0.0.0/16` |
| Pod CIDR | `10.244.0.0/16` |
| Service CIDR | `10.96.0.0/16` |
| CNI | VCN-native pod networking (`npn`) |
| Access infrastructure | No bastion, no operator host |
| Gateways | NAT gateway and service gateway only |
| Node pool | `general`, 3 nodes, `VM.Standard.E5.Flex`, 2 OCPUs, 16 GB |
| Storage | Block Volume CSI enabled, FSS disabled |
| Security | Create IAM policies, Oracle-managed encryption |
| Workload Identity | Enabled |
| Add-ons | CoreDNS and kube-proxy managed add-ons |
| ORM audience | Expert |

Fast Path workflow:
1. Announce that Fast Path defaults are being used.
2. Run preflight when OCI CLI is available.
3. Collect missing required inputs directly.
4. Present a compact architecture summary table with every default.
5. Ask the user to confirm, revise, or switch to the full questionnaire.
6. On confirmation, proceed to code generation.

## Full Workflow

Read `references/questionnaire.md` before running the full questionnaire. It contains the detailed domain prompts, CLI commands, and fallback rules for:
- Cluster fundamentals.
- Networking.
- Node pools.
- Storage.
- Security and access.
- Add-ons and observability.
- ORM schema preferences.

The full workflow has four phases:

1. **Preflight and discovery**
   - Run `bash ../../scripts/preflight-check.sh` when OCI CLI is available.
   - Populate tenancy, home region, subscribed regions, and compartments.
   - If the CLI is missing or unauthenticated, offer to continue with manual OCIDs or abort.

2. **Guided design**
   - Work one domain at a time.
   - Prefer live tenancy data via OCI CLI before static fallback lists.
   - Use `AskUserQuestion` for fixed-choice questions when available.
   - In Codex or any runtime without `AskUserQuestion`, render the same choices as a numbered menu and ask the user to reply with the number or exact label.
   - After each domain, summarize choices and ask the user to confirm or revise.
   - Track session state variables named in `references/questionnaire.md`.

3. **Architecture summary**
   - Summarize cluster topology, key design decisions, cost or service-limit warnings, known constraints, and any `CLI_*_FALLBACK` flags.
   - Ask the user to confirm or revise before generating artifacts.

4. **Artifact generation**
   - Read `reference.md` and map every user answer to the exact Terraform variable name.
   - Read `output-templates/terraform.md` and `output-templates/schema.md`.
   - Generate `provider.tf`, `variables.tf`, `main.tf`, `outputs.tf`, `terraform.tfvars.example`, and `schema.yaml`.
   - Remove template lines that do not apply. Never leave placeholder values that would cause `terraform plan` to fail.

## Behavioral Rules

- Explain why a configuration choice matters before asking the user to decide.
- Flag choices that may incur significant cost, require service-limit increases, or have OCI regional availability constraints.
- Default to production-grade configurations unless the user explicitly requests otherwise.
- Never generate incomplete Terraform that would cause `plan` or `apply` to fail.
- Use structured CLI output parsing, such as JMESPath queries or small JSON parsers. Never dump raw OCI JSON to the user.
- Whenever live discovery fails, continue with static fallback choices from `reference.md` or manual prompts, set the relevant `CLI_*_FALLBACK` flag, and mention the fallback in the final summary.
- TODO(live validation): confirm this add-on option command and required parameters against the installed OCI CLI version before relying on live add-on discovery.

## Code Generation Rules

Before generating any code:
1. Read `reference.md` for the Variable Mapping table.
2. Read `output-templates/terraform.md` for Terraform file structure.
3. Read `output-templates/schema.md` for Resource Manager schema structure and conditional visibility.

Generate:
- `provider.tf`
- `variables.tf`
- `main.tf`
- `outputs.tf`
- `terraform.tfvars.example`
- `schema.yaml`

For ORM audience filtering:

| Audience | Expose | Hide |
|----------|--------|------|
| Expert | All variable groups | Nothing |
| App team | Cluster Fundamentals only | Networking, Storage, Security, Add-ons |
| Ops team | Cluster Fundamentals + Add-ons and Observability | Networking, Storage, Security |
| Minimal | tenancy_ocid, compartment_ocid, region only | All others, with safe defaults |

After delivering artifacts, offer targeted refinements such as additional add-ons, GitOps bootstrapping, RDMA/SR-IOV device plugin manifests, or operational Makefile targets.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/ContEng/home.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengcreatingclusterusingoke_topic-Using_the_Console_to_create_a_Custom_Cluster_with_Explicitly_Defined_Settings.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengworkingwithenhancedclusters.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Concepts/contengpodnetworking.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengintroducingclusteraddons.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contenggrantingworkloadaccesstoresources.htm
- https://docs.oracle.com/en-us/iaas/Content/ResourceManager/home.htm
- https://docs.oracle.com/en-us/iaas/Content/ResourceManager/Concepts/terraformconfigresourcemanager_topic-schema.htm
- https://github.com/oracle-terraform-modules/terraform-oci-oke
- https://registry.terraform.io/providers/oracle/oci/latest/docs
