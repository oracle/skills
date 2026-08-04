# VecDB Models

Use model lifecycle operations only when the user asks to discover, load,
describe, or drop a model, or needs documented embedding or reranking support.
VecDB requires Oracle AI Database 26ai+ at database version `23.26.3` or later.

Start with model discovery, then use the appropriate current client equivalent:
Python SDK `list_models()`, `load_model()`, `describe_model()`, and
`drop_model()`; REST `/vecdb/models/`; or `DBMS_VECTOR_DATABASE.LIST_MODELS`,
`LOAD_MODEL`, `DESCRIBE_MODEL`, and `DROP_MODEL`. Describe the relevant loaded
model before using or changing it.

Before writing a model operation, read the matching row in
`vecdb-api-reference.md`. In particular, verify `model_name`, `url`, and
`model_params`; private object storage needs a documented database credential,
and a reranking model requires the documented metadata such as
`{"function": "regression"}`. Do not invent a model source, credential, or
metadata object.
Use integrated embeddings for table ingestion when a suitable model is already
loaded; use standalone embedding or reranking only when the application needs
it. Do not hard-code a model name before discovery. Read
`vecdb-architecture.md` for the access-path decision and `vecdb-search.md` for
retrieval and reranking behavior.

Loading and dropping models can be costly or destructive. Ask for explicit
confirmation and verify dependencies before either action. Do not put model
sources, storage URLs, credentials, or private data in committed material.

## Oracle Version Notes (19c vs 26ai)

Oracle Database 19c does not support VecDB model management. Use Oracle AI
Database 26ai+ at database version `23.26.3` or later. SDK and REST access
require ORDS `26.2.2` or later.

## Sources

- Oracle VecDB Python SDK API reference, including architecture and workflows:
  https://docs.oracle.com/en/cloud/paas/autonomous-vector-database/vcapi/
- Oracle Vector Database REST API reference:
  https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/26.2/orrst
- Oracle DBMS_VECTOR_DATABASE PL/SQL API reference:
  https://docs.oracle.com/en/database/oracle/oracle-database/26/arpls/
