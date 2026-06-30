---
name: oci
description: Oracle Cloud Infrastructure guidance for designing, operating, and troubleshooting OCI services, including OCI Kubernetes Engine (OKE), OCI Internet of Things Platform, and Enterprise AI workflows for OCI Generative AI models, Responses API agents, RAG, cost estimation, governance, private endpoints, hosted agentic applications, and Oracle platform integrations. Use when the user asks about OKE cluster design, Terraform or Resource Manager planning, OKE incident troubleshooting, Generic VNIC Attachment, Multus, pod networking, node pools, add-ons, ingress, load balancers, OCIR image pulls, Workload Identity, Kubernetes workloads on OCI, OCI IoT domains or digital twins, device publish flows, OCI Generative AI, Enterprise AI Models, Enterprise AI Agents, governed GenAI applications, agentic workflows, RAG on Oracle Cloud, or OCI Generative AI pricing.
---

# Oracle Cloud Infrastructure Skills

Use this domain for practical Oracle Cloud Infrastructure guidance. Current content covers OCI Kubernetes Engine (OKE): cluster design, operational troubleshooting, Generic VNIC Attachment (GVA), and Multus multi-interface pod validation. It covers OCI Internet of Things Platform resource discovery, digital twin lifecycle workflows, device publish flows, and optional MCP-assisted operation. It also covers Enterprise AI because that work is built around OCI Generative AI, OCI networking, IAM, cost estimation, hosted applications, and OCI platform integrations.

## How to Use This Domain

1. Start with the routing table below.
2. Read only the smallest service file or nested skill that matches the user's task.
3. Prefer official Oracle documentation and live read-only discovery commands before making design or remediation recommendations.
4. Ask before running commands that create, update, delete, restart, scale, drain, or otherwise mutate OCI or Kubernetes resources.
5. Keep OCI-owned design decisions here, and route database-owned SQL, vector, and Select AI implementation details to `db/features/`.

## Directory Structure

```text
oci/
├── SKILL.md
├── enterprise-ai/
│   ├── SKILL.md
│   ├── models/
│   ├── agent-workflows/
│   ├── governance/
│   ├── data/
│   ├── cost/
│   └── integrations/
├── iot-platform/
│   ├── SKILL.md
│   ├── agents/
│   ├── references/
│   ├── scripts/
│   ├── templates/
│   └── tests/
└── oke/
    ├── cluster-design.md
    ├── troubleshooting.md
    ├── gva-node-pools.md
    ├── multus-multihome.md
    ├── skills/
    ├── scripts/
    ├── agents/
    ├── shared/
    ├── examples/
    └── tests/
```

## Category Routing

| Topic | Start With |
|-------|------------|
| Design or scaffold an OKE cluster, Terraform stack, or OCI Resource Manager stack | Start with `oci/oke/cluster-design.md`, then load `oci/oke/skills/oke-cluster-generator/SKILL.md` |
| Troubleshoot OKE workloads, pods, services, DNS, add-ons, ingress, load balancers, image pulls, storage, Workload Identity, or cluster access | Start with `oci/oke/troubleshooting.md`, then load `oci/oke/skills/oke-troubleshooter/SKILL.md` |
| Configure OKE managed node pools with Generic VNIC Attachment secondary VNIC profiles and Application Resources | Start with `oci/oke/gva-node-pools.md`, then load `oci/oke/skills/oke-gva-deployer/SKILL.md` |
| Deploy or validate Multus NetworkAttachmentDefinitions and multi-interface pods on OKE | Start with `oci/oke/multus-multihome.md`, then load `oci/oke/skills/oke-multihome-deployer/SKILL.md` |
| OCI IoT domains, domain groups, digital twin models, adapters, instances, relationships, raw commands, Data API access, or HTTPS publish flows | `oci/iot-platform/SKILL.md` |
| OCI Generative AI models, custom/imported models, endpoints, or private endpoints | `oci/enterprise-ai/SKILL.md` |
| OCI Responses API agents, tools, memory, File Search, Code Interpreter, MCP, or SQL Search | `oci/enterprise-ai/SKILL.md` |
| OCI Generative AI and OCI Generative AI Agents cost estimation | `oci/enterprise-ai/cost/cost-estimation.md` |
| OCI Enterprise AI governance, IAM, API keys, OAuth, guardrails, or ZPR | `oci/enterprise-ai/governance/private-endpoints-and-governance.md` |

