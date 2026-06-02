---
name: oci
description: Oracle Cloud Infrastructure skills for OCI service guidance, including Enterprise AI workflows for OCI Generative AI models, Responses API agents, RAG, cost estimation, governance, private endpoints, hosted agentic applications, and Oracle platform integrations.
---

# Oracle Cloud Infrastructure Skills

Use this domain for Oracle Cloud Infrastructure guidance. Enterprise AI is part of this OCI domain because it is built around OCI Generative AI, OCI networking, IAM, cost estimation, hosted applications, and OCI platform integrations.

## How to Use This Domain

1. Start with the category routing table below.
2. Read the smallest nested skill or topic file that matches the task.
3. Keep OCI-owned design decisions here, and route database-owned SQL, vector, and Select AI implementation details to `db/features/`.

## Directory Structure

```text
oci/
├── SKILL.md
└── enterprise-ai/
    ├── SKILL.md
    ├── models/
    ├── agent-workflows/
    ├── governance/
    ├── data/
    ├── cost/
    └── integrations/
```

## Category Routing

| Topic | Start With |
|-------|------------|
| OCI Generative AI models, custom/imported models, endpoints, or private endpoints | `oci/enterprise-ai/SKILL.md` |
| OCI Responses API agents, tools, memory, File Search, Code Interpreter, MCP, or SQL Search | `oci/enterprise-ai/SKILL.md` |
| OCI Generative AI and OCI Generative AI Agents cost estimation | `oci/enterprise-ai/cost/cost-estimation.md` |
| OCI Enterprise AI governance, IAM, API keys, OAuth, guardrails, or ZPR | `oci/enterprise-ai/governance/private-endpoints-and-governance.md` |

## Key Starting Points

- `oci/enterprise-ai/SKILL.md`
- `oci/enterprise-ai/models/enterprise-ai-models.md`
- `oci/enterprise-ai/agent-workflows/responses-api-agents.md`
- `oci/enterprise-ai/cost/cost-estimation.md`
- `oci/enterprise-ai/governance/private-endpoints-and-governance.md`

## Scope Boundaries

- Keep OCI service, networking, IAM, agent hosting, and cost-estimation guidance in this domain.
- Route Oracle Database-owned implementation details to `db/features/`.
- Route APEX artifact generation to `apex/apexlang/`.
- Prefer official Oracle documentation for OCI service limits, IAM verbs, endpoint formats, regions, and pricing inputs because these change frequently.
