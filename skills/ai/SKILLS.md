# AI Skills Index

Complete index for AI-related skills in `skills/ai/`. Start with the overview guides when the question is broad, then load the narrower skill that matches the task.

## Start Here

| File | Description |
|------|-------------|
| `select-ai.md` | Select AI overview, capability boundaries, and routing to the right Select AI skill |
| `ai-vector-search.md` | AI Vector Search overview, capability boundaries, and routing to the right vector-search skill |

## Task Routing

| If you need to... | Read |
|-------------------|------|
| understand what Select AI covers before choosing an implementation path | `select-ai.md` |
| improve overall Select AI NL2SQL accuracy | `select-ai-accuracy.md` |
| configure providers, credentials, models, or session activation | `select-ai-profiles.md` |
| choose between `showsql`, `runsql`, `showprompt`, `chat`, or `agent` | `select-ai-actions.md` |
| design and audit Select AI annotations for NL2SQL | `select-ai-annotations.md` |
| shape prompts, inspect prompt augmentation, or guide prompt wording | `select-ai-prompts.md` |
| improve NL2SQL with `object_list`, comments, annotations, or constraints | `select-ai-metadata.md` |
| apply or troubleshoot SQL refinement feedback | `select-ai-feedback.md` |
| use Select AI with a vector store for RAG | `select-ai-rag.md` |
| build teams, agents, tasks, or tools with `DBMS_CLOUD_AI_AGENT` | `select-ai-agent.md` |
| generate synthetic data with Select AI | `select-ai-synthetic-data.md` |
| understand what Oracle AI Vector Search covers before choosing storage or indexing details | `ai-vector-search.md` |
| define `VECTOR` columns, formats, dense/sparse storage, or restrictions | `vector-data-type.md` |
| chunk content, import ONNX models, or build embedding pipelines | `vector-embeddings.md` |
| choose between `DBMS_VECTOR`, `DBMS_VECTOR_CHAIN`, and `DBMS_HYBRID_VECTOR` package APIs | `vector-packages.md` |
| use reranking, summarization, generated text, or other package-level vector helpers | `vector-packages.md` |
| choose distance metrics, operators, or exact versus approximate SQL | `vector-operations.md` |
| choose between IVF and HNSW or use vector-index advisors | `vector-indexes.md` |
| implement keyword + semantic retrieval with hybrid vector indexes | `hybrid-vector-search.md` |
| inspect vector memory, initialization parameters, or vector-specific views | `vector-diagnostics.md` |

## Select AI

| File | Description |
|------|-------------|
| `select-ai.md` | Select AI overview, capability boundaries, and routing guide |
| `select-ai-accuracy.md` | cross-cutting Select AI accuracy workflow: scope, metadata, inspection, case sensitivity, and feedback |
| `select-ai-annotations.md` | annotation DDL, profile integration, annotation views, and Select AI metadata usage |
| `select-ai-profiles.md` | AI profile lifecycle, attributes, provider configuration, session activation |
| `select-ai-prompts.md` | prompt wording rules, `showprompt`, prompt augmentation, and action guidance |
| `select-ai-actions.md` | `SELECT AI` / `DBMS_CLOUD_AI.GENERATE` actions, `showprompt`, `chat`, `translate`, `summarize` |
| `select-ai-metadata.md` | `object_list`, metadata controls, comments, annotations, constraints, data access |
| `select-ai-feedback.md` | `feedback` action, `DBMS_CLOUD_AI.FEEDBACK`, feedback vector index, SQL refinement workflow |
| `select-ai-rag.md` | Select AI RAG flow, vector-index integration, `embedding_model`, `enable_sources` |
| `select-ai-agent.md` | `DBMS_CLOUD_AI_AGENT`, teams, agents, tasks, tools, built-in tool support |
| `select-ai-synthetic-data.md` | `GENERATE_SYNTHETIC_DATA`, params, monitoring status tables, metadata-clone workflows |

## AI Vector Search

| File | Description |
|------|-------------|
| `ai-vector-search.md` | AI Vector Search overview, capability boundaries, and routing guide |
| `vector-data-type.md` | `VECTOR` type definitions, dense/sparse formats, restrictions, vector descriptors |
| `vector-embeddings.md` | ONNX models, third-party embeddings, chunking, `DBMS_VECTOR_CHAIN` pipelines |
| `vector-packages.md` | `DBMS_VECTOR`, `DBMS_VECTOR_CHAIN`, `DBMS_HYBRID_VECTOR`, reranking, generated text, package selection |
| `vector-operations.md` | distance metrics, operators, exact/approximate search, vector SQL functions |
| `vector-indexes.md` | IVF/HNSW, `CREATE VECTOR INDEX`, advisor procedures, restrictions |
| `hybrid-vector-search.md` | `CREATE HYBRID VECTOR INDEX`, `DBMS_HYBRID_VECTOR`, hybrid query patterns |

## Advanced / Diagnostics

| File | Description |
|------|-------------|
| `select-ai-agent.md` | agent teams, tasks, and tools for Select AI workflows |
| `select-ai-synthetic-data.md` | synthetic data generation workflows and monitoring |
| `vector-diagnostics.md` | vector memory pool, initialization parameters, and diagnostic views |
