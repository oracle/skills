# RAG and Search for Oracle Enterprise AI

## Overview

Use this file when the user wants AI answers grounded in documents, files, vector stores, Oracle Database, Autonomous Database, or enterprise structured data. The goal is to route to the simplest retrieval path that matches the source of truth.

## Retrieval Path Selection

| Source of Truth | Recommended Path |
|-----------------|------------------|
| Uploaded files or document collections for an OCI agent | Responses API File Search and vector stores |
| Autonomous Database structured data with natural-language SQL generation | OCI SQL Search or Database Select AI, depending on where the workflow runs |
| Oracle Database document chunks and embeddings | `db/features/vector-search.md` and `db/features/dbms-vector.md` |
| In-database NL2SQL, chat, summarization, or RAG | `db/features/select-ai.md` |
| Images, invoices, forms, or OCR-first workflows | OCI AI Services plus Generative AI post-processing |
| Custom app-owned search indexes | Function Calling or MCP Calling around the existing search service |

## File-Based RAG Journey

1. Confirm the document source, sensitivity, and update frequency.
2. Decide whether files should be uploaded to OCI Enterprise AI resources or indexed through an application-owned pipeline.
3. Use File Search when OCI should manage file retrieval for a Responses API agent.
4. Add rerank when candidate chunks need relevance ordering before generation.
5. Decide whether Object Storage connectors should continuously synchronize files into Vector Stores.
6. Define retention, deletion, and access boundaries for uploaded files and vector stores.
7. Estimate File Search storage, Vector Store storage, retrieval, ingestion, and model-response cost before production.

## Database RAG Journey

Use Oracle Database-owned guidance when vectors or generation run in the database:

- `db/features/vector-search.md` for the `VECTOR` type, vector indexes, and similarity search.
- `db/features/dbms-vector.md` for embedding generation, chunking, and vector package pipelines.
- `db/features/ai-profiles.md` for database AI provider configuration.
- `db/features/select-ai.md` for database-side NL2SQL, chat, summarization, and Select AI Agent patterns.

Do not duplicate database syntax in this Enterprise AI domain. Link to the database skill so version notes and package details stay in one place.

## SQL Search vs Select AI

Use SQL Search when the Enterprise AI agent workflow needs generated SQL from Autonomous Database-backed semantic metadata and the query will be executed separately.

Use Select AI when the user is working inside Autonomous Database or Oracle Database-supported SQL and PL/SQL workflows, including `DBMS_CLOUD_AI` profiles, `SELECT AI`, or in-database generation.

## SQL Search Architecture

For OCI SQL Search, design around these resources:

- Autonomous Database as the source structured data system.
- Database Tools enrichment connection for schema metadata and example-value enrichment.
- Database Tools query connection for lower-privileged query execution.
- Semantic Store, created as structured data in the vector store flow or through the OCI Generative AI API.
- `GenerateSqlFromNl` for SQL generation; execution remains outside the SQL generation API.

Use the DBTools MCP Server or approved database tooling when the user wants generated SQL executed. Keep generation, authorization, execution, and guardrails as separate steps.

## RAG Safety Checklist

- Keep retrieval scopes explicit.
- Separate trusted system instructions from retrieved content.
- Treat retrieved text as untrusted input for prompt-injection purposes.
- Avoid indexing secrets unless the downstream access model can enforce least privilege.
- Log source citations or chunk IDs when answers depend on retrieved content.
- Define freshness expectations for indexes, vector stores, and database embeddings.
- Include storage-hour and retrieval-request cost drivers in RAG designs, not only model inference calls.

## Sources

- https://docs.oracle.com/en-us/iaas/Content/generative-ai/file-search.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/files.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/vector-stores.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/vector-store-file-batches.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/agents.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/tool-support.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/agent-building-blocks.htm
- https://docs.oracle.com/en-us/iaas/Content/generative-ai/nl2sql.htm
- https://docs.oracle.com/en-us/iaas/autonomous-database-serverless/doc/select-ai.htm
- https://docs.oracle.com/en/database/oracle/oracle-database/26/vecse/
