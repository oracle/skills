---
name: enterprise-ai
description: Oracle Enterprise AI guidance for building, deploying, securing, estimating cost for, and integrating AI models, agents, RAG, Responses API workflows, custom or imported models, fine-tuning, model endpoints, private endpoints, vector stores, File Search, Code Interpreter, MCP tools, SQL Search, hosted agentic applications, and Oracle platform integrations. Use when the user asks for OCI Generative AI, Enterprise AI Models, Enterprise AI Agents, governed GenAI applications, agentic workflows, RAG on Oracle Cloud, OCI Generative AI pricing or cost estimator inputs, or a simplified path across OCI, Autonomous Database, APEX, and other Oracle services.
---

# OCI Enterprise AI Skills

Use this OCI subdomain as the front door for Oracle Enterprise AI work. Start here when the user goal is about the AI outcome rather than a specific Oracle service name.

## How to Use This Domain

1. Start with the user journey table below.
2. Read only the smallest topic file that matches the task.
3. Route database-owned implementation details to `db/features/` instead of duplicating Select AI, vector search, or `DBMS_VECTOR` guidance.

## Directory Structure

```text
oci/enterprise-ai/
├── models/
├── agent-workflows/
├── governance/
├── data/
├── cost/
├── integrations/
└── agents/
    └── openai.yaml
```

## User Journey Routing

| User Goal | Start With |
|-----------|------------|
| Choose or invoke OCI-hosted models, embeddings, rerank, endpoints, or dedicated serving | `models/enterprise-ai-models.md` |
| Import, fine-tune, host, or lifecycle-manage a custom model | `models/custom-and-imported-models.md` |
| Build an API-first agent with OpenAI-compatible OCI APIs | `agent-workflows/responses-api-agents.md` |
| Deploy a packaged agent runtime on OCI-managed infrastructure | `agent-workflows/hosted-applications.md` |
| Choose the right tool pattern: File Search, Code Interpreter, Function Calling, MCP, or SQL Search | `agent-workflows/agent-tools.md` |
| Ground answers in documents, vector stores, SQL, or Oracle Database vector search | `data/rag-and-search.md` |
| Estimate OCI Generative AI or OCI Generative AI Agents cost drivers | `cost/cost-estimation.md` |
| Secure model or agent access with IAM, private networking, OAuth, guardrails, or audit controls | `governance/private-endpoints-and-governance.md` |
| Connect Enterprise AI to Autonomous Database, APEX, Oracle Integration, Fusion, or OCI AI Services | `integrations/oracle-platform-integrations.md` |

## Key Starting Points

- `oci/enterprise-ai/models/enterprise-ai-models.md`
- `oci/enterprise-ai/models/custom-and-imported-models.md`
- `oci/enterprise-ai/agent-workflows/responses-api-agents.md`
- `oci/enterprise-ai/agent-workflows/hosted-applications.md`
- `oci/enterprise-ai/agent-workflows/agent-tools.md`
- `oci/enterprise-ai/data/rag-and-search.md`
- `oci/enterprise-ai/cost/cost-estimation.md`
- `oci/enterprise-ai/governance/private-endpoints-and-governance.md`

## Common Multi-Step Flows

| Task | Recommended Sequence |
|------|----------------------|
| Build a governed enterprise assistant | `responses-api-agents` -> `agent-tools` -> `rag-and-search` -> `cost-estimation` -> `private-endpoints-and-governance` |
| Move from model experimentation to production serving | `enterprise-ai-models` -> `cost-estimation` -> `private-endpoints-and-governance` |
| Bring a custom model into OCI serving | `custom-and-imported-models` -> `enterprise-ai-models` -> `cost-estimation` -> `private-endpoints-and-governance` |
| Deploy a packaged agent runtime | `responses-api-agents` -> `hosted-applications` -> `cost-estimation` -> `private-endpoints-and-governance` |
| Build RAG over files | `rag-and-search` -> `agent-tools` -> `cost-estimation` -> `responses-api-agents` |
| Build RAG over Oracle Database | `rag-and-search` -> `db/features/vector-search.md` -> `db/features/dbms-vector.md` -> `db/features/select-ai.md` when in-database generation is needed |
| Add AI to APEX or Autonomous Database apps | `oracle-platform-integrations` -> relevant `db/features/` or `apex/apexlang/` guidance |
| Design production access controls | `private-endpoints-and-governance` -> `enterprise-ai-models` or `responses-api-agents` depending on workload |

## Scope Boundaries

- Keep cloud-side model, agent, tool, endpoint, hosting, and governance decisions in this domain.
- Use `db/features/select-ai.md`, `db/features/vector-search.md`, `db/features/dbms-vector.md`, and `db/features/ai-profiles.md` for Oracle Database-owned AI implementation.
- Use `apex/apexlang/` for APEX application artifact generation and APEX AI agent component templates.
- Prefer official Oracle documentation for model availability, supported tools, IAM verbs, endpoint formats, and service limits because Enterprise AI services change frequently.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/generative-ai/overview.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/home.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/models.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/fine-tune-models.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/imported-models.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/agents.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/governance.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/oci-openai.htm
- https://www.oracle.com/artificial-intelligence/enterprise-ai/cost-estimator/
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/calculate-cost.htm
