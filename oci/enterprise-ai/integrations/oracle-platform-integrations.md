# Oracle Platform Integrations for Enterprise AI

## Overview

Use this file when the user's Enterprise AI journey crosses Oracle services. Route to the service that owns the implementation while keeping the user journey anchored in the AI outcome.

## Integration Routing

| User Goal | Route |
|-----------|-------|
| Natural-language SQL, database chat, or in-database AI profiles | `db/features/select-ai.md` and `db/features/ai-profiles.md` |
| Vector search, embeddings, and RAG stored in Oracle Database | `db/features/vector-search.md` and `db/features/dbms-vector.md` |
| APEX app generation or APEX AI agent component artifacts | `apex/apexlang/` |
| OCR, document extraction, image analysis, language, or speech before GenAI | OCI AI Services documentation and service-specific SDKs |
| Agent workflow that calls enterprise systems | `oci/enterprise-ai/agent-workflows/agent-tools.md` with Function Calling or MCP Calling |

## Autonomous Database and Select AI

Use database guidance when AI is configured or executed from SQL or PL/SQL. Select AI and AI profiles are database-owned capabilities, even when the provider is OCI Generative AI.

Useful handoffs:

- `db/features/select-ai.md`
- `db/features/ai-profiles.md`
- `db/features/vector-search.md`
- `db/features/dbms-vector.md`
- `db/sqlcl/sqlcl-mcp-server.md`

## APEX

Use APEX guidance when the deliverable is an APEX application, page, component, AI agent artifact, or APEXlang output. Keep Enterprise AI responsible for the high-level model, agent, RAG, and governance decisions; let APEX own generated application structure.

## OCI AI Services

Use OCI AI Services when the task is better solved by a specialized pretrained or custom service before involving a generative model:

- Document Understanding for document text, tables, key-value extraction, classification, and custom document models.
- Vision for image analysis, OCR-style extraction, object detection, and classification.
- Language for sentiment, entities, key phrases, language detection, translation, or custom text models.
- Speech for speech-to-text or text-to-speech workflows.

Generative AI can then summarize, normalize, reason over, or transform the extracted outputs.

## Integration Safety

- Keep source-system authorization outside the model.
- Prefer tool calls with explicit parameters over prompt parsing for stable business inputs.
- Preserve source references when AI output is based on retrieved enterprise records.
- Avoid copying sensitive enterprise data into model prompts when a retrieval or tool-mediated path can enforce narrower access.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/generative-ai/overview.htm
- https://docs.oracle.com/iaas/Content/document-understanding/using/home.htm
- https://docs.oracle.com/en-us/iaas/Content/vision/using/home.htm
- https://docs.oracle.com/en-us/iaas/Content/language/using/home.htm
- https://docs.oracle.com/en-us/iaas/Content/speech/home.htm
- https://docs.oracle.com/en-us/iaas/autonomous-database-serverless/doc/select-ai.htm
