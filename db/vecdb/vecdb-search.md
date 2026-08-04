# VecDB Search and Reranking

Use the current client equivalent for text, dense-vector, or record-ID
retrieval: Python SDK `query()`, REST
`/vecdb/vector-tables/{vector_table_name}/query`, or
`DBMS_VECTOR_DATABASE.SEARCH`. The Python SDK uses snake_case arguments such
as `query_by` and `top_k`; REST uses camelCase such as `queryBy` and `topK`.
VecDB requires Oracle AI Database 26ai+ at database version `23.26.3` or later.
Select the query shape that matches the table: text needs integrated embeddings;
vector search needs a compatible vector; record-ID search finds records with the same record-ID.

Before writing a search or rerank operation, read the matching row in
`vecdb-api-reference.md`. Verify that `query_by` has exactly one of `text`,
`vector`, or `id`; use documented filters and a bounded `top_k`; and read the
current `advanced_options` contract before tuning recall, latency, or distance.
Do not copy filter syntax from another vector database.

For the Python SDK, consume `QueryResponse.items`: each item contains `id`,
`metadata`, and `distance`, plus `vector` only when `include_vectors=True`.
`outputSelector` is a direct REST request field; do not pass it to Python
`query()` unless a current SDK reference explicitly adds it.

Rerank only after initial retrieval and only when discovery confirms a loaded
reranking model. Use the matching `rerank` operation for the selected client
surface and preserve the returned item `index` when mapping scores back to
retrieved metadata. Retrieval itself is read-only; changing tables, models, or
indexes requires the relevant confirmation in the linked reference.

## Oracle Version Notes (19c vs 26ai)

Oracle Database 19c does not support VecDB search or reranking. Use Oracle AI
Database 26ai+ at database version `23.26.3` or later. SDK and REST access
require ORDS `26.2.2` or later.

## Sources

- Oracle VecDB Python SDK API reference, including architecture and workflows:
  https://docs.oracle.com/en/cloud/paas/autonomous-vector-database/vcapi/
- Oracle Vector Database REST API reference:
  https://docs.oracle.com/en/database/oracle/oracle-rest-data-services/26.2/orrst
- Oracle DBMS_VECTOR_DATABASE PL/SQL API reference:
  https://docs.oracle.com/en/database/oracle/oracle-database/26/arpls/