## Key Starting Points

- `oci/oke/cluster-design.md`
- `oci/oke/troubleshooting.md`
- `oci/oke/gva-node-pools.md`
- `oci/oke/multus-multihome.md`
- `oci/iot-platform/SKILL.md`
- `oci/iot-platform/references/cli-workflows.md`
- `oci/iot-platform/references/mcp-optional-use.md`
- `oci/enterprise-ai/SKILL.md`
- `oci/enterprise-ai/models/enterprise-ai-models.md`
- `oci/enterprise-ai/agent-workflows/responses-api-agents.md`
- `oci/enterprise-ai/cost/cost-estimation.md`
- `oci/enterprise-ai/governance/private-endpoints-and-governance.md`

## Operational Tools

The OKE operational skills include deterministic helper tools under `oci/oke/scripts/` and skill-specific helper scripts under `oci/oke/skills/*/scripts/`.

- Read-only discovery and evidence tools may be used to collect context.
- Generate-only tools may produce manifests, commands, Terraform snippets, or reports.
- Any tool or command that creates, updates, deletes, patches, restarts, scales, drains, debugs, assigns IPs, applies manifests, or otherwise mutates OCI or Kubernetes resources requires explicit user approval first.
- `oci/oke/scripts/gva-menu.sh` is allowed to create an OKE node pool for the GVA workflow only after the user approves execution and completes its final `CREATE` confirmation.
- `oci/oke/scripts/node-doctor-run.sh` requires approval before execution because it creates a temporary debug pod and may delete that pod during cleanup.

## Common Multi-Step Flows

| Task | Recommended Sequence |
|------|----------------------|
| Plan a production OKE cluster | `oke/cluster-design.md` |
| Diagnose an OKE service with no load balancer IP | `oke/troubleshooting.md` |
| Build a node pool with workload-specific secondary VNIC profiles | `oke/gva-node-pools.md` -> `oke/multus-multihome.md` if pods need multiple interfaces |
| Validate Multus pod networking on GVA-enabled nodes | `oke/multus-multihome.md` -> `oke/troubleshooting.md` if symptoms remain |
| Investigate OKE workload access to OCI APIs | `oke/troubleshooting.md` |
| Explore or update OCI IoT digital twin resources | `iot-platform/SKILL.md` -> `iot-platform/references/cli-workflows.md` -> `iot-platform/references/resilience-guidance.md` |
| Publish test telemetry to an OCI IoT twin | `iot-platform/SKILL.md` -> `iot-platform/references/cli-workflows.md` -> `iot-platform/templates/publish-curl.template.sh` |
| Build a governed enterprise assistant | `enterprise-ai/SKILL.md` -> `enterprise-ai/agent-workflows/agent-tools.md` -> `enterprise-ai/data/rag-and-search.md` -> `enterprise-ai/governance/private-endpoints-and-governance.md` |

## Scope Boundaries

- Keep OCI service, networking, IAM, agent hosting, and cost-estimation guidance in this domain.
- Route OCI IoT domain, digital twin, adapter, device publish, raw command, and Data API workflows to `oci/iot-platform/`.
- Route Oracle Database-owned implementation details to `db/features/`.
- Route APEX artifact generation to `apex/apexlang/`.
- Prefer official Oracle documentation for OCI service limits, IAM verbs, endpoint formats, regions, and pricing inputs because these change frequently.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/ContEng/home.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contengAttaching_Multiple_VNICs.htm
- https://docs.oracle.com/en-us/iaas/Content/ContEng/Tasks/contenggrantingworkloadaccesstoresources.htm
- https://github.com/oracle-terraform-modules/terraform-oci-oke
- https://docs.oracle.com/en-us/iaas/Content/internet-of-things/home.htm
- https://github.com/oracle-samples/oci-iot-samples
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/overview.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/home.htm
